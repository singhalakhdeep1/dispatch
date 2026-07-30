import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    Inject,
    Logger,
} from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import { PrismaClient, OrderStatus } from "@orderhub/database";
import { PRISMA_TOKEN } from "../database/database.module";
import { KafkaService } from "../kafka/kafka.service";
import { LoyaltyService } from "../loyalty/loyalty.service";
import {
    PlaceOrderDto,
    CancelOrderDto,
    ListOrdersDto,
    KAFKA_TOPICS,
    OrderPlacedPayload,
    OrderCancelledPayload,
    haversineKm,
    calculateDeliveryFee,
    formatMoney,
    PaginatedResponse,
    JwtPayload,
} from "@orderhub/shared";

@Injectable()
export class OrdersService {
    private readonly logger = new Logger(OrdersService.name);

    constructor(
        @Inject(PRISMA_TOKEN) private readonly prisma: PrismaClient,
        private readonly kafka: KafkaService,
        private readonly http: HttpService,
        private readonly config: ConfigService,
        private readonly loyaltyService: LoyaltyService,
    ) {}

    async place(dto: PlaceOrderDto, user: JwtPayload) {
        // Fetch restaurant
        const restaurant = await this.prisma.restaurant.findUniqueOrThrow({
            where: { id: dto.restaurantId },
        });

        if (restaurant.status !== "OPEN") {
            throw new BadRequestException("Restaurant is currently closed");
        }

        // Fetch menu items and validate
        const menuItemIds = dto.items.map((i) => i.menuItemId);
        const menuItems = await this.prisma.menuItem.findMany({
            where: { id: { in: menuItemIds }, restaurantId: dto.restaurantId, isAvailable: true },
        });

        if (menuItems.length !== menuItemIds.length) {
            throw new BadRequestException("One or more items are unavailable or not from this restaurant");
        }

        // Build order items with price snapshots
        const itemsMap = new Map(menuItems.map((m) => [m.id, m]));
        const orderItems = dto.items.map((i) => {
            const item = itemsMap.get(i.menuItemId)!;
            return {
                menuItemId: i.menuItemId,
                name: item.name,
                quantity: i.quantity,
                unitPrice: item.price,
                subtotal: item.price * i.quantity,
            };
        });

        const itemsTotal = orderItems.reduce((sum, i) => sum + i.subtotal, 0);

        // Get surge + delivery fee from pricing service
        const distanceKm = haversineKm(
            restaurant.latitude,
            restaurant.longitude,
            dto.deliveryLat,
            dto.deliveryLng,
        );

        let surgeMultiplier = 1.0;
        let deliveryFee = calculateDeliveryFee(distanceKm, 1.0);
        let estimatedDeliveryMins = Math.ceil((distanceKm / 20) * 60 + 5);

        try {
            const pricingUrl = this.config.get<string>("app.services.pricingUrl");
            const { data } = await firstValueFrom(
                this.http.post(`${pricingUrl}/pricing/calculate`, {
                    restaurantLat: restaurant.latitude,
                    restaurantLng: restaurant.longitude,
                    deliveryLat: dto.deliveryLat,
                    deliveryLng: dto.deliveryLng,
                }),
            );
            surgeMultiplier = data.surgeMultiplier ?? 1.0;
            deliveryFee = data.deliveryFee ?? deliveryFee;
            estimatedDeliveryMins = data.estimatedDeliveryMins ?? estimatedDeliveryMins;
        } catch {
            this.logger.warn("Pricing service unavailable — using local calculation");
        }

        const platformFee = 499; // ₹4.99
        const totalAmount = itemsTotal + deliveryFee + platformFee;

        // Create order in DB
        const order = await this.prisma.order.create({
            data: {
                userId: user.sub,
                restaurantId: dto.restaurantId,
                addressId: dto.addressId,
                status: OrderStatus.PLACED,
                itemsTotal,
                deliveryFee,
                platformFee,
                discount: 0,
                totalAmount,
                surgeMultiplier,
                deliveryAddress: dto.deliveryAddress,
                deliveryLat: dto.deliveryLat,
                deliveryLng: dto.deliveryLng,
                instructions: dto.instructions,
                estimatedDeliveryMins,
                items: { create: orderItems },
            },
            include: { items: true, restaurant: true },
        });

        // Emit Kafka event — saga starts here
        await this.kafka.emit<OrderPlacedPayload>(KAFKA_TOPICS.ORDER_PLACED, {
            orderId: order.id,
            userId: user.sub,
            restaurantId: order.restaurantId,
            restaurantLat: restaurant.latitude,
            restaurantLng: restaurant.longitude,
            deliveryLat: dto.deliveryLat,
            deliveryLng: dto.deliveryLng,
            totalAmount: order.totalAmount,
            itemCount: orderItems.length,
        });

        this.logger.log(`Order ${order.id} placed by ${user.email}`);
        return this.serialize(order);
    }

    async findAll(dto: ListOrdersDto, user: JwtPayload): Promise<PaginatedResponse<unknown>> {
        const where = {
            userId: user.sub,
            ...(dto.status ? { status: dto.status as OrderStatus } : {}),
        };

        const [data, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                include: { restaurant: { select: { id: true, name: true, imageUrl: true } }, items: true },
                orderBy: { createdAt: "desc" },
                skip: (dto.page - 1) * dto.pageSize,
                take: dto.pageSize,
            }),
            this.prisma.order.count({ where }),
        ]);

        return {
            data: data.map((o) => this.serialize(o)),
            total,
            page: dto.page,
            pageSize: dto.pageSize,
            totalPages: Math.ceil(total / dto.pageSize),
        };
    }

    async findOne(id: string, user: JwtPayload) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: {
                restaurant: true,
                items: { include: { menuItem: true } },
                driver: { include: { user: { select: { fullName: true, phone: true } } } },
            },
        });

        if (!order) throw new NotFoundException("Order not found");

        // Customers can only see their own orders; drivers can see orders assigned to them
        if (user.role === "CUSTOMER" && order.userId !== user.sub) {
            throw new ForbiddenException();
        }
        if (user.role === "DRIVER" && order.driver?.userId !== user.sub) {
            throw new ForbiddenException();
        }

        return this.serialize(order);
    }

    async cancel(id: string, dto: CancelOrderDto, user: JwtPayload) {
        const order = await this.prisma.order.findUniqueOrThrow({ where: { id } });

        if (order.userId !== user.sub) throw new ForbiddenException();

        const cancellableStatuses: OrderStatus[] = [OrderStatus.PLACED, OrderStatus.FINDING_DRIVER];
        if (!cancellableStatuses.includes(order.status)) {
            throw new BadRequestException(
                `Order cannot be cancelled in status: ${order.status}`,
            );
        }

        const updated = await this.prisma.order.update({
            where: { id },
            data: {
                status: OrderStatus.CANCELLED,
                cancelledAt: new Date(),
                cancelReason: dto.reason,
            },
        });

        await this.kafka.emit<OrderCancelledPayload>(KAFKA_TOPICS.ORDER_CANCELLED, {
            orderId: id,
            userId: user.sub,
            driverId: order.driverId ?? undefined,
            cancelReason: dto.reason,
            cancelledAt: updated.cancelledAt!.toISOString(),
        });

        return this.serialize(updated);
    }

    async updateStatus(id: string, newStatus: OrderStatus, user: JwtPayload) {
        const order = await this.prisma.order.findUniqueOrThrow({
            where: { id },
            include: { driver: true },
        });

        if (order.driver?.userId !== user.sub && user.role !== "ADMIN") {
            throw new ForbiddenException("Only the assigned driver can update order status");
        }

        const timestamps: Record<string, unknown> = {};
        if (newStatus === OrderStatus.PICKED_UP) timestamps.pickedUpAt = new Date();
        if (newStatus === OrderStatus.DELIVERED) timestamps.deliveredAt = new Date();

        const updated = await this.prisma.order.update({
            where: { id },
            data: { status: newStatus, ...timestamps },
        });

        // Emit correct saga event
        if (newStatus === OrderStatus.PICKED_UP) {
            await this.kafka.emit(KAFKA_TOPICS.ORDER_PICKED_UP, {
                orderId: id,
                driverId: order.driverId,
                userId: order.userId,
                pickedUpAt: updated.pickedUpAt!.toISOString(),
            });
        } else if (newStatus === OrderStatus.DELIVERED) {
            await this.kafka.emit(KAFKA_TOPICS.ORDER_DELIVERED, {
                orderId: id,
                driverId: order.driverId,
                userId: order.userId,
                deliveredAt: updated.deliveredAt!.toISOString(),
                totalAmount: order.totalAmount,
            });
        }

        return this.serialize(updated);
    }

    // ── Restaurants (served from Orders DB) ──────────────────────────────────

    async listRestaurants(query: {
        latitude?: number;
        longitude?: number;
        radiusKm?: number;
        cuisine?: string;
        page?: number;
        pageSize?: number;
    }) {
        const page = query.page ?? 1;
        const pageSize = query.pageSize ?? 20;

        const where: any = { status: "OPEN" };
        if (query.cuisine) {
            where.cuisineType = { has: query.cuisine };
        }

        const [data, total] = await Promise.all([
            this.prisma.restaurant.findMany({
                where,
                orderBy: [{ rating: "desc" }, { name: "asc" }],
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            this.prisma.restaurant.count({ where }),
        ]);

        // If coords provided, add distance and sort
        let enriched = data as any[];
        if (query.latitude && query.longitude) {
            enriched = data
                .map((r) => ({
                    ...r,
                    distanceKm: haversineKm(query.latitude!, query.longitude!, r.latitude, r.longitude),
                }))
                .filter((r) => !query.radiusKm || r.distanceKm <= (query.radiusKm ?? 5))
                .sort((a, b) => a.distanceKm - b.distanceKm);
        }

        return { data: enriched, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    }

    async getRestaurant(id: string) {
        return this.prisma.restaurant.findUniqueOrThrow({
            where: { id },
            include: {
                menuItems: {
                    where: { isAvailable: true },
                    orderBy: { name: "asc" },
                },
            },
        });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private serialize(order: any) {
        return {
            ...order,
            itemsTotalFormatted: formatMoney(order.itemsTotal),
            deliveryFeeFormatted: formatMoney(order.deliveryFee ?? 0),
            totalAmountFormatted: formatMoney(order.totalAmount),
        };
    }
}

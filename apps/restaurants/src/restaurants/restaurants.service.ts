import {
    Injectable,
    Inject,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    Logger,
} from "@nestjs/common";
import { PrismaClient, RestaurantStatus } from "@orderhub/database";
import { Redis } from "ioredis";
import { PRISMA_TOKEN } from "../database/database.module";
import { REDIS_TOKEN } from "../redis/redis.module";
import { KafkaService } from "../kafka/kafka.service";
import { KafkaTopic } from "@orderhub/shared";

const RESTAURANT_CACHE_TTL = 300; // 5 minutes

@Injectable()
export class RestaurantsService {
    private readonly logger = new Logger(RestaurantsService.name);

    constructor(
        @Inject(PRISMA_TOKEN) private readonly prisma: PrismaClient,
        @Inject(REDIS_TOKEN) private readonly redis: Redis,
        private readonly kafka: KafkaService,
    ) { }

    // ─── List (with geo filtering) ────────────────────────────────────────────

    async findAll(query: {
        page?: number;
        pageSize?: number;
        lat?: number;
        lng?: number;
        radiusKm?: number;
        cuisine?: string;
        search?: string;
        isVeg?: boolean;
        minRating?: number;
        sortBy?: "rating" | "deliveryTime" | "distance";
        status?: RestaurantStatus;
    }) {
        const {
            page = 1,
            pageSize = 20,
            lat,
            lng,
            radiusKm = 10,
            cuisine,
            search,
            isVeg,
            minRating,
            sortBy = "rating",
            status = RestaurantStatus.OPEN,
        } = query;

        const skip = (page - 1) * pageSize;

        const where: any = { status };

        if (cuisine) {
            where.cuisineType = { contains: cuisine, mode: "insensitive" };
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { cuisineType: { contains: search, mode: "insensitive" } },
            ];
        }
        if (isVeg !== undefined) {
            where.isVeg = isVeg;
        }
        if (minRating !== undefined) {
            where.rating = { gte: minRating };
        }

        // Geo filter — if lat/lng provided, filter by delivery radius using raw SQL
        // PostGIS ST_DWithin (degrees fallback if PostGIS unavailable)
        let restaurantIds: string[] | undefined;
        if (lat !== undefined && lng !== undefined) {
            const rows = await this.prisma.$queryRaw<{ id: string }[]>`
                SELECT id
                FROM "Restaurant"
                WHERE ST_DWithin(
                    ST_MakePoint(longitude, latitude)::geography,
                    ST_MakePoint(${lng}, ${lat})::geography,
                    ${radiusKm * 1000}
                )
                AND status = ${status}
            `;
            restaurantIds = rows.map((r) => r.id);
            if (restaurantIds.length === 0) return { data: [], total: 0, page, pageSize, totalPages: 0 };
            where.id = { in: restaurantIds };
        }

        const [restaurants, total] = await Promise.all([
            this.prisma.restaurant.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: sortBy === "rating" ? { rating: "desc" } : { createdAt: "desc" },
                include: {
                    owner: { select: { id: true, name: true } },
                    _count: { select: { menuItems: true, reviews: true } },
                },
            }),
            this.prisma.restaurant.count({ where }),
        ]);

        return {
            data: restaurants,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    }

    // ─── Get One ──────────────────────────────────────────────────────────────

    async findOne(id: string) {
        const cacheKey = `restaurant:${id}`;
        const cached = await this.redis.get(cacheKey);
        if (cached) return JSON.parse(cached);

        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id },
            include: {
                owner: { select: { id: true, name: true, phone: true } },
                categories: {
                    where: { isActive: true },
                    orderBy: { sortOrder: "asc" },
                    include: {
                        menuItems: {
                            where: { isAvailable: true },
                            orderBy: [{ isBestseller: "desc" }, { sortOrder: "asc" }],
                        },
                    },
                },
                reviews: {
                    take: 10,
                    orderBy: { createdAt: "desc" },
                    include: { user: { select: { id: true, name: true, avatar: true } } },
                },
                _count: { select: { reviews: true } },
            },
        });

        if (!restaurant) throw new NotFoundException("Restaurant not found");

        await this.redis.setex(cacheKey, RESTAURANT_CACHE_TTL, JSON.stringify(restaurant));
        return restaurant;
    }

    // ─── Get Mine (for restaurant owners) ─────────────────────────────────────

    async findMine(ownerId: string) {
        return this.prisma.restaurant.findMany({
            where: { ownerId },
            include: { _count: { select: { menuItems: true, reviews: true, orders: true } } },
        });
    }

    // ─── Create ───────────────────────────────────────────────────────────────

    async create(ownerId: string, dto: {
        name: string;
        description?: string;
        phone: string;
        email: string;
        address: string;
        city: string;
        state: string;
        pincode: string;
        latitude: number;
        longitude: number;
        cuisineType: string;
        isVeg?: boolean;
        coverImageUrl?: string;
        openingTime: string;
        closingTime: string;
        deliveryRadius?: number;
        minOrderAmount?: number;
        avgDeliveryTime?: number;
        taxPercent?: number;
        packagingFee?: number;
        fssaiLicense: string;
    }) {
        const restaurant = await this.prisma.restaurant.create({
            data: {
                ...dto,
                ownerId,
                status: RestaurantStatus.PENDING_APPROVAL,
            },
        });

        this.logger.log(`Restaurant created: ${restaurant.id} by owner ${ownerId}`);
        return restaurant;
    }

    // ─── Update ───────────────────────────────────────────────────────────────

    async update(id: string, ownerId: string, dto: Partial<{
        name: string;
        description: string;
        phone: string;
        email: string;
        address: string;
        city: string;
        state: string;
        pincode: string;
        latitude: number;
        longitude: number;
        cuisineType: string;
        isVeg: boolean;
        coverImageUrl: string;
        openingTime: string;
        closingTime: string;
        deliveryRadius: number;
        minOrderAmount: number;
        avgDeliveryTime: number;
        taxPercent: number;
        packagingFee: number;
        fssaiLicense: string;
    }>) {
        await this.assertOwner(id, ownerId);
        const restaurant = await this.prisma.restaurant.update({ where: { id }, data: dto });
        await this.redis.del(`restaurant:${id}`);
        return restaurant;
    }

    // ─── Update Status (admin) ────────────────────────────────────────────────

    async updateStatus(id: string, status: RestaurantStatus, adminId: string) {
        const restaurant = await this.prisma.restaurant.update({
            where: { id },
            data: { status, isVerified: status === RestaurantStatus.OPEN },
        });

        await this.redis.del(`restaurant:${id}`);

        if (status === RestaurantStatus.OPEN) {
            await this.kafka.emit(KafkaTopic.RESTAURANT_APPROVED, {
                restaurantId: id,
                ownerId: restaurant.ownerId,
                restaurantName: restaurant.name,
            });
        }

        this.logger.log(`Restaurant ${id} status updated to ${status} by admin ${adminId}`);
        return restaurant;
    }

    // ─── Toggle Open/Closed (owner) ───────────────────────────────────────────

    async toggleOpen(id: string, ownerId: string, open: boolean) {
        await this.assertOwner(id, ownerId);
        const status = open ? RestaurantStatus.OPEN : RestaurantStatus.TEMPORARILY_CLOSED;
        const restaurant = await this.prisma.restaurant.update({ where: { id }, data: { status } });
        await this.redis.del(`restaurant:${id}`);
        return restaurant;
    }

    // ─── Delete ───────────────────────────────────────────────────────────────

    async remove(id: string, ownerId: string) {
        await this.assertOwner(id, ownerId);
        await this.prisma.restaurant.delete({ where: { id } });
        await this.redis.del(`restaurant:${id}`);
    }

    // ─── Analytics ────────────────────────────────────────────────────────────

    async getAnalytics(restaurantId: string, ownerId: string, days = 30) {
        await this.assertOwner(restaurantId, ownerId);
        const since = new Date();
        since.setDate(since.getDate() - days);

        const [orders, totalRevenue, popularItems, ratingBreakdown] = await Promise.all([
            this.prisma.order.findMany({
                where: {
                    restaurantId,
                    createdAt: { gte: since },
                    status: { notIn: ["CANCELLED", "REFUNDED"] as any },
                },
                select: { id: true, totalAmount: true, createdAt: true, status: true },
            }),
            this.prisma.order.aggregate({
                where: {
                    restaurantId,
                    createdAt: { gte: since },
                    status: { notIn: ["CANCELLED", "REFUNDED"] as any },
                },
                _sum: { totalAmount: true },
                _count: { _all: true },
                _avg: { totalAmount: true },
            }),
            this.prisma.orderItem.groupBy({
                by: ["menuItemId"],
                where: { order: { restaurantId, createdAt: { gte: since } } },
                _sum: { quantity: true },
                orderBy: { _sum: { quantity: "desc" } },
                take: 5,
            }),
            this.prisma.review.groupBy({
                by: ["rating"],
                where: { restaurantId, targetType: "RESTAURANT" as any },
                _count: { _all: true },
            }),
        ]);

        // Enrich popular items with names
        const itemIds = popularItems.map((i) => i.menuItemId);
        const items = await this.prisma.menuItem.findMany({
            where: { id: { in: itemIds } },
            select: { id: true, name: true, imageUrl: true, price: true },
        });
        const itemMap = Object.fromEntries(items.map((i) => [i.id, i]));

        return {
            period: { days, since },
            summary: {
                totalOrders: totalRevenue._count._all,
                totalRevenuePaise: totalRevenue._sum.totalAmount ?? 0,
                avgOrderValuePaise: Math.round(Number(totalRevenue._avg.totalAmount ?? 0)),
            },
            popularItems: popularItems.map((p) => ({
                ...itemMap[p.menuItemId],
                totalQuantity: p._sum.quantity ?? 0,
            })),
            ratingBreakdown: ratingBreakdown.map((r) => ({ stars: r.rating, count: r._count._all })),
            dailyOrders: this.groupByDay(orders),
        };
    }

    private groupByDay(orders: { createdAt: Date; totalAmount: number }[]) {
        const map = new Map<string, { count: number; revenue: number }>();
        for (const o of orders) {
            const day = o.createdAt.toISOString().slice(0, 10);
            const existing = map.get(day) ?? { count: 0, revenue: 0 };
            map.set(day, { count: existing.count + 1, revenue: existing.revenue + o.totalAmount });
        }
        return Array.from(map.entries())
            .map(([date, v]) => ({ date, ...v }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    private async assertOwner(restaurantId: string, ownerId: string) {
        const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
        if (!restaurant) throw new NotFoundException("Restaurant not found");
        if (restaurant.ownerId !== ownerId) throw new ForbiddenException("Not your restaurant");
        return restaurant;
    }
}

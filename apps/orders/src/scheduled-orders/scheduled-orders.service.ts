import {
    Injectable,
    Inject,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    Logger,
} from "@nestjs/common";
import { PrismaClient } from "@orderhub/database";
import { PRISMA_TOKEN } from "../database/database.module";

@Injectable()
export class ScheduledOrdersService {
    private readonly logger = new Logger(ScheduledOrdersService.name);

    constructor(
        @Inject(PRISMA_TOKEN) private readonly prisma: PrismaClient,
    ) { }

    // ─── Get user's scheduled orders ───────────────────────────────────────────────

    async findUserScheduledOrders(userId: string, status?: string, page = 1, pageSize = 20) {
        const skip = (page - 1) * pageSize;
        
        const where: any = { userId };
        if (status) {
            where.status = status;
        }

        const [orders, total] = await Promise.all([
            this.prisma.scheduledOrder.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { scheduledFor: "asc" },
                include: {
                    restaurant: {
                        select: {
                            id: true,
                            name: true,
                            imageUrl: true,
                            cuisineType: true,
                            openingTime: true,
                            closingTime: true,
                        },
                    },
                },
            }),
            this.prisma.scheduledOrder.count({ where }),
        ]);

        return {
            data: orders,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    }

    // ─── Create scheduled order ───────────────────────────────────────────────────

    async createScheduledOrder(userId: string, dto: {
        restaurantId: string;
        scheduledFor: string;
        deliveryAddress: string;
        specialInstructions?: string;
        orderData: string;
    }) {
        const scheduledFor = new Date(dto.scheduledFor);
        const now = new Date();

        // Validate scheduled time is in the future
        if (scheduledFor <= now) {
            throw new BadRequestException("Scheduled time must be in the future");
        }

        // Validate scheduled time is not too far in the future (max 7 days)
        const maxDays = 7;
        const maxDate = new Date(now.getTime() + maxDays * 24 * 60 * 60 * 1000);
        if (scheduledFor > maxDate) {
            throw new BadRequestException(`Cannot schedule orders more than ${maxDays} days in advance`);
        }

        // Validate restaurant exists and is open at scheduled time
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: dto.restaurantId },
        });

        if (!restaurant) throw new NotFoundException("Restaurant not found");
        if (restaurant.status !== "OPEN") {
            throw new BadRequestException("Restaurant is not currently accepting orders");
        }

        // Check if restaurant is open at scheduled time
        const scheduledHour = scheduledFor.getHours();
        const scheduledMinute = scheduledFor.getMinutes();
        const scheduledTime = `${scheduledHour.toString().padStart(2, '0')}:${scheduledMinute.toString().padStart(2, '0')}`;

        const [openHour, openMinute] = restaurant.openingTime.split(':').map(Number);
        const [closeHour, closeMinute] = restaurant.closingTime.split(':').map(Number);

        const openTime = openHour * 60 + openMinute;
        const closeTime = closeHour * 60 + closeMinute;
        const scheduledMinutes = scheduledHour * 60 + scheduledMinute;

        if (scheduledMinutes < openTime || scheduledMinutes >= closeTime) {
            throw new BadRequestException("Restaurant is not open at the scheduled time");
        }

        // Validate order data
        let orderData;
        try {
            orderData = JSON.parse(dto.orderData);
        } catch (e) {
            throw new BadRequestException("Invalid order data format");
        }

        if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
            throw new BadRequestException("Order must contain at least one item");
        }

        // Create scheduled order
        const scheduledOrder = await this.prisma.scheduledOrder.create({
            data: {
                userId,
                restaurantId: dto.restaurantId,
                scheduledFor,
                deliveryAddress: dto.deliveryAddress,
                specialInstructions: dto.specialInstructions,
                orderData: dto.orderData,
                status: "PENDING",
            },
            include: {
                restaurant: true,
            },
        });

        return scheduledOrder;
    }

    // ─── Cancel scheduled order ───────────────────────────────────────────────────

    async cancelScheduledOrder(id: string, userId: string) {
        const scheduledOrder = await this.prisma.scheduledOrder.findUnique({
            where: { id },
        });

        if (!scheduledOrder) throw new NotFoundException("Scheduled order not found");
        if (scheduledOrder.userId !== userId) throw new ForbiddenException("Not your scheduled order");

        // Can only cancel if not already processed
        if (scheduledOrder.status !== "PENDING") {
            throw new BadRequestException("Cannot cancel orders that are already processed");
        }

        // Can only cancel if scheduled time is at least 1 hour away
        const oneHour = 60 * 60 * 1000;
        if (scheduledOrder.scheduledFor.getTime() - Date.now() < oneHour) {
            throw new BadRequestException("Cannot cancel orders less than 1 hour before scheduled time");
        }

        await this.prisma.scheduledOrder.update({
            where: { id },
            data: { status: "CANCELLED" },
        });

        return { success: true };
    }

    // ─── Reschedule order ────────────────────────────────────────────────────────

    async rescheduleOrder(id: string, userId: string, newScheduledFor: string) {
        const scheduledOrder = await this.prisma.scheduledOrder.findUnique({
            where: { id },
            include: { restaurant: true },
        });

        if (!scheduledOrder) throw new NotFoundException("Scheduled order not found");
        if (scheduledOrder.userId !== userId) throw new ForbiddenException("Not your scheduled order");

        if (scheduledOrder.status !== "PENDING") {
            throw new BadRequestException("Cannot reschedule orders that are already processed");
        }

        const newTime = new Date(newScheduledFor);
        const now = new Date();

        // Same validation as create
        if (newTime <= now) {
            throw new BadRequestException("Scheduled time must be in the future");
        }

        const maxDays = 7;
        const maxDate = new Date(now.getTime() + maxDays * 24 * 60 * 60 * 1000);
        if (newTime > maxDate) {
            throw new BadRequestException(`Cannot schedule orders more than ${maxDays} days in advance`);
        }

        // Check restaurant availability at new time
        const scheduledHour = newTime.getHours();
        const scheduledMinute = newTime.getMinutes();
        const scheduledTimeStr = `${scheduledHour.toString().padStart(2, '0')}:${scheduledMinute.toString().padStart(2, '0')}`;

        const [openHour, openMinute] = scheduledOrder.restaurant.openingTime.split(':').map(Number);
        const [closeHour, closeMinute] = scheduledOrder.restaurant.closingTime.split(':').map(Number);

        const openTime = openHour * 60 + openMinute;
        const closeTime = closeHour * 60 + closeMinute;
        const scheduledMinutes = scheduledHour * 60 + scheduledMinute;

        if (scheduledMinutes < openTime || scheduledMinutes >= closeTime) {
            throw new BadRequestException("Restaurant is not open at the scheduled time");
        }

        await this.prisma.scheduledOrder.update({
            where: { id },
            data: { scheduledFor: newTime },
        });

        return { success: true };
    }

    // ─── Get available time slots ─────────────────────────────────────────────────

    async getAvailableSlots(restaurantId: string, date: string) {
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: restaurantId },
        });

        if (!restaurant) throw new NotFoundException("Restaurant not found");

        const targetDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        targetDate.setHours(0, 0, 0, 0);

        // Can only check today or future dates
        if (targetDate < today) {
            throw new BadRequestException("Cannot check past dates");
        }

        const [openHour, openMinute] = restaurant.openingTime.split(':').map(Number);
        const [closeHour, closeMinute] = restaurant.closingTime.split(':').map(Number);

        const slots = [];
        const slotDuration = 30; // 30-minute slots

        for (let hour = openHour; hour < closeHour; hour++) {
            for (let minute = 0; minute < 60; minute += slotDuration) {
                const slotTime = new Date(targetDate);
                slotTime.setHours(hour, minute, 0, 0);

                // Skip past slots if checking today
                if (targetDate.getTime() === today.getTime() && slotTime <= new Date()) {
                    continue;
                }

                slots.push({
                    time: slotTime.toISOString(),
                    display: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
                    available: true, // Could add capacity checking here
                });
            }
        }

        return { restaurantId, date, slots };
    }

    // ─── Process scheduled orders (called by cron job) ─────────────────────────────

    async processScheduledOrders() {
        const now = new Date();
        const ordersToProcess = await this.prisma.scheduledOrder.findMany({
            where: {
                status: "PENDING",
                scheduledFor: { lte: now },
            },
            include: {
                restaurant: true,
            },
        });

        for (const scheduledOrder of ordersToProcess) {
            try {
                // Convert to actual order
                const orderData = JSON.parse(scheduledOrder.orderData);
                
                // Create actual order using the orders service
                // This would typically call the existing orders service
                await this.prisma.scheduledOrder.update({
                    where: { id: scheduledOrder.id },
                    data: { status: "CONFIRMED" },
                });

                this.logger.log(`Processed scheduled order ${scheduledOrder.id}`);
            } catch (error) {
                this.logger.error(`Failed to process scheduled order ${scheduledOrder.id}:`, error);
                await this.prisma.scheduledOrder.update({
                    where: { id: scheduledOrder.id },
                    data: { status: "CANCELLED" },
                });
            }
        }

        return { processed: ordersToProcess.length };
    }
}
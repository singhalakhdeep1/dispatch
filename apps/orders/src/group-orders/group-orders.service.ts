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
export class GroupOrdersService {
    private readonly logger = new Logger(GroupOrdersService.name);

    constructor(
        @Inject(PRISMA_TOKEN) private readonly prisma: PrismaClient,
    ) { }

    // ─── Create group order ───────────────────────────────────────────────────────

    async createGroupOrder(userId: string, dto: { restaurantId: string; maxParticipants?: number; orderAt?: string }) {
        // Validate restaurant exists and is open
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: dto.restaurantId },
        });

        if (!restaurant) throw new NotFoundException("Restaurant not found");
        if (restaurant.status !== "OPEN") {
            throw new BadRequestException("Restaurant is not currently accepting orders");
        }

        const orderAt = dto.orderAt ? new Date(dto.orderAt) : null;
        if (orderAt && orderAt <= new Date()) {
            throw new BadRequestException("Order time must be in the future");
        }

        const groupOrder = await this.prisma.groupOrder.create({
            data: {
                hostUserId: userId,
                restaurantId: dto.restaurantId,
                maxParticipants: dto.maxParticipants || null,
                orderAt: orderAt,
                status: "ACTIVE",
            },
            include: {
                restaurant: true,
                host: {
                    select: { id: true, fullName: true, avatarUrl: true },
                },
            },
        });

        return groupOrder;
    }

    // ─── Get group order details ───────────────────────────────────────────────────

    async getGroupOrder(id: string) {
        const groupOrder = await this.prisma.groupOrder.findUnique({
            where: { id },
            include: {
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true,
                        cuisineType: true,
                    },
                },
                host: {
                    select: { id: true, fullName: true, avatarUrl: true },
                },
                participants: {
                    include: {
                        user: {
                            select: { id: true, fullName: true, avatarUrl: true },
                        },
                    },
                },
            },
        });

        if (!groupOrder) throw new NotFoundException("Group order not found");

        return groupOrder;
    }

    // ─── Get user's group orders ─────────────────────────────────────────────────

    async getMyGroupOrders(userId: string, status?: string, page = 1, pageSize = 20) {
        const skip = (page - 1) * pageSize;

        const where: any = {
            hostUserId: userId,
        };

        if (status) {
            where.status = status;
        }

        const [groupOrders, total] = await Promise.all([
            this.prisma.groupOrder.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: "desc" },
                include: {
                    restaurant: {
                        select: {
                            id: true,
                            name: true,
                            imageUrl: true,
                        },
                    },
                    host: {
                        select: { id: true, fullName: true },
                    },
                    _count: {
                        select: { participants: true },
                    },
                },
            }),
            this.prisma.groupOrder.count({ where }),
        ]);

        return {
            data: groupOrders,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    }

    // ─── Join group order ─────────────────────────────────────────────────────────

    async joinGroupOrder(id: string, userId: string, dto: { orderData: string; amount: number }) {
        const groupOrder = await this.prisma.groupOrder.findUnique({
            where: { id },
            include: { participants: true },
        });

        if (!groupOrder) throw new NotFoundException("Group order not found");
        if (groupOrder.status !== "ACTIVE") {
            throw new BadRequestException("Group order is not accepting participants");
        }

        // Check if already joined
        if (groupOrder.participants.some(p => p.userId === userId)) {
            throw new BadRequestException("Already joined this group order");
        }

        // Check max participants
        if (groupOrder.maxParticipants && groupOrder.participants.length >= groupOrder.maxParticipants) {
            throw new BadRequestException("Group order is full");
        }

        // Validate order data
        let orderData;
        try {
            orderData = JSON.parse(dto.orderData);
        } catch (e) {
            throw new BadRequestException("Invalid order data format");
        }

        // Add participant
        const participant = await this.prisma.groupOrderParticipant.create({
            data: {
                groupOrderId: id,
                userId,
                orderData: dto.orderData,
                amount: dto.amount,
                status: "JOINED",
            },
            include: {
                user: {
                    select: { id: true, fullName: true, avatarUrl: true },
                },
            },
        });

        // Update total amount
        await this.prisma.groupOrder.update({
            where: { id },
            data: {
                totalAmount: { increment: dto.amount },
            },
        });

        return participant;
    }

    // ─── Complete group order ────────────────────────────────────────────────────

    async completeGroupOrder(id: string, userId: string) {
        const groupOrder = await this.prisma.groupOrder.findUnique({
            where: { id },
        });

        if (!groupOrder) throw new NotFoundException("Group order not found");
        if (groupOrder.hostUserId !== userId) {
            throw new ForbiddenException("Only host can complete the group order");
        }

        if (groupOrder.status !== "ACTIVE") {
            throw new BadRequestException("Group order is not active");
        }

        // Update status
        await this.prisma.groupOrder.update({
            where: { id },
            data: {
                status: "COMPLETED",
                orderAt: new Date(),
            },
        });

        // Create actual order for each participant
        const participants = await this.prisma.groupOrderParticipant.findMany({
            where: { groupOrderId: id },
        });

        for (const participant of participants) {
            // This would integrate with the existing orders service
            // For now, just mark as paid
            await this.prisma.groupOrderParticipant.update({
                where: { id: participant.id },
                data: { status: "PAID" },
            });
        }

        return { success: true };
    }

    // ─── Cancel group order ─────────────────────────────────────────────────────

    async cancelGroupOrder(id: string, userId: string) {
        const groupOrder = await this.prisma.groupOrder.findUnique({
            where: { id },
        });

        if (!groupOrder) throw new NotFoundException("Group order not found");
        if (groupOrder.hostUserId !== userId) {
            throw new ForbiddenException("Only host can cancel the group order");
        }

        if (groupOrder.status !== "ACTIVE") {
            throw new BadRequestException("Cannot cancel completed group orders");
        }

        await this.prisma.groupOrder.update({
            where: { id },
            data: { status: "CANCELLED" },
        });

        return { success: true };
    }

    // ─── Get participants ─────────────────────────────────────────────────────────

    async getParticipants(id: string) {
        const participants = await this.prisma.groupOrderParticipant.findMany({
            where: { groupOrderId: id },
            include: {
                user: {
                    select: { id: true, fullName: true, avatarUrl: true },
                },
            },
            orderBy: { joinedAt: "asc" },
        });

        return {
            groupOrderId: id,
            participants,
            totalAmount: participants.reduce((sum, p) => sum + p.amount, 0),
            participantCount: participants.length,
        };
    }
}
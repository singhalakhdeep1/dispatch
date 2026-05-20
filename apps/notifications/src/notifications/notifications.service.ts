import { Injectable, Inject, Logger } from "@nestjs/common";
import { PrismaClient, NotificationType } from "@orderhub/database";
import { PRISMA_TOKEN } from "../database/database.module";
import { TrackingGateway } from "../gateways/tracking.gateway";

interface CreateNotificationDto {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    orderId?: string;
}

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        @Inject(PRISMA_TOKEN) private readonly prisma: PrismaClient,
        private readonly gateway: TrackingGateway,
    ) { }

    async create(dto: CreateNotificationDto) {
        const notification = await this.prisma.notification.create({
            data: {
                userId: dto.userId,
                type: dto.type,
                title: dto.title,
                body: dto.body,
                data: dto.data as any ?? {},
                orderId: dto.orderId,
            },
        });

        // Push real-time notification to user's socket room
        this.gateway.emitToUser(dto.userId, "notification", {
            id: notification.id,
            type: dto.type,
            title: dto.title,
            body: dto.body,
            data: dto.data,
            orderId: dto.orderId,
            createdAt: notification.createdAt,
        });

        return notification;
    }

    async getForUser(userId: string, page = 1, pageSize = 20) {
        const skip = (page - 1) * pageSize;
        const [data, total] = await Promise.all([
            this.prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
                skip,
                take: pageSize,
            }),
            this.prisma.notification.count({ where: { userId } }),
        ]);

        return {
            data,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    }

    async markRead(userId: string, notificationId: string) {
        return this.prisma.notification.updateMany({
            where: { id: notificationId, userId },
            data: { readAt: new Date() },
        });
    }

    async markAllRead(userId: string) {
        return this.prisma.notification.updateMany({
            where: { userId, readAt: null },
            data: { readAt: new Date() },
        });
    }

    async getUnreadCount(userId: string) {
        return this.prisma.notification.count({ where: { userId, readAt: null } });
    }
}

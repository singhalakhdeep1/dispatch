import {
    Injectable,
    Inject,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    Logger,
} from "@nestjs/common";
import { PrismaClient, ReviewTarget } from "@orderhub/database";
import { PRISMA_TOKEN } from "../database/database.module";

@Injectable()
export class ReviewsService {
    private readonly logger = new Logger(ReviewsService.name);

    constructor(
        @Inject(PRISMA_TOKEN) private readonly prisma: PrismaClient,
    ) { }

    // ─── List reviews for restaurant ──────────────────────────────────────────

    async findForRestaurant(restaurantId: string, page = 1, pageSize = 20) {
        const skip = (page - 1) * pageSize;
        const [reviews, total] = await Promise.all([
            this.prisma.review.findMany({
                where: { restaurantId, targetType: ReviewTarget.RESTAURANT },
                skip,
                take: pageSize,
                orderBy: { createdAt: "desc" },
                include: {
                    user: { select: { id: true, name: true, avatar: true } },
                },
            }),
            this.prisma.review.count({ where: { restaurantId, targetType: ReviewTarget.RESTAURANT } }),
        ]);
        return { data: reviews, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    }

    // ─── Create review (post-delivery only) ───────────────────────────────────

    async create(userId: string, dto: {
        orderId: string;
        targetType: ReviewTarget;
        restaurantId?: string;
        driverId?: string;
        menuItemId?: string;
        rating: number;
        comment?: string;
        images?: string[];
    }) {
        // Verify order exists + was delivered to this user
        const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
        if (!order) throw new NotFoundException("Order not found");
        if (order.userId !== userId) throw new ForbiddenException("Not your order");
        if (order.status !== "DELIVERED") {
            throw new BadRequestException("Can only review after order is delivered");
        }

        // Prevent duplicate reviews (@@unique on userId, orderId, targetType)
        const existing = await this.prisma.review.findFirst({
            where: { userId, orderId: dto.orderId, targetType: dto.targetType },
        });
        if (existing) throw new BadRequestException("Already reviewed this target for this order");

        const review = await this.prisma.review.create({
            data: { ...dto, userId },
            include: { user: { select: { id: true, name: true, avatar: true } } },
        });

        // Update restaurant/driver/item average rating
        await this.updateAverageRating(dto);

        return review;
    }

    // ─── Owner reply ─────────────────────────────────────────────────────────

    async ownerReply(reviewId: string, ownerId: string, reply: string) {
        const review = await this.prisma.review.findUnique({
            where: { id: reviewId },
            include: { restaurant: { select: { ownerId: true } } },
        });
        if (!review) throw new NotFoundException("Review not found");
        if (review.restaurant?.ownerId !== ownerId) throw new ForbiddenException("Not your restaurant");
        return this.prisma.review.update({
            where: { id: reviewId },
            data: { ownerReply: reply },
        });
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private async updateAverageRating(dto: {
        targetType: ReviewTarget;
        restaurantId?: string;
        driverId?: string;
        menuItemId?: string;
    }) {
        if (dto.targetType === ReviewTarget.RESTAURANT && dto.restaurantId) {
            const agg = await this.prisma.review.aggregate({
                where: { restaurantId: dto.restaurantId, targetType: ReviewTarget.RESTAURANT },
                _avg: { rating: true },
                _count: { _all: true },
            });
            await this.prisma.restaurant.update({
                where: { id: dto.restaurantId },
                data: {
                    rating: agg._avg.rating ?? 0,
                    reviewCount: agg._count._all,
                },
            });
        }

        if (dto.targetType === ReviewTarget.DRIVER && dto.driverId) {
            const agg = await this.prisma.review.aggregate({
                where: { driverId: dto.driverId, targetType: ReviewTarget.DRIVER },
                _avg: { rating: true },
                _count: { _all: true },
            });
            await this.prisma.driver.update({
                where: { id: dto.driverId },
                data: { rating: agg._avg.rating ?? 0 },
            });
        }

        if (dto.targetType === ReviewTarget.MENU_ITEM && dto.menuItemId) {
            const agg = await this.prisma.review.aggregate({
                where: { menuItemId: dto.menuItemId, targetType: ReviewTarget.MENU_ITEM },
                _avg: { rating: true },
                _count: { _all: true },
            });
            await this.prisma.menuItem.update({
                where: { id: dto.menuItemId },
                data: {
                    rating: agg._avg.rating ?? 0,
                    ratingCount: agg._count._all,
                },
            });
        }
    }
}

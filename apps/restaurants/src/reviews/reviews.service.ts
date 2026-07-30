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

    async findForRestaurant(restaurantId: string, page = 1, pageSize = 20, sortBy?: string, rating?: number) {
        const skip = (page - 1) * pageSize;
        
        // Build where clause
        const where: any = { restaurantId, targetType: ReviewTarget.RESTAURANT };
        if (rating) {
            where.rating = rating;
        }

        // Determine sort order
        let orderBy: any = { createdAt: "desc" };
        if (sortBy === "helpful") {
            orderBy = { helpfulCount: "desc" };
        } else if (sortBy === "rating_high") {
            orderBy = { rating: "desc" };
        } else if (sortBy === "rating_low") {
            orderBy = { rating: "asc" };
        }

        const [reviews, total] = await Promise.all([
            this.prisma.review.findMany({
                where,
                skip,
                take: pageSize,
                orderBy,
                include: {
                    user: { select: { id: true, fullName: true, avatarUrl: true } },
                    helpfulVotes: { select: { userId: true } },
                },
            }),
            this.prisma.review.count({ where }),
        ]);
        
        return { 
            data: reviews.map(r => ({
                ...r,
                user: r.user,
                isHelpful: r.helpfulVotes.some(v => v.userId === r.userId),
                helpfulVotes: undefined
            })), 
            total, 
            page, 
            pageSize, 
            totalPages: Math.ceil(total / pageSize) 
        };
    }

    // ─── List reviews for menu item ─────────────────────────────────────────────

    async findForMenuItem(menuItemId: string, page = 1, pageSize = 10) {
        const skip = (page - 1) * pageSize;
        const [reviews, total] = await Promise.all([
            this.prisma.review.findMany({
                where: { menuItemId, targetType: ReviewTarget.MENU_ITEM },
                skip,
                take: pageSize,
                orderBy: { createdAt: "desc" },
                include: {
                    user: { select: { id: true, fullName: true, avatarUrl: true } },
                },
            }),
            this.prisma.review.count({ where: { menuItemId, targetType: ReviewTarget.MENU_ITEM } }),
        ]);
        return { data: reviews, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    }

    // ─── List reviews for driver ────────────────────────────────────────────────

    async findForDriver(driverId: string, page = 1, pageSize = 10) {
        const skip = (page - 1) * pageSize;
        const [reviews, total] = await Promise.all([
            this.prisma.review.findMany({
                where: { driverId, targetType: ReviewTarget.DRIVER },
                skip,
                take: pageSize,
                orderBy: { createdAt: "desc" },
                include: {
                    user: { select: { id: true, fullName: true, avatarUrl: true } },
                },
            }),
            this.prisma.review.count({ where: { driverId, targetType: ReviewTarget.DRIVER } }),
        ]);
        return { data: reviews, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    }

    // ─── List user's reviews ─────────────────────────────────────────────────────

    async findUserReviews(userId: string, page = 1, pageSize = 20) {
        const skip = (page - 1) * pageSize;
        const [reviews, total] = await Promise.all([
            this.prisma.review.findMany({
                where: { userId },
                skip,
                take: pageSize,
                orderBy: { createdAt: "desc" },
                include: {
                    restaurant: { select: { id: true, name: true, imageUrl: true } },
                    menuItem: { select: { id: true, name: true, imageUrl: true } },
                    driver: { select: { id: true, user: { select: { fullName: true } } } },
                },
            }),
            this.prisma.review.count({ where: { userId } }),
        ]);
        return { data: reviews, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    }

    // ─── Get single review ───────────────────────────────────────────────────────

    async findOne(reviewId: string) {
        const review = await this.prisma.review.findUnique({
            where: { id: reviewId },
            include: {
                user: { select: { id: true, fullName: true, avatarUrl: true } },
                restaurant: { select: { id: true, name: true, imageUrl: true } },
                menuItem: { select: { id: true, name: true, imageUrl: true } },
                driver: { select: { id: true, user: { select: { fullName: true } } } },
                helpfulVotes: { select: { userId: true } },
            },
        });
        
        if (!review) {
            throw new NotFoundException("Review not found");
        }

        return {
            ...review,
            isHelpful: review.helpfulVotes.some(v => v.userId === review.userId),
            helpfulVotes: undefined
        };
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
            data: { ownerReply: reply, ownerReplyAt: new Date() },
        });
    }

    // ─── Mark review as helpful ───────────────────────────────────────────────────

    async markHelpful(reviewId: string, userId: string) {
        const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
        if (!review) throw new NotFoundException("Review not found");

        // Check if already voted
        const existing = await this.prisma.reviewHelpfulVote.findUnique({
            where: { reviewId_userId: { reviewId, userId } },
        });
        if (existing) throw new BadRequestException("Already marked as helpful");

        await this.prisma.reviewHelpfulVote.create({
            data: { reviewId, userId },
        });

        return this.prisma.review.update({
            where: { id: reviewId },
            data: { helpfulCount: { increment: 1 } },
        });
    }

    // ─── Remove helpful vote ─────────────────────────────────────────────────────

    async removeHelpful(reviewId: string, userId: string) {
        const existing = await this.prisma.reviewHelpfulVote.findUnique({
            where: { reviewId_userId: { reviewId, userId } },
        });
        if (!existing) throw new NotFoundException("Vote not found");

        await this.prisma.reviewHelpfulVote.delete({
            where: { id: existing.id },
        });

        return this.prisma.review.update({
            where: { id: reviewId },
            data: { helpfulCount: { decrement: 1 } },
        });
    }

    // ─── Flag review for moderation ─────────────────────────────────────────────

    async flagReview(reviewId: string, userId: string) {
        const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
        if (!review) throw new NotFoundException("Review not found");

        return this.prisma.review.update({
            where: { id: reviewId },
            data: { isFlagged: true },
        });
    }

    // ─── Update review ───────────────────────────────────────────────────────────

    async updateReview(reviewId: string, userId: string, dto: { rating?: number; comment?: string; images?: string[] }) {
        const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
        if (!review) throw new NotFoundException("Review not found");
        if (review.userId !== userId) throw new ForbiddenException("Not your review");

        // Allow update only within 24 hours
        const hoursSinceCreation = (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceCreation > 24) {
            throw new BadRequestException("Can only edit reviews within 24 hours");
        }

        const updated = await this.prisma.review.update({
            where: { id: reviewId },
            data: {
                ...dto,
                updatedAt: new Date(),
            },
        });

        // Update average rating if rating changed
        if (dto.rating !== undefined) {
            await this.updateAverageRating({
                targetType: review.targetType,
                restaurantId: review.restaurantId || undefined,
                driverId: review.driverId || undefined,
                menuItemId: review.menuItemId || undefined,
            });
        }

        return updated;
    }

    // ─── Delete review ───────────────────────────────────────────────────────────

    async deleteReview(reviewId: string, userId: string) {
        const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
        if (!review) throw new NotFoundException("Review not found");
        if (review.userId !== userId) throw new ForbiddenException("Not your review");

        // Allow deletion only within 48 hours
        const hoursSinceCreation = (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceCreation > 48) {
            throw new BadRequestException("Can only delete reviews within 48 hours");
        }

        await this.prisma.review.delete({ where: { id: reviewId } });

        // Update average rating
        await this.updateAverageRating({
            targetType: review.targetType,
            restaurantId: review.restaurantId || undefined,
            driverId: review.driverId || undefined,
            menuItemId: review.menuItemId || undefined,
        });

        return { success: true };
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

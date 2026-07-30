import { Controller, Get, Post, Patch, Delete, Body, Param, Headers, Query, DefaultValuePipe, ParseIntPipe, UseGuards } from "@nestjs/common";
import { ReviewsService } from "./reviews.service";
import { ReviewTarget } from "@orderhub/database";
import { CreateReviewSchema, OwnerReplySchema } from "@orderhub/shared";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { z } from "zod";

@Controller("v1/reviews")
export class ReviewsController {
    constructor(private readonly service: ReviewsService) { }

    @Get("restaurant/:restaurantId")
    findForRestaurant(
        @Param("restaurantId") restaurantId: string,
        @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query("pageSize", new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
        @Query("sortBy") sortBy?: string, // 'recent', 'helpful', 'rating_high', 'rating_low'
        @Query("rating") rating?: number, // filter by rating
    ) {
        return this.service.findForRestaurant(restaurantId, page, pageSize, sortBy, rating);
    }

    @Get("item/:menuItemId")
    findForMenuItem(
        @Param("menuItemId") menuItemId: string,
        @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query("pageSize", new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
    ) {
        return this.service.findForMenuItem(menuItemId, page, pageSize);
    }

    @Get("driver/:driverId")
    findForDriver(
        @Param("driverId") driverId: string,
        @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query("pageSize", new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
    ) {
        return this.service.findForDriver(driverId, page, pageSize);
    }

    @Get("my-reviews")
    findMyReviews(
        @Headers("x-user-id") userId: string,
        @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query("pageSize", new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    ) {
        return this.service.findUserReviews(userId, page, pageSize);
    }

    @Get(":reviewId")
    findOne(@Param("reviewId") reviewId: string) {
        return this.service.findOne(reviewId);
    }

    @Post()
    create(
        @Headers("x-user-id") userId: string,
        @Body(new ZodValidationPipe(CreateReviewSchema)) dto: z.infer<typeof CreateReviewSchema>,
    ) {
        return this.service.create(userId, {
            ...dto,
            targetType: dto.targetType as ReviewTarget,
        });
    }

    @Patch(":reviewId/reply")
    ownerReply(
        @Param("reviewId") reviewId: string,
        @Headers("x-user-id") userId: string,
        @Body(new ZodValidationPipe(OwnerReplySchema)) dto: z.infer<typeof OwnerReplySchema>,
    ) {
        return this.service.ownerReply(reviewId, userId, dto.reply);
    }

    @Post(":reviewId/helpful")
    markHelpful(
        @Param("reviewId") reviewId: string,
        @Headers("x-user-id") userId: string,
    ) {
        return this.service.markHelpful(reviewId, userId);
    }

    @Delete(":reviewId/helpful")
    removeHelpful(
        @Param("reviewId") reviewId: string,
        @Headers("x-user-id") userId: string,
    ) {
        return this.service.removeHelpful(reviewId, userId);
    }

    @Post(":reviewId/flag")
    flagReview(
        @Param("reviewId") reviewId: string,
        @Headers("x-user-id") userId: string,
    ) {
        return this.service.flagReview(reviewId, userId);
    }

    @Patch(":reviewId")
    updateReview(
        @Param("reviewId") reviewId: string,
        @Headers("x-user-id") userId: string,
        @Body() dto: { rating?: number; comment?: string; images?: string[] },
    ) {
        return this.service.updateReview(reviewId, userId, dto);
    }

    @Delete(":reviewId")
    deleteReview(
        @Param("reviewId") reviewId: string,
        @Headers("x-user-id") userId: string,
    ) {
        return this.service.deleteReview(reviewId, userId);
    }
}

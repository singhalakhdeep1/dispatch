import { Controller, Get, Post, Patch, Body, Param, Headers, Query, DefaultValuePipe, ParseIntPipe } from "@nestjs/common";
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
    ) {
        return this.service.findForRestaurant(restaurantId, page, pageSize);
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
}

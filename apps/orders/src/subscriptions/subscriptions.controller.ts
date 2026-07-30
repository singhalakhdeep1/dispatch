import { Controller, Get, Post, Patch, Delete, Body, Param, Headers, Query, DefaultValuePipe, ParseIntPipe } from "@nestjs/common";
import { SubscriptionsService } from "./subscriptions.service";

@Controller("v1/subscriptions")
export class SubscriptionsController {
    constructor(private readonly service: SubscriptionsService) { }

    @Get("my-subscription")
    getMySubscription(@Headers("x-user-id") userId: string) {
        return this.service.getUserSubscription(userId);
    }

    @Post("subscribe")
    createSubscription(
        @Headers("x-user-id") userId: string,
        @Body() dto: { planType: string; paymentMethodId: string },
    ) {
        return this.service.createSubscription(userId, dto);
    }

    @Patch(":id/cancel")
    cancelSubscription(
        @Param("id") id: string,
        @Headers("x-user-id") userId: string,
    ) {
        return this.service.cancelSubscription(id, userId);
    }

    @Patch(":id/pause")
    pauseSubscription(
        @Param("id") id: string,
        @Headers("x-user-id") userId: string,
    ) {
        return this.service.pauseSubscription(id, userId);
    }

    @Patch(":id/resume")
    resumeSubscription(
        @Param("id") id: string,
        @Headers("x-user-id") userId: string,
    ) {
        return this.service.resumeSubscription(id, userId);
    }

    @Get("plans")
    getAvailablePlans() {
        return this.service.getAvailablePlans();
    }

    @Get("history")
    getSubscriptionHistory(
        @Headers("x-user-id") userId: string,
        @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query("pageSize", new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    ) {
        return this.service.getSubscriptionHistory(userId, page, pageSize);
    }
}
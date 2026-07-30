import { Controller, Get, Post, Patch, Body, Param, Headers, Query, DefaultValuePipe, ParseIntPipe } from "@nestjs/common";
import { LoyaltyService } from "./loyalty.service";

@Controller("v1/loyalty")
export class LoyaltyController {
    constructor(private readonly service: LoyaltyService) { }

    @Get("my-points")
    getMyPoints(@Headers("x-user-id") userId: string) {
        return this.service.getUserPoints(userId);
    }

    @Get("rewards")
    getAvailableRewards(
        @Query("programId") programId?: string,
        @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query("pageSize", new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    ) {
        return this.service.getAvailableRewards(programId, page, pageSize);
    }

    @Post("rewards/:rewardId/redeem")
    redeemReward(
        @Param("rewardId") rewardId: string,
        @Headers("x-user-id") userId: string,
        @Body() dto: { orderId?: string },
    ) {
        return this.service.redeemReward(rewardId, userId, dto.orderId);
    }

    @Get("history")
    getRedemptionHistory(
        @Headers("x-user-id") userId: string,
        @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query("pageSize", new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    ) {
        return this.service.getRedemptionHistory(userId, page, pageSize);
    }

    @Get("tier")
    getMyTier(@Headers("x-user-id") userId: string) {
        return this.service.getUserTier(userId);
    }

    @Get("programs")
    getLoyaltyPrograms() {
        return this.service.getLoyaltyPrograms();
    }
}
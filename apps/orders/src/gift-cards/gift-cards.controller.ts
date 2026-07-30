import { Controller, Get, Post, Patch, Delete, Body, Param, Headers, Query, DefaultValuePipe, ParseIntPipe } from "@nestjs/common";
import { GiftCardsService } from "./gift-cards.service";

@Controller("v1/gift-cards")
export class GiftCardsController {
    constructor(private readonly service: GiftCardsService) { }

    @Post("purchase")
    purchaseGiftCard(
        @Headers("x-user-id") userId: string,
        @Body() dto: {
            amount: number;
            recipientEmail?: string;
            recipientPhone?: string;
            message?: string;
        },
    ) {
        return this.service.purchaseGiftCard(userId, dto);
    }

    @Post("redeem")
    redeemGiftCard(
        @Headers("x-user-id") userId: string,
        @Body() dto: { code: string; orderId: string },
    ) {
        return this.service.redeemGiftCard(userId, dto);
    }

    @Get("my-gift-cards")
    getMyGiftCards(
        @Headers("x-user-id") userId: string,
        @Query("status") status?: string,
        @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query("pageSize", new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    ) {
        return this.service.getMyGiftCards(userId, status, page, pageSize);
    }

    @Get("balance/:code")
    checkBalance(@Param("code") code: string) {
        return this.service.checkBalance(code);
    }

    @Get(":id")
    getGiftCard(@Param("id") id: string) {
        return this.service.getGiftCard(id);
    }

    @Get("redemption/history")
    getRedemptionHistory(
        @Headers("x-user-id") userId: string,
        @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query("pageSize", new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    ) {
        return this.service.getRedemptionHistory(userId, page, pageSize);
    }
}
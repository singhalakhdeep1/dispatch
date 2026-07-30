import { Controller, Get, Post, Headers, Query, DefaultValuePipe, ParseIntPipe } from "@nestjs/common";
import { OrderHistoryService } from "./order-history.service";

@Controller("v1/order-history")
export class OrderHistoryController {
    constructor(private readonly service: OrderHistoryService) { }

    @Get()
    findOrderHistory(
        @Headers("x-user-id") userId: string,
        @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query("pageSize", new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    ) {
        return this.service.findUserOrderHistory(userId, page, pageSize);
    }

    @Post(":orderId/reorder")
    reorder(
        @Param("orderId") orderId: string,
        @Headers("x-user-id") userId: string,
    ) {
        return this.service.reorder(orderId, userId);
    }

    @Get("frequent")
    findFrequentOrders(
        @Headers("x-user-id") userId: string,
        @Query("limit", new DefaultValuePipe(5), ParseIntPipe) limit: number,
    ) {
        return this.service.findFrequentOrders(userId, limit);
    }
}
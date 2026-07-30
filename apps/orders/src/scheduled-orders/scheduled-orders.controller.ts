import { Controller, Get, Post, Patch, Delete, Body, Param, Headers, Query, DefaultValuePipe, ParseIntPipe } from "@nestjs/common";
import { ScheduledOrdersService } from "./scheduled-orders.service";

@Controller("v1/scheduled-orders")
export class ScheduledOrdersController {
    constructor(private readonly service: ScheduledOrdersService) { }

    @Get()
    findMyScheduledOrders(
        @Headers("x-user-id") userId: string,
        @Query("status") status?: string,
        @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query("pageSize", new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    ) {
        return this.service.findUserScheduledOrders(userId, status, page, pageSize);
    }

    @Post()
    createScheduledOrder(
        @Headers("x-user-id") userId: string,
        @Body() dto: {
            restaurantId: string;
            scheduledFor: string; // ISO datetime
            deliveryAddress: string;
            specialInstructions?: string;
            orderData: string; // JSON string of order details
        },
    ) {
        return this.service.createScheduledOrder(userId, dto);
    }

    @Patch(":id/cancel")
    cancelScheduledOrder(
        @Param("id") id: string,
        @Headers("x-user-id") userId: string,
    ) {
        return this.service.cancelScheduledOrder(id, userId);
    }

    @Patch(":id/reschedule")
    rescheduleOrder(
        @Param("id") id: string,
        @Headers("x-user-id") userId: string,
        @Body() dto: { scheduledFor: string },
    ) {
        return this.service.rescheduleOrder(id, userId, dto.scheduledFor);
    }

    @Get("available-slots/:restaurantId")
    getAvailableSlots(
        @Param("restaurantId") restaurantId: string,
        @Query("date") date: string, // YYYY-MM-DD
    ) {
        return this.service.getAvailableSlots(restaurantId, date);
    }
}
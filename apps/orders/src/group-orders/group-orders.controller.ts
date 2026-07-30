import { Controller, Get, Post, Patch, Delete, Body, Param, Headers, Query, DefaultValuePipe, ParseIntPipe } from "@nestjs/common";
import { GroupOrdersService } from "./group-orders.service";

@Controller("v1/group-orders")
export class GroupOrdersController {
    constructor(private readonly service: GroupOrdersService) { }

    @Post()
    createGroupOrder(
        @Headers("x-user-id") userId: string,
        @Body() dto: {
            restaurantId: string;
            maxParticipants?: number;
            orderAt?: string; // ISO datetime
        },
    ) {
        return this.service.createGroupOrder(userId, dto);
    }

    @Get(":id")
    getGroupOrder(@Param("id") id: string) {
        return this.service.getGroupOrder(id);
    }

    @Get("my-groups")
    getMyGroupOrders(
        @Headers("x-user-id") userId: string,
        @Query("status") status?: string,
        @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query("pageSize", new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    ) {
        return this.service.getMyGroupOrders(userId, status, page, pageSize);
    }

    @Post(":id/join")
    joinGroupOrder(
        @Param("id") id: string,
        @Headers("x-user-id") userId: string,
        @Body() dto: { orderData: string; amount: number },
    ) {
        return this.service.joinGroupOrder(id, userId, dto);
    }

    @Patch(":id/complete")
    completeGroupOrder(
        @Param("id") id: string,
        @Headers("x-user-id") userId: string,
    ) {
        return this.service.completeGroupOrder(id, userId);
    }

    @Delete(":id")
    cancelGroupOrder(
        @Param("id") id: string,
        @Headers("x-user-id") userId: string,
    ) {
        return this.service.cancelGroupOrder(id, userId);
    }

    @Get(":id/participants")
    getParticipants(@Param("id") id: string) {
        return this.service.getParticipants(id);
    }
}
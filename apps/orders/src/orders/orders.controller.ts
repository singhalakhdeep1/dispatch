import {
    Controller,
    Post,
    Get,
    Patch,
    Body,
    Param,
    Query,
    Request,
    HttpCode,
    HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { OrdersService } from "./orders.service";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import {
    PlaceOrderSchema,
    CancelOrderSchema,
    ListOrdersSchema,
    PlaceOrderDto,
    CancelOrderDto,
    ListOrdersDto,
} from "@orderhub/shared";
import { OrderStatus } from "@orderhub/database";

@ApiTags("orders")
@Controller({ path: "orders", version: "1" })
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: "Place a new order" })
    create(
        @Body(new ZodValidationPipe(PlaceOrderSchema)) dto: PlaceOrderDto,
        @Request() req: any,
    ) {
        return this.ordersService.place(dto, req.user);
    }

    @Get()
    @ApiOperation({ summary: "List orders for current user" })
    findAll(
        @Query(new ZodValidationPipe(ListOrdersSchema)) dto: ListOrdersDto,
        @Request() req: any,
    ) {
        return this.ordersService.findAll(dto, req.user);
    }

    @Get(":id")
    @ApiOperation({ summary: "Get order by ID" })
    findOne(@Param("id") id: string, @Request() req: any) {
        return this.ordersService.findOne(id, req.user);
    }

    @Patch(":id/cancel")
    @ApiOperation({ summary: "Cancel order" })
    cancel(
        @Param("id") id: string,
        @Body(new ZodValidationPipe(CancelOrderSchema)) dto: CancelOrderDto,
        @Request() req: any,
    ) {
        return this.ordersService.cancel(id, dto, req.user);
    }

    @Patch(":id/status")
    @ApiOperation({ summary: "Update order status (driver/saga)" })
    updateStatus(
        @Param("id") id: string,
        @Body("status") status: OrderStatus,
        @Request() req: any,
    ) {
        return this.ordersService.updateStatus(id, status, req.user);
    }
}

// ── Restaurant sub-controller ────────────────────────────────────────────────

import { Controller as NestController } from "@nestjs/common";
import { NearbyRestaurantsSchema } from "@orderhub/shared";

@ApiTags("restaurants")
@NestController({ path: "restaurants", version: "1" })
export class RestaurantsController {
    constructor(private readonly ordersService: OrdersService) {}

    @Get()
    @ApiOperation({ summary: "List/search restaurants" })
    findAll(@Query(new ZodValidationPipe(NearbyRestaurantsSchema)) query: any) {
        return this.ordersService.listRestaurants({
            latitude: query.lat,
            longitude: query.lng,
            radiusKm: query.radiusKm,
            cuisine: query.cuisine,
            page: query.page,
            pageSize: query.pageSize,
        });
    }

    @Get(":id")
    @ApiOperation({ summary: "Get restaurant with menu" })
    findOne(@Param("id") id: string) {
        return this.ordersService.getRestaurant(id);
    }
}

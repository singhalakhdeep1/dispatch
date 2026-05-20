import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    Inject,
    OnModuleInit,
    HttpCode,
    HttpStatus,
} from "@nestjs/common";
import { ClientGrpc } from "@nestjs/microservices";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { Observable, firstValueFrom } from "rxjs";
import { JwtAuthGuard } from "../auth/guards/jwt.guard";
import { ProxyService } from "../proxy/proxy.service";
import { RolesGuard, Roles } from "../auth/guards/roles.guard";
import { UserRole } from "@orderhub/shared";
import { ORDERS_GRPC_CLIENT } from "../grpc/orders-grpc-client.module";

/** gRPC stub interface matching orders.proto OrdersService */
interface OrdersGrpcService {
    createOrder(data: {
        restaurant_id: string;
        address_id: string;
        delivery_address: string;
        delivery_lat: number;
        delivery_lng: number;
        items: Array<{ menu_item_id: string; quantity: number }>;
        user_id: string;
        user_role: string;
    }): Observable<any>;

    getOrder(data: { order_id: string; user_id: string; user_role: string }): Observable<any>;

    updateOrderStatus(data: {
        order_id: string;
        status: string;
        user_id: string;
        user_role: string;
    }): Observable<any>;
}

@ApiTags("orders")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: "orders", version: "1" })
export class OrdersController implements OnModuleInit {
    private ordersGrpc!: OrdersGrpcService;

    constructor(
        private readonly proxy: ProxyService,
        @Inject(ORDERS_GRPC_CLIENT) private readonly grpcClient: ClientGrpc,
    ) { }

    onModuleInit() {
        this.ordersGrpc = this.grpcClient.getService<OrdersGrpcService>("OrdersService");
    }

    /**
     * POST /v1/orders
     * Uses gRPC to call orders service — typed contract, binary payload.
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
    @ApiOperation({ summary: "Place a new order (via gRPC)" })
    async create(@Body() body: any, @Request() req: any) {
        const user = req.user;
        return firstValueFrom(
            this.ordersGrpc.createOrder({
                restaurant_id: body.restaurantId,
                address_id: body.addressId,
                delivery_address: body.deliveryAddress,
                delivery_lat: body.deliveryLat,
                delivery_lng: body.deliveryLng,
                items: (body.items ?? []).map((i: any) => ({
                    menu_item_id: i.menuItemId,
                    quantity: i.quantity,
                })),
                user_id: user.sub,
                user_role: user.role,
            }),
        );
    }

    /** GET /v1/orders — falls back to HTTP proxy (list queries) */
    @Get()
    @ApiOperation({ summary: "List my orders" })
    findAll(@Query() query: any, @Request() req: any) {
        return this.proxy.forward("orders", "/v1/orders", "GET", null, { ...req, query });
    }

    /**
     * GET /v1/orders/:id
     * Uses gRPC — single-record lookup with typed response.
     */
    @Get(":id")
    @ApiOperation({ summary: "Get order by ID (via gRPC)" })
    async findOne(@Param("id") id: string, @Request() req: any) {
        const user = req.user;
        return firstValueFrom(
            this.ordersGrpc.getOrder({
                order_id: id,
                user_id: user.sub,
                user_role: user.role,
            }),
        );
    }

    @Patch(":id/cancel")
    @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
    @ApiOperation({ summary: "Cancel an order" })
    cancel(@Param("id") id: string, @Body() body: unknown, @Request() req: any) {
        return this.proxy.forward("orders", `/v1/orders/${id}/cancel`, "PATCH", body, req);
    }

    @Patch(":id/status")
    @Roles(UserRole.DRIVER, UserRole.ADMIN)
    @ApiOperation({ summary: "Driver updates order status (via gRPC)" })
    async updateStatus(@Param("id") id: string, @Body() body: any, @Request() req: any) {
        const user = req.user;
        return firstValueFrom(
            this.ordersGrpc.updateOrderStatus({
                order_id: id,
                status: body.status,
                user_id: user.sub,
                user_role: user.role,
            }),
        );
    }

    @Get("restaurant/:rid")
    @Roles(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)
    @ApiOperation({ summary: "Restaurant incoming orders" })
    restaurantOrders(@Param("rid") rid: string, @Query() query: any, @Request() req: any) {
        return this.proxy.forward("orders", `/v1/orders/restaurant/${rid}`, "GET", null, {
            ...req,
            query,
        });
    }
}


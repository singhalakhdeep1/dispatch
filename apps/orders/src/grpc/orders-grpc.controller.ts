import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { OrdersService } from "../orders/orders.service";
import { JwtPayload, UserRole } from "@orderhub/shared";

/** Handles gRPC RPCs defined in orders.proto */
@Controller()
export class OrdersGrpcController {
    constructor(private readonly ordersService: OrdersService) { }

    /**
     * rpc CreateOrder (CreateOrderRequest) returns (CreateOrderResponse)
     *
     * The gateway strips the JWT, extracts user context, and passes it here as
     * trusted fields (user_id / user_role) — the same trusted-header pattern
     * used on the HTTP side.
     */
    @GrpcMethod("OrdersService", "CreateOrder")
    async createOrder(data: {
        restaurant_id: string;
        address_id: string;
        delivery_address: string;
        delivery_lat: number;
        delivery_lng: number;
        items: Array<{ menu_item_id: string; quantity: number }>;
        user_id: string;
        user_role: string;
    }) {
        const user: JwtPayload = { sub: data.user_id, role: data.user_role as UserRole, email: "" };

        const dto = {
            restaurantId: data.restaurant_id,
            addressId: data.address_id,
            deliveryAddress: data.delivery_address,
            deliveryLat: data.delivery_lat,
            deliveryLng: data.delivery_lng,
            items: data.items.map((i) => ({
                menuItemId: i.menu_item_id,
                quantity: i.quantity,
            })),
        };

        const order = await this.ordersService.place(dto as any, user);

        return {
            id: order.id,
            status: order.status,
            total_amount: order.totalAmount,
            delivery_fee: order.deliveryFee,
            surge_multiplier: order.surgeMultiplier ?? 1.0,
            estimated_delivery_mins: order.estimatedDeliveryMins ?? 30,
        };
    }

    /**
     * rpc GetOrder (GetOrderRequest) returns (GetOrderResponse)
     */
    @GrpcMethod("OrdersService", "GetOrder")
    async getOrder(data: { order_id: string; user_id: string; user_role: string }) {
        const user: JwtPayload = { sub: data.user_id, role: data.user_role as UserRole, email: "" };
        const order = await this.ordersService.findOne(data.order_id, user);

        return {
            id: order.id,
            status: order.status,
            restaurant_id: order.restaurantId,
            user_id: order.userId,
            driver_id: order.driverId ?? "",
            total_amount: order.totalAmount,
            created_at: order.createdAt?.toISOString() ?? "",
        };
    }

    /**
     * rpc UpdateOrderStatus (UpdateOrderStatusRequest) returns (UpdateOrderStatusResponse)
     */
    @GrpcMethod("OrdersService", "UpdateOrderStatus")
    async updateOrderStatus(data: {
        order_id: string;
        status: string;
        user_id: string;
        user_role: string;
    }) {
        const user: JwtPayload = { sub: data.user_id, role: data.user_role as UserRole, email: "" };
        const order = await this.ordersService.updateStatus(data.order_id, { status: data.status as any }, user);

        return {
            id: order.id,
            status: order.status,
        };
    }
}

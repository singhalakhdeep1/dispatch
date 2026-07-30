import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { OrdersController, RestaurantsController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { OrderSaga } from "../saga/order.saga";
import { OrdersGrpcController } from "../grpc/orders-grpc.controller";
import { LoyaltyModule } from "../loyalty/loyalty.module";

@Module({
    imports: [HttpModule, LoyaltyModule],
    controllers: [OrdersController, RestaurantsController, OrdersGrpcController],
    providers: [OrdersService, OrderSaga],
})
export class OrdersModule { }

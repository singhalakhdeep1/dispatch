import { Module } from "@nestjs/common";
import { OrdersController } from "./orders.controller";
import { ProxyModule } from "../proxy/proxy.module";
import { OrdersGrpcClientModule } from "../grpc/orders-grpc-client.module";

@Module({
    imports: [ProxyModule, OrdersGrpcClientModule],
    controllers: [OrdersController],
})
export class OrdersModule { }

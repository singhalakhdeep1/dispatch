import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ORDERS_PROTO_PATH } from "@orderhub/grpc";

export const ORDERS_GRPC_CLIENT = "ORDERS_GRPC_CLIENT";

/**
 * Provides a gRPC client stub for the Orders service.
 * Used by OrdersGrpcClientModule consumers (gateway's orders controller).
 */
@Module({
    imports: [
        ClientsModule.registerAsync([
            {
                name: ORDERS_GRPC_CLIENT,
                imports: [ConfigModule],
                useFactory: (config: ConfigService) => {
                    const grpcUrl = config.get<string>("app.grpc.ordersUrl") ?? "localhost:5002";
                    return {
                        transport: Transport.GRPC,
                        options: {
                            package: "orders",
                            protoPath: ORDERS_PROTO_PATH,
                            url: grpcUrl,
                        },
                    };
                },
                inject: [ConfigService],
            },
        ]),
    ],
    exports: [ClientsModule],
})
export class OrdersGrpcClientModule { }

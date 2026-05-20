import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./database/database.module";
import { RedisModule } from "./redis/redis.module";
import { KafkaModule } from "./kafka/kafka.module";
import { OrdersModule } from "./orders/orders.module";
import { CartModule } from "./cart/cart.module";
import { PaymentsModule } from "./payments/payments.module";
import { AddressesModule } from "./addresses/addresses.module";
import appConfig from "./config/app.config";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig],
            envFilePath: ["../../.env.local", "../../.env"],
        }),
        DatabaseModule,
        RedisModule,
        KafkaModule,
        OrdersModule,
        CartModule,
        PaymentsModule,
        AddressesModule,
    ],
})
export class AppModule { }

import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./database/database.module";
import { RedisModule } from "./redis/redis.module";
import { KafkaModule } from "./kafka/kafka.module";
import { OrdersModule } from "./orders/orders.module";
import { CartModule } from "./cart/cart.module";
import { PaymentsModule } from "./payments/payments.module";
import { AddressesModule } from "./addresses/addresses.module";
import { OrderHistoryModule } from "./order-history/order-history.module";
import { ScheduledOrdersModule } from "./scheduled-orders/scheduled-orders.module";
import { LoyaltyModule } from "./loyalty/loyalty.module";
import { GroupOrdersModule } from "./group-orders/group-orders.module";
import { SubscriptionsModule } from "./subscriptions/subscriptions.module";
import { GiftCardsModule } from "./gift-cards/gift-cards.module";
import { CorporateModule } from "./corporate/corporate.module";
import { MultiRestaurantModule } from "./multi-restaurant/multi-restaurant.module";
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
        OrderHistoryModule,
        ScheduledOrdersModule,
        LoyaltyModule,
        GroupOrdersModule,
        SubscriptionsModule,
        GiftCardsModule,
        CorporateModule,
        MultiRestaurantModule,
    ],
})
export class AppModule { }

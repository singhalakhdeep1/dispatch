import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { DatabaseModule } from "./database/database.module";
import { AuthModule } from "./auth/auth.module";
import { OrdersModule } from "./orders/orders.module";
import { DriversModule } from "./drivers/drivers.module";
import { RestaurantsModule } from "./restaurants/restaurants.module";
import { PricingModule } from "./pricing/pricing.module";
import { ProxyModule } from "./proxy/proxy.module";
import { CartModule } from "./cart/cart.module";
import { PaymentsModule } from "./payments/payments.module";
import { ReviewsModule } from "./reviews/reviews.module";
import { AddressesModule } from "./addresses/addresses.module";
import { PromosModule } from "./promos/promos.module";
import { NotificationsGatewayModule } from "./notifications/notifications.module";
import { AdminModule } from "./admin/admin.module";
import appConfig from "./config/app.config";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig],
            envFilePath: ["../../.env.local", "../../.env"],
        }),
        ThrottlerModule.forRoot([{ name: "global", ttl: 60_000, limit: 300 }]),
        DatabaseModule,
        AuthModule,
        ProxyModule,
        OrdersModule,
        DriversModule,
        RestaurantsModule,
        PricingModule,
        CartModule,
        PaymentsModule,
        ReviewsModule,
        AddressesModule,
        PromosModule,
        NotificationsGatewayModule,
        AdminModule,
    ],
    providers: [
        { provide: APP_GUARD, useClass: ThrottlerGuard },
    ],
})
export class AppModule { }

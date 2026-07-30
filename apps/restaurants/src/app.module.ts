import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import appConfig from "./config/app.config";
import { DatabaseModule } from "./database/database.module";
import { RedisModule } from "./redis/redis.module";
import { RestaurantsModule } from "./restaurants/restaurants.module";
import { CategoriesModule } from "./categories/categories.module";
import { MenusModule } from "./menus/menus.module";
import { ReviewsModule } from "./reviews/reviews.module";
import { PromosModule } from "./promos/promos.module";
import { FavoritesModule } from "./favorites/favorites.module";

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }),
        DatabaseModule,
        RedisModule,
        RestaurantsModule,
        CategoriesModule,
        MenusModule,
        ReviewsModule,
        PromosModule,
        FavoritesModule,
    ],
})
export class AppModule { }

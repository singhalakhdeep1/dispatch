import { Module } from "@nestjs/common";
import { MultiRestaurantController } from "./multi-restaurant.controller";
import { MultiRestaurantService } from "./multi-restaurant.service";
import { DatabaseModule } from "../database/database.module";

@Module({
    imports: [DatabaseModule],
    controllers: [MultiRestaurantController],
    providers: [MultiRestaurantService],
    exports: [MultiRestaurantService],
})
export class MultiRestaurantModule {}
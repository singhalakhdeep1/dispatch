import { Module } from "@nestjs/common";
import { RestaurantsController } from "./restaurants.controller";
import { RestaurantsService } from "./restaurants.service";
import { KafkaModule } from "../kafka/kafka.module";

@Module({
    imports: [KafkaModule],
    controllers: [RestaurantsController],
    providers: [RestaurantsService],
    exports: [RestaurantsService],
})
export class RestaurantsModule { }

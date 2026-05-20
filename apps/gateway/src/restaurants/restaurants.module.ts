import { Module } from "@nestjs/common";
import { RestaurantsController } from "./restaurants.controller";
import { ProxyModule } from "../proxy/proxy.module";

@Module({
    imports: [ProxyModule],
    controllers: [RestaurantsController],
})
export class RestaurantsModule { }

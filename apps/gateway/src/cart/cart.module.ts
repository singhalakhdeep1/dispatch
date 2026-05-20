import { Module } from "@nestjs/common";
import { CartController } from "./cart.controller";
import { ProxyModule } from "../proxy/proxy.module";

@Module({
    imports: [ProxyModule],
    controllers: [CartController],
})
export class CartModule { }

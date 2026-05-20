import { Module } from "@nestjs/common";
import { PricingController } from "./pricing.controller";
import { ProxyModule } from "../proxy/proxy.module";

@Module({
    imports: [ProxyModule],
    controllers: [PricingController],
})
export class PricingModule {}

import { Module } from "@nestjs/common";
import { PromosController } from "./promos.controller";
import { ProxyModule } from "../proxy/proxy.module";

@Module({
    imports: [ProxyModule],
    controllers: [PromosController],
})
export class PromosModule { }

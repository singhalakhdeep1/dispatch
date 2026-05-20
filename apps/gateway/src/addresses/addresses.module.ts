import { Module } from "@nestjs/common";
import { AddressesController } from "./addresses.controller";
import { ProxyModule } from "../proxy/proxy.module";

@Module({
    imports: [ProxyModule],
    controllers: [AddressesController],
})
export class AddressesModule { }

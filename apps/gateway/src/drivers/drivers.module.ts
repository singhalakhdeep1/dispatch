import { Module } from "@nestjs/common";
import { DriversController } from "./drivers.controller";
import { ProxyModule } from "../proxy/proxy.module";

@Module({
    imports: [ProxyModule],
    controllers: [DriversController],
})
export class DriversModule { }

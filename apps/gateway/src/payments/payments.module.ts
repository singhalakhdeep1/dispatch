import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { ProxyModule } from "../proxy/proxy.module";

@Module({
    imports: [ProxyModule],
    controllers: [PaymentsController],
})
export class PaymentsModule { }

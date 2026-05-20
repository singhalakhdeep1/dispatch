import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ProxyService } from "./proxy.service";
import { CircuitBreakerService } from "../common/circuit-breaker.service";

@Module({
    imports: [HttpModule.register({ timeout: 10_000, maxRedirects: 3 })],
    providers: [ProxyService, CircuitBreakerService],
    exports: [ProxyService],
})
export class ProxyModule { }

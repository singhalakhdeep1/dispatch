import { Injectable, HttpException } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import { AxiosRequestConfig } from "axios";
import type { Request } from "express";
import { CircuitBreakerService } from "../common/circuit-breaker.service";

export const SERVICE_URLS = {
    orders: "ORDERS_SERVICE_URL",
    drivers: "DRIVERS_SERVICE_URL",
    notifications: "NOTIFICATIONS_SERVICE_URL",
    pricing: "PRICING_SERVICE_URL",
    restaurants: "RESTAURANTS_SERVICE_URL",
} as const;

type ServiceKey = keyof typeof SERVICE_URLS;

@Injectable()
export class ProxyService {
    constructor(
        private readonly http: HttpService,
        private readonly config: ConfigService,
        private readonly cb: CircuitBreakerService,
    ) { }

    private getServiceUrl(service: ServiceKey): string {
        const services = this.config.get<Record<string, string>>("app.services")!;
        return services[`${service}Url`];
    }

    async forward(
        service: ServiceKey,
        path: string,
        method: string,
        body: unknown,
        req: Request,
    ) {
        const baseUrl = this.getServiceUrl(service);
        const url = `${baseUrl}${path}`;

        // Forward auth header + tracing headers
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        if (req.headers.authorization) {
            headers["Authorization"] = req.headers.authorization;
        }
        // Pass decoded user context as a trusted header (gateway already validated JWT)
        if ((req as any).user) {
            headers["X-User-Id"] = (req as any).user.sub ?? "";
            headers["X-User-Role"] = (req as any).user.role ?? "";
        }

        const config: AxiosRequestConfig = {
            method: method as AxiosRequestConfig["method"],
            url,
            headers,
            params: req.query,
            data: ["POST", "PUT", "PATCH"].includes(method.toUpperCase()) ? body : undefined,
            timeout: 10_000,
        };

        // ── Circuit breaker: one breaker per downstream service ──────────────
        return this.cb.fire(service, async () => {
            try {
                const response = await firstValueFrom(this.http.request(config));
                return response.data;
            } catch (err: any) {
                const status = err.response?.status ?? 502;
                const message = err.response?.data?.message ?? err.message ?? "Service unavailable";
                throw new HttpException(message, status);
            }
        });
    }
}


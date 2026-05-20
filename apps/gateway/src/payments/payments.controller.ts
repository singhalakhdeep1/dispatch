import { Controller, Get, Post, Body, Request, UseGuards, RawBodyRequest, Req } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt.guard";
import { ProxyService } from "../proxy/proxy.service";
import { SetMetadata } from "@nestjs/common";
import { IS_PUBLIC_KEY } from "../auth/guards/jwt.guard";
import { Request as ExpressRequest } from "express";

@ApiTags("payments")
@Controller({ path: "payments", version: "1" })
export class PaymentsController {
    constructor(private readonly proxy: ProxyService) { }

    @Post("initiate")
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    initiate(@Body() body: any, @Request() req: any) {
        return this.proxy.forward("orders", "/v1/payments/initiate", "POST", body, req);
    }

    @Post("verify")
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    verify(@Body() body: any, @Request() req: any) {
        return this.proxy.forward("orders", "/v1/payments/verify", "POST", body, req);
    }

    @Post("webhook/razorpay")
    @SetMetadata(IS_PUBLIC_KEY, true)
    webhook(@Req() req: RawBodyRequest<ExpressRequest>) {
        return this.proxy.forward("orders", "/v1/payments/webhook/razorpay", "POST", req.body, req as any);
    }

    @Get("wallet")
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    getWallet(@Request() req: any) {
        return this.proxy.forward("orders", "/v1/payments/wallet", "GET", null, req);
    }
}

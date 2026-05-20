import { Controller, Get, Post, Body, Param, Headers, RawBodyRequest, Req } from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { PaymentMethod } from "@orderhub/database";
import { InitiatePaymentSchema, VerifyPaymentSchema } from "@orderhub/shared";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { z } from "zod";
import { Request } from "express";

@Controller("v1/payments")
export class PaymentsController {
    constructor(private readonly service: PaymentsService) { }

    @Post("initiate")
    initiate(
        @Headers("x-user-id") userId: string,
        @Body(new ZodValidationPipe(InitiatePaymentSchema)) dto: z.infer<typeof InitiatePaymentSchema>,
    ) {
        return this.service.initiate(dto.orderId, userId, dto.method as PaymentMethod);
    }

    @Post("verify")
    verify(
        @Body(new ZodValidationPipe(VerifyPaymentSchema)) dto: z.infer<typeof VerifyPaymentSchema>,
    ) {
        return this.service.verify(dto);
    }

    @Post("webhook/razorpay")
    webhook(@Req() req: RawBodyRequest<Request>) {
        const signature = req.headers["x-razorpay-signature"] as string;
        const body = req.rawBody?.toString() ?? JSON.stringify(req.body);
        return this.service.handleWebhook(body, signature);
    }

    @Get("wallet")
    getWallet(@Headers("x-user-id") userId: string) {
        return this.service.getWallet(userId);
    }
}

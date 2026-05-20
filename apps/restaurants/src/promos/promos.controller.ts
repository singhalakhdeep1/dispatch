import { Controller, Get, Post, Patch, Body, Param, Headers, Query } from "@nestjs/common";
import { PromosService } from "./promos.service";
import { PromoType } from "@orderhub/database";
import { CreatePromoSchema, ApplyPromoSchema } from "@orderhub/shared";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { z } from "zod";

@Controller("v1/promos")
export class PromosController {
    constructor(private readonly service: PromosService) { }

    @Get("active")
    findActive(@Query("restaurantId") restaurantId?: string) {
        return this.service.findActive(restaurantId);
    }

    @Get("restaurant/:restaurantId")
    findForRestaurant(
        @Param("restaurantId") restaurantId: string,
        @Headers("x-user-id") userId: string,
    ) {
        return this.service.findForRestaurant(restaurantId, userId);
    }

    @Post("validate")
    validate(
        @Headers("x-user-id") userId: string,
        @Body(new ZodValidationPipe(ApplyPromoSchema)) dto: z.infer<typeof ApplyPromoSchema>,
    ) {
        return this.service.validate(dto.code, userId, dto.orderAmount, dto.restaurantId);
    }

    @Post()
    create(
        @Headers("x-user-id") userId: string,
        @Body(new ZodValidationPipe(CreatePromoSchema)) dto: z.infer<typeof CreatePromoSchema>,
    ) {
        return this.service.create(userId, {
            ...dto,
            type: dto.type as PromoType,
            validFrom: new Date(dto.validFrom),
            validUntil: new Date(dto.validUntil),
        });
    }

    @Patch(":promoId/toggle")
    toggle(
        @Param("promoId") promoId: string,
        @Headers("x-user-id") userId: string,
        @Body("isActive") isActive: boolean,
    ) {
        return this.service.toggle(promoId, userId, isActive);
    }
}

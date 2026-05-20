import { Controller, Get, Post, Patch, Delete, Body, Param, Headers } from "@nestjs/common";
import { CartService } from "./cart.service";
import { AddToCartSchema, UpdateCartItemSchema } from "@orderhub/shared";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { z } from "zod";

@Controller("v1/cart")
export class CartController {
    constructor(private readonly service: CartService) { }

    @Get()
    getCart(@Headers("x-user-id") userId: string) {
        return this.service.getCart(userId);
    }

    @Post("items")
    addItem(
        @Headers("x-user-id") userId: string,
        @Body(new ZodValidationPipe(AddToCartSchema)) dto: z.infer<typeof AddToCartSchema>,
    ) {
        return this.service.addItem(userId, dto);
    }

    @Patch("items/:menuItemId")
    updateItem(
        @Headers("x-user-id") userId: string,
        @Param("menuItemId") menuItemId: string,
        @Body(new ZodValidationPipe(UpdateCartItemSchema)) dto: z.infer<typeof UpdateCartItemSchema>,
    ) {
        return this.service.updateItem(userId, menuItemId, dto.quantity);
    }

    @Delete()
    clearCart(@Headers("x-user-id") userId: string) {
        return this.service.clearCart(userId);
    }
}

import { Controller, Get, Post, Patch, Delete, Body, Param, Request, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt.guard";
import { ProxyService } from "../proxy/proxy.service";

@ApiTags("cart")
@Controller({ path: "cart", version: "1" })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CartController {
    constructor(private readonly proxy: ProxyService) { }

    @Get()
    getCart(@Request() req: any) {
        return this.proxy.forward("orders", "/v1/cart", "GET", null, req);
    }

    @Post("items")
    addItem(@Body() body: any, @Request() req: any) {
        return this.proxy.forward("orders", "/v1/cart/items", "POST", body, req);
    }

    @Patch("items/:menuItemId")
    updateItem(@Param("menuItemId") menuItemId: string, @Body() body: any, @Request() req: any) {
        return this.proxy.forward("orders", `/v1/cart/items/${menuItemId}`, "PATCH", body, req);
    }

    @Delete()
    clearCart(@Request() req: any) {
        return this.proxy.forward("orders", "/v1/cart", "DELETE", null, req);
    }
}

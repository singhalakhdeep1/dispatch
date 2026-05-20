import { Controller, Get, Post, Patch, Body, Param, Query, Request, UseGuards, SetMetadata } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard, IS_PUBLIC_KEY } from "../auth/guards/jwt.guard";
import { ProxyService } from "../proxy/proxy.service";

@ApiTags("promos")
@Controller({ path: "promos", version: "1" })
export class PromosController {
    constructor(private readonly proxy: ProxyService) { }

    @Get("active")
    @SetMetadata(IS_PUBLIC_KEY, true)
    findActive(@Query() query: any, @Request() req: any) {
        const qs = new URLSearchParams(query).toString();
        return this.proxy.forward("restaurants", `/v1/promos/active?${qs}`, "GET", null, req);
    }

    @Get("restaurant/:restaurantId")
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    findForRestaurant(@Param("restaurantId") restaurantId: string, @Request() req: any) {
        return this.proxy.forward("restaurants", `/v1/promos/restaurant/${restaurantId}`, "GET", null, req);
    }

    @Post("validate")
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    validate(@Body() body: any, @Request() req: any) {
        return this.proxy.forward("restaurants", "/v1/promos/validate", "POST", body, req);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    create(@Body() body: any, @Request() req: any) {
        return this.proxy.forward("restaurants", "/v1/promos", "POST", body, req);
    }

    @Patch(":promoId/toggle")
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    toggle(@Param("promoId") promoId: string, @Body() body: any, @Request() req: any) {
        return this.proxy.forward("restaurants", `/v1/promos/${promoId}/toggle`, "PATCH", body, req);
    }
}

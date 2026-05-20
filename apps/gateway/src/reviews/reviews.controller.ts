import { Controller, Get, Post, Patch, Body, Param, Request, UseGuards, SetMetadata, Query, DefaultValuePipe, ParseIntPipe } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard, IS_PUBLIC_KEY } from "../auth/guards/jwt.guard";
import { ProxyService } from "../proxy/proxy.service";

@ApiTags("reviews")
@Controller({ path: "reviews", version: "1" })
export class ReviewsController {
    constructor(private readonly proxy: ProxyService) { }

    @Get("restaurant/:restaurantId")
    @SetMetadata(IS_PUBLIC_KEY, true)
    getForRestaurant(@Param("restaurantId") restaurantId: string, @Query() query: any, @Request() req: any) {
        const qs = new URLSearchParams(query).toString();
        return this.proxy.forward("restaurants", `/v1/reviews/restaurant/${restaurantId}?${qs}`, "GET", null, req);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    create(@Body() body: any, @Request() req: any) {
        return this.proxy.forward("restaurants", "/v1/reviews", "POST", body, req);
    }

    @Patch(":reviewId/reply")
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    ownerReply(@Param("reviewId") reviewId: string, @Body() body: any, @Request() req: any) {
        return this.proxy.forward("restaurants", `/v1/reviews/${reviewId}/reply`, "PATCH", body, req);
    }
}

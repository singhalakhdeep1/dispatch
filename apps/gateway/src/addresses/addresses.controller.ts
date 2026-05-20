import { Controller, Get, Post, Patch, Delete, Body, Param, Request, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt.guard";
import { ProxyService } from "../proxy/proxy.service";

@ApiTags("addresses")
@Controller({ path: "addresses", version: "1" })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AddressesController {
    constructor(private readonly proxy: ProxyService) { }

    @Get()
    findAll(@Request() req: any) {
        return this.proxy.forward("orders", "/v1/addresses", "GET", null, req);
    }

    @Post()
    create(@Body() body: any, @Request() req: any) {
        return this.proxy.forward("orders", "/v1/addresses", "POST", body, req);
    }

    @Patch(":id")
    update(@Param("id") id: string, @Body() body: any, @Request() req: any) {
        return this.proxy.forward("orders", `/v1/addresses/${id}`, "PATCH", body, req);
    }

    @Delete(":id")
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param("id") id: string, @Request() req: any) {
        return this.proxy.forward("orders", `/v1/addresses/${id}`, "DELETE", null, req);
    }
}

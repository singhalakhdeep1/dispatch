import {
    Controller,
    Get,
    Patch,
    Body,
    Query,
    Param,
    UseGuards,
    Request,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt.guard";
import { ProxyService } from "../proxy/proxy.service";
import { RolesGuard, Roles } from "../auth/guards/roles.guard";
import { UserRole } from "@orderhub/shared";

@ApiTags("drivers")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: "drivers", version: "1" })
export class DriversController {
    constructor(private readonly proxy: ProxyService) { }

    @Get("nearby")
    @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
    @ApiOperation({ summary: "Get nearby available drivers" })
    nearby(@Query() query: any, @Request() req: any) {
        return this.proxy.forward("drivers", "/v1/drivers/nearby", "GET", null, { ...req, query });
    }

    @Patch("location")
    @Roles(UserRole.DRIVER)
    @ApiOperation({ summary: "Driver: update live location" })
    updateLocation(@Body() body: unknown, @Request() req: any) {
        return this.proxy.forward("drivers", "/v1/drivers/location", "PATCH", body, req);
    }

    @Patch("status")
    @Roles(UserRole.DRIVER)
    @ApiOperation({ summary: "Driver: toggle online/offline" })
    updateStatus(@Body() body: unknown, @Request() req: any) {
        return this.proxy.forward("drivers", "/v1/drivers/status", "PATCH", body, req);
    }

    @Get(":id")
    @ApiOperation({ summary: "Get driver profile" })
    findOne(@Param("id") id: string, @Request() req: any) {
        return this.proxy.forward("drivers", `/v1/drivers/${id}`, "GET", null, req);
    }

    @Patch(":id/orders/:orderId/respond")
    @Roles(UserRole.DRIVER)
    @ApiOperation({ summary: "Driver: accept or reject an order" })
    respondToOrder(
        @Param("id") id: string,
        @Param("orderId") orderId: string,
        @Body() body: unknown,
        @Request() req: any,
    ) {
        return this.proxy.forward(
            "drivers",
            `/v1/drivers/${id}/orders/${orderId}/respond`,
            "PATCH",
            body,
            req,
        );
    }
}

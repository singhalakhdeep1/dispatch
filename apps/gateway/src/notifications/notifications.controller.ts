import {
    Controller,
    Get,
    Patch,
    Param,
    Query,
    UseGuards,
    Request,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt.guard";
import { ProxyService } from "../proxy/proxy.service";

@ApiTags("notifications")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: "notifications", version: "1" })
export class NotificationsController {
    constructor(private readonly proxy: ProxyService) { }

    @Get()
    @ApiOperation({ summary: "Get my notifications" })
    findAll(@Query() query: any, @Request() req: any) {
        return this.proxy.forward("notifications", "/v1/notifications", "GET", null, { ...req, query });
    }

    @Patch("read-all")
    @ApiOperation({ summary: "Mark all notifications as read" })
    markAllRead(@Request() req: any) {
        return this.proxy.forward("notifications", "/v1/notifications/read-all", "PATCH", null, req);
    }

    @Patch(":id/read")
    @ApiOperation({ summary: "Mark a notification as read" })
    markRead(@Param("id") id: string, @Request() req: any) {
        return this.proxy.forward("notifications", `/v1/notifications/${id}/read`, "PATCH", null, req);
    }
}

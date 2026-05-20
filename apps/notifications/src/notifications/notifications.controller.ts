import {
    Controller,
    Get,
    Patch,
    Param,
    Query,
    Headers,
    ParseIntPipe,
    DefaultValuePipe,
    UnauthorizedException,
} from "@nestjs/common";
import { NotificationsService } from "./notifications.service";

/**
 * REST HTTP controller for the notifications service.
 * The API Gateway authenticates all requests and forwards X-User-Id / X-User-Role headers.
 * We trust those headers here; no JwtAuthGuard at the service level.
 */
@Controller({ path: "notifications", version: "1" })
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    getNotifications(
        @Headers("x-user-id") userId: string,
        @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query("pageSize", new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    ) {
        if (!userId) throw new UnauthorizedException("Missing X-User-Id header");
        return this.notificationsService.getForUser(userId, page, Math.min(pageSize, 100));
    }

    @Get("unread-count")
    getUnreadCount(@Headers("x-user-id") userId: string) {
        if (!userId) throw new UnauthorizedException("Missing X-User-Id header");
        return this.notificationsService.getUnreadCount(userId).then((count) => ({ count }));
    }

    @Patch("read-all")
    markAllRead(@Headers("x-user-id") userId: string) {
        if (!userId) throw new UnauthorizedException("Missing X-User-Id header");
        return this.notificationsService.markAllRead(userId).then((r) => ({ updated: r.count }));
    }

    @Patch(":id/read")
    markRead(@Headers("x-user-id") userId: string, @Param("id") id: string) {
        if (!userId) throw new UnauthorizedException("Missing X-User-Id header");
        return this.notificationsService.markRead(userId, id).then((r) => ({ updated: r.count }));
    }
}

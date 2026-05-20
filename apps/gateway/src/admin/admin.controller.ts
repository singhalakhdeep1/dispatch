import {
    Controller,
    Get,
    Patch,
    Body,
    Param,
    Query,
    UseGuards,
    Inject,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt.guard";
import { RolesGuard, Roles } from "../auth/guards/roles.guard";
import { ProxyService } from "../proxy/proxy.service";
import { PRISMA_TOKEN } from "../database/database.module";
import type { PrismaClient } from "@orderhub/database";
import { UserRole } from "@orderhub/shared";

@ApiTags("admin")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller({ path: "admin", version: "1" })
export class AdminController {
    constructor(
        private readonly proxy: ProxyService,
        @Inject(PRISMA_TOKEN) private readonly db: PrismaClient,
    ) { }

    @Get("stats")
    @ApiOperation({ summary: "Get platform statistics" })
    async getStats() {
        const [totalRestaurants, totalUsers, totalOrders] = await Promise.all([
            this.db.restaurant.count(),
            this.db.user.count(),
            this.db.order.count(),
        ]);
        const revenueAgg = await this.db.order.aggregate({
            _sum: { totalAmount: true },
            where: { status: "DELIVERED" },
        });
        return {
            totalRestaurants,
            totalUsers,
            totalOrders,
            totalRevenue: revenueAgg._sum.totalAmount ?? 0,
        };
    }

    @Get("users")
    @ApiOperation({ summary: "List all users" })
    async getUsers(@Query("search") search?: string, @Query("pageSize") pageSize = 50) {
        const users = await this.db.user.findMany({
            where: search
                ? {
                    OR: [
                        { fullName: { contains: search, mode: "insensitive" } },
                        { email: { contains: search, mode: "insensitive" } },
                    ],
                }
                : undefined,
            take: Number(pageSize),
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                isBanned: true,
                createdAt: true,
            },
        });
        return users;
    }

    @Patch("users/:id")
    @ApiOperation({ summary: "Update user (ban/unban, role)" })
    async updateUser(@Param("id") id: string, @Body() body: { isBanned?: boolean; role?: string }) {
        return this.db.user.update({
            where: { id },
            data: body as any,
            select: { id: true, fullName: true, email: true, role: true, isBanned: true },
        });
    }
}

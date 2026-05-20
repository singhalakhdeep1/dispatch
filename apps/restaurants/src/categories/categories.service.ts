import { Injectable, Inject, NotFoundException, ForbiddenException, Logger } from "@nestjs/common";
import { PrismaClient } from "@orderhub/database";
import { Redis } from "ioredis";
import { PRISMA_TOKEN } from "../database/database.module";
import { REDIS_TOKEN } from "../redis/redis.module";

@Injectable()
export class CategoriesService {
    private readonly logger = new Logger(CategoriesService.name);

    constructor(
        @Inject(PRISMA_TOKEN) private readonly prisma: PrismaClient,
        @Inject(REDIS_TOKEN) private readonly redis: Redis,
    ) { }

    async findAll(restaurantId: string) {
        return this.prisma.menuCategory.findMany({
            where: { restaurantId, isActive: true },
            orderBy: { sortOrder: "asc" },
            include: { _count: { select: { menuItems: true } } },
        });
    }

    async create(restaurantId: string, ownerId: string, dto: {
        name: string;
        description?: string;
        imageUrl?: string;
        sortOrder?: number;
    }) {
        await this.assertOwner(restaurantId, ownerId);
        const category = await this.prisma.menuCategory.create({
            data: { ...dto, restaurantId },
        });
        await this.invalidateCache(restaurantId);
        return category;
    }

    async update(categoryId: string, ownerId: string, dto: Partial<{
        name: string;
        description: string;
        imageUrl: string;
        sortOrder: number;
        isActive: boolean;
    }>) {
        const category = await this.prisma.menuCategory.findUnique({ where: { id: categoryId } });
        if (!category) throw new NotFoundException("Category not found");
        await this.assertOwner(category.restaurantId, ownerId);
        const updated = await this.prisma.menuCategory.update({ where: { id: categoryId }, data: dto });
        await this.invalidateCache(category.restaurantId);
        return updated;
    }

    async remove(categoryId: string, ownerId: string) {
        const category = await this.prisma.menuCategory.findUnique({ where: { id: categoryId } });
        if (!category) throw new NotFoundException("Category not found");
        await this.assertOwner(category.restaurantId, ownerId);
        await this.prisma.menuCategory.delete({ where: { id: categoryId } });
        await this.invalidateCache(category.restaurantId);
    }

    private async assertOwner(restaurantId: string, ownerId: string) {
        const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
        if (!restaurant) throw new NotFoundException("Restaurant not found");
        if (restaurant.ownerId !== ownerId) throw new ForbiddenException("Not your restaurant");
    }

    private async invalidateCache(restaurantId: string) {
        await this.redis.del(`restaurant:${restaurantId}`);
    }
}

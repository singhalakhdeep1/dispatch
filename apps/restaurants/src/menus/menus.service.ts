import { Injectable, Inject, NotFoundException, ForbiddenException, Logger } from "@nestjs/common";
import { PrismaClient } from "@orderhub/database";
import { Redis } from "ioredis";
import { PRISMA_TOKEN } from "../database/database.module";
import { REDIS_TOKEN } from "../redis/redis.module";

@Injectable()
export class MenusService {
    private readonly logger = new Logger(MenusService.name);

    constructor(
        @Inject(PRISMA_TOKEN) private readonly prisma: PrismaClient,
        @Inject(REDIS_TOKEN) private readonly redis: Redis,
    ) { }

    async findByCategory(categoryId: string) {
        return this.prisma.menuItem.findMany({
            where: { categoryId, isAvailable: true },
            orderBy: [{ isBestseller: "desc" }, { sortOrder: "asc" }],
        });
    }

    async findAll(restaurantId: string) {
        return this.prisma.menuItem.findMany({
            where: { restaurantId },
            orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
        });
    }

    async findOne(id: string) {
        const item = await this.prisma.menuItem.findUnique({
            where: { id },
            include: {
                category: { select: { id: true, name: true } },
                reviews: {
                    take: 5,
                    orderBy: { createdAt: "desc" },
                    include: { user: { select: { id: true, name: true, avatar: true } } },
                },
            },
        });
        if (!item) throw new NotFoundException("Menu item not found");
        return item;
    }

    async create(restaurantId: string, ownerId: string, dto: {
        categoryId: string;
        name: string;
        description?: string;
        price: number;
        discountedPrice?: number;
        imageUrl?: string;
        isVeg: boolean;
        isAvailable?: boolean;
        isBestseller?: boolean;
        preparationTime?: number;
        spicyLevel?: number;
        tags?: string[];
        sortOrder?: number;
    }) {
        await this.assertOwner(restaurantId, ownerId);
        const item = await this.prisma.menuItem.create({
            data: { ...dto, restaurantId },
        });
        await this.redis.del(`restaurant:${restaurantId}`);
        return item;
    }

    async update(itemId: string, ownerId: string, dto: Partial<{
        categoryId: string;
        name: string;
        description: string;
        price: number;
        discountedPrice: number;
        imageUrl: string;
        isVeg: boolean;
        isAvailable: boolean;
        isBestseller: boolean;
        preparationTime: number;
        spicyLevel: number;
        tags: string[];
        sortOrder: number;
    }>) {
        const item = await this.prisma.menuItem.findUnique({ where: { id: itemId } });
        if (!item) throw new NotFoundException("Menu item not found");
        await this.assertOwner(item.restaurantId, ownerId);
        const updated = await this.prisma.menuItem.update({ where: { id: itemId }, data: dto });
        await this.redis.del(`restaurant:${item.restaurantId}`);
        return updated;
    }

    async bulkUpdateAvailability(restaurantId: string, ownerId: string, updates: { id: string; isAvailable: boolean }[]) {
        await this.assertOwner(restaurantId, ownerId);
        await Promise.all(
            updates.map((u) =>
                this.prisma.menuItem.updateMany({
                    where: { id: u.id, restaurantId },
                    data: { isAvailable: u.isAvailable },
                }),
            ),
        );
        await this.redis.del(`restaurant:${restaurantId}`);
        return { updated: updates.length };
    }

    async remove(itemId: string, ownerId: string) {
        const item = await this.prisma.menuItem.findUnique({ where: { id: itemId } });
        if (!item) throw new NotFoundException("Menu item not found");
        await this.assertOwner(item.restaurantId, ownerId);
        await this.prisma.menuItem.delete({ where: { id: itemId } });
        await this.redis.del(`restaurant:${item.restaurantId}`);
    }

    private async assertOwner(restaurantId: string, ownerId: string) {
        const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
        if (!restaurant) throw new NotFoundException("Restaurant not found");
        if (restaurant.ownerId !== ownerId) throw new ForbiddenException("Not your restaurant");
    }
}

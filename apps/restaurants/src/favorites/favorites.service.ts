import {
    Injectable,
    Inject,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    Logger,
} from "@nestjs/common";
import { PrismaClient } from "@orderhub/database";
import { PRISMA_TOKEN } from "../database/database.module";

@Injectable()
export class FavoritesService {
    private readonly logger = new Logger(FavoritesService.name);

    constructor(
        @Inject(PRISMA_TOKEN) private readonly prisma: PrismaClient,
    ) { }

    // ─── Get user's favorites ─────────────────────────────────────────────────────

    async findUserFavorites(userId: string, type?: string, page = 1, pageSize = 20) {
        const skip = (page - 1) * pageSize;
        
        const where: any = { userId };
        if (type === 'restaurant') {
            where.menuItemId = null;
        } else if (type === 'item') {
            where.menuItemId = { not: null };
        }

        const [favorites, total] = await Promise.all([
            this.prisma.favorite.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: "desc" },
                include: {
                    restaurant: {
                        include: {
                            owner: { select: { id: true, fullName: true } },
                        },
                    },
                    menuItem: {
                        include: {
                            restaurant: { select: { id: true, name: true } },
                        },
                    },
                },
            }),
            this.prisma.favorite.count({ where }),
        ]);

        return { 
            data: favorites, 
            total, 
            page, 
            pageSize, 
            totalPages: Math.ceil(total / pageSize) 
        };
    }

    // ─── Add to favorites ─────────────────────────────────────────────────────────

    async addFavorite(userId: string, dto: { restaurantId?: string; menuItemId?: string }) {
        if (!dto.restaurantId && !dto.menuItemId) {
            throw new BadRequestException("Either restaurantId or menuItemId is required");
        }

        if (dto.restaurantId && dto.menuItemId) {
            throw new BadRequestException("Can only favorite one type at a time");
        }

        // Check if already exists
        const existing = await this.prisma.favorite.findFirst({
            where: {
                userId,
                restaurantId: dto.restaurantId || null,
                menuItemId: dto.menuItemId || null,
            },
        });

        if (existing) {
            throw new BadRequestException("Already in favorites");
        }

        // Verify restaurant/item exists
        if (dto.restaurantId) {
            const restaurant = await this.prisma.restaurant.findUnique({
                where: { id: dto.restaurantId },
            });
            if (!restaurant) throw new NotFoundException("Restaurant not found");
        }

        if (dto.menuItemId) {
            const menuItem = await this.prisma.menuItem.findUnique({
                where: { id: dto.menuItemId },
            });
            if (!menuItem) throw new NotFoundException("Menu item not found");
        }

        return this.prisma.favorite.create({
            data: {
                userId,
                restaurantId: dto.restaurantId || null,
                menuItemId: dto.menuItemId || null,
            },
            include: {
                restaurant: true,
                menuItem: true,
            },
        });
    }

    // ─── Remove from favorites ────────────────────────────────────────────────────

    async removeFavorite(id: string, userId: string) {
        const favorite = await this.prisma.favorite.findUnique({
            where: { id },
        });

        if (!favorite) throw new NotFoundException("Favorite not found");
        if (favorite.userId !== userId) throw new ForbiddenException("Not your favorite");

        await this.prisma.favorite.delete({ where: { id } });
        return { success: true };
    }

    // ─── Check if restaurant is favorited ───────────────────────────────────────────

    async checkFavorite(userId: string, restaurantId: string) {
        const favorite = await this.prisma.favorite.findFirst({
            where: {
                userId,
                restaurantId,
                menuItemId: null,
            },
        });

        return { isFavorite: !!favorite };
    }
}
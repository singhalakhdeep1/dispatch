import {
    Injectable,
    Inject,
    NotFoundException,
    ForbiddenException,
    Logger,
} from "@nestjs/common";
import { PrismaClient } from "@orderhub/database";
import { PRISMA_TOKEN } from "../database/database.module";

@Injectable()
export class OrderHistoryService {
    private readonly logger = new Logger(OrderHistoryService.name);

    constructor(
        @Inject(PRISMA_TOKEN) private readonly prisma: PrismaClient,
    ) { }

    // ─── Get user's order history ─────────────────────────────────────────────────

    async findUserOrderHistory(userId: string, page = 1, pageSize = 20) {
        const skip = (page - 1) * pageSize;

        const [history, total] = await Promise.all([
            this.prisma.orderHistory.findMany({
                where: { userId },
                skip,
                take: pageSize,
                orderBy: { orderAt: "desc" },
                include: {
                    order: {
                        include: {
                            restaurant: {
                                select: {
                                    id: true,
                                    name: true,
                                    imageUrl: true,
                                    cuisineType: true,
                                },
                            },
                            items: {
                                include: {
                                    menuItem: {
                                        select: {
                                            id: true,
                                            name: true,
                                            imageUrl: true,
                                            price: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            }),
            this.prisma.orderHistory.count({ where: { userId } }),
        ]);

        return {
            data: history,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    }

    // ─── Reorder from history ─────────────────────────────────────────────────────

    async reorder(orderId: string, userId: string) {
        const history = await this.prisma.orderHistory.findFirst({
            where: { userId, orderId },
            include: {
                order: {
                    include: {
                        items: {
                            include: {
                                menuItem: true,
                            },
                        },
                    },
                },
            },
        });

        if (!history) throw new NotFoundException("Order not found in history");

        // Increment reorder count
        await this.prisma.orderHistory.update({
            where: { id: history.id },
            data: { reorderCount: { increment: 1 } },
        });

        // Get or create cart
        let cart = await this.prisma.cart.findUnique({
            where: { userId },
        });

        if (!cart) {
            cart = await this.prisma.cart.create({
                data: {
                    userId,
                    restaurantId: history.order.restaurantId,
                },
            });
        } else if (cart.restaurantId !== history.order.restaurantId) {
            // Clear existing cart items if different restaurant
            await this.prisma.cartItem.deleteMany({
                where: { cartId: cart.id },
            });
            await this.prisma.cart.update({
                where: { id: cart.id },
                data: { restaurantId: history.order.restaurantId },
            });
        }

        // Add items to cart
        for (const item of history.order.items) {
            const existingCartItem = await this.prisma.cartItem.findFirst({
                where: {
                    cartId: cart.id,
                    menuItemId: item.menuItemId,
                },
            });

            if (existingCartItem) {
                await this.prisma.cartItem.update({
                    where: { id: existingCartItem.id },
                    data: { quantity: existingCartItem.quantity + item.quantity },
                });
            } else {
                await this.prisma.cartItem.create({
                    data: {
                        cartId: cart.id,
                        menuItemId: item.menuItemId,
                        quantity: item.quantity,
                    },
                });
            }
        }

        return {
            success: true,
            cartId: cart.id,
            restaurantId: history.order.restaurantId,
            itemCount: history.order.items.length,
        };
    }

    // ─── Find frequently ordered items ─────────────────────────────────────────────

    async findFrequentOrders(userId: string, limit = 5) {
        const history = await this.prisma.orderHistory.findMany({
            where: { userId },
            orderBy: { reorderCount: "desc" },
            take: limit,
            include: {
                order: {
                    include: {
                        restaurant: {
                            select: {
                                id: true,
                                name: true,
                                imageUrl: true,
                            },
                        },
                    },
                },
            },
        });

        return history;
    }
}
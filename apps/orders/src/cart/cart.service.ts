import {
    Injectable,
    Inject,
    NotFoundException,
    BadRequestException,
    Logger,
} from "@nestjs/common";
import { PrismaClient } from "@orderhub/database";
import { PRISMA_TOKEN } from "../database/database.module";
import { CartView, CartItemView } from "@orderhub/shared";

@Injectable()
export class CartService {
    private readonly logger = new Logger(CartService.name);

    constructor(
        @Inject(PRISMA_TOKEN) private readonly prisma: PrismaClient,
    ) { }

    // ─── Get cart ─────────────────────────────────────────────────────────────

    async getCart(userId: string): Promise<CartView | null> {
        const cart = await this.prisma.cart.findUnique({
            where: { userId },
            include: {
                restaurant: { select: { id: true, name: true } },
                items: {
                    include: {
                        menuItem: {
                            select: { id: true, name: true, price: true, discountedPrice: true, imageUrl: true, isVeg: true, isAvailable: true },
                        },
                    },
                },
            },
        });

        if (!cart) return null;

        const items: CartItemView[] = cart.items
            .filter((ci) => ci.menuItem.isAvailable)
            .map((ci) => {
                const effectivePrice = ci.menuItem.discountedPrice ?? ci.menuItem.price;
                return {
                    id: ci.id,
                    menuItemId: ci.menuItemId,
                    name: ci.menuItem.name,
                    price: effectivePrice,
                    originalPrice: ci.menuItem.price,
                    imageUrl: ci.menuItem.imageUrl ?? undefined,
                    isVeg: ci.menuItem.isVeg,
                    quantity: ci.quantity,
                    subtotal: effectivePrice * ci.quantity,
                };
            });

        return {
            id: cart.id,
            restaurantId: cart.restaurantId!,
            restaurantName: cart.restaurant?.name ?? "",
            items,
            itemsTotal: items.reduce((sum, i) => sum + i.subtotal, 0),
            itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
        };
    }

    // ─── Add to cart ──────────────────────────────────────────────────────────

    async addItem(userId: string, dto: { menuItemId: string; quantity: number }) {
        const menuItem = await this.prisma.menuItem.findUnique({
            where: { id: dto.menuItemId },
            include: { restaurant: true },
        });

        if (!menuItem) throw new NotFoundException("Menu item not found");
        if (!menuItem.isAvailable) throw new BadRequestException("Item is not available");
        if (menuItem.restaurant.status !== "OPEN") throw new BadRequestException("Restaurant is closed");

        // Check if cart already has items from a different restaurant
        const existingCart = await this.prisma.cart.findUnique({ where: { userId } });
        if (existingCart?.restaurantId && existingCart.restaurantId !== menuItem.restaurantId) {
            // Clear cart and start fresh (different restaurant)
            await this.prisma.cartItem.deleteMany({ where: { cartId: existingCart.id } });
            await this.prisma.cart.update({
                where: { userId },
                data: { restaurantId: menuItem.restaurantId },
            });
        }

        // Upsert cart
        const cart = await this.prisma.cart.upsert({
            where: { userId },
            create: { userId, restaurantId: menuItem.restaurantId },
            update: { restaurantId: menuItem.restaurantId },
        });

        // Upsert cart item (increment quantity if already exists)
        const existing = await this.prisma.cartItem.findFirst({
            where: { cartId: cart.id, menuItemId: dto.menuItemId },
        });

        if (existing) {
            await this.prisma.cartItem.update({
                where: { id: existing.id },
                data: { quantity: existing.quantity + dto.quantity },
            });
        } else {
            await this.prisma.cartItem.create({
                data: { cartId: cart.id, menuItemId: dto.menuItemId, quantity: dto.quantity },
            });
        }

        return this.getCart(userId);
    }

    // ─── Update item ──────────────────────────────────────────────────────────

    async updateItem(userId: string, menuItemId: string, quantity: number) {
        const cart = await this.prisma.cart.findUnique({ where: { userId } });
        if (!cart) throw new NotFoundException("Cart is empty");

        if (quantity <= 0) {
            await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id, menuItemId } });
        } else {
            const item = await this.prisma.cartItem.findFirst({ where: { cartId: cart.id, menuItemId } });
            if (!item) throw new NotFoundException("Item not in cart");
            await this.prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });
        }

        return this.getCart(userId);
    }

    // ─── Clear cart ───────────────────────────────────────────────────────────

    async clearCart(userId: string) {
        const cart = await this.prisma.cart.findUnique({ where: { userId } });
        if (!cart) return;
        await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
        await this.prisma.cart.update({ where: { userId }, data: { restaurantId: null } });
    }
}

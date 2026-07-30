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
export class MultiRestaurantService {
    private readonly logger = new Logger(MultiRestaurantService.name);

    constructor(
        @Inject(PRISMA_TOKEN) private readonly prisma: PrismaClient,
    ) { }

    // ─── Enable multi-restaurant cart ─────────────────────────────────────────────

    async enableMultiRestaurant(userId: string) {
        let cart = await this.prisma.cart.findUnique({
            where: { userId },
        });

        if (!cart) {
            cart = await this.prisma.cart.create({
                data: {
                    userId,
                    isMultiRestaurant: true,
                },
            });
        } else {
            // Clear existing single-restaurant cart items
            await this.prisma.cartItem.deleteMany({
                where: { cartId: cart.id },
            });

            await this.prisma.cart.update({
                where: { id: cart.id },
                data: {
                    isMultiRestaurant: true,
                    restaurantId: null,
                },
            });
        }

        return { success: true, cartId: cart.id };
    }

    // ─── Add to multi-restaurant cart ─────────────────────────────────────────────

    async addToMultiRestaurantCart(userId: string, dto: {
        restaurantId: string;
        menuItemId: string;
        quantity: number;
    }) {
        const cart = await this.prisma.cart.findUnique({
            where: { userId },
        });

        if (!cart) {
            throw new BadRequestException("Cart not found. Please enable multi-restaurant cart first.");
        }

        if (!cart.isMultiRestaurant) {
            throw new BadRequestException("Cart is not in multi-restaurant mode");
        }

        // Validate restaurant and menu item
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: dto.restaurantId },
        });

        if (!restaurant) throw new NotFoundException("Restaurant not found");
        if (restaurant.status !== "OPEN") {
            throw new BadRequestException("Restaurant is not currently accepting orders");
        }

        const menuItem = await this.prisma.menuItem.findUnique({
            where: { id: dto.menuItemId },
        });

        if (!menuItem) throw new NotFoundException("Menu item not found");
        if (menuItem.restaurantId !== dto.restaurantId) {
            throw new BadRequestException("Menu item does not belong to the specified restaurant");
        }
        if (!menuItem.isAvailable) {
            throw new BadRequestException("Menu item is not available");
        }

        // Get or create multi-restaurant cart for this restaurant
        let multiRestaurantCart = await this.prisma.multiRestaurantCart.findUnique({
            where: {
                cartId_restaurantId: {
                    cartId: cart.id,
                    restaurantId: dto.restaurantId,
                },
            },
        });

        if (!multiRestaurantCart) {
            multiRestaurantCart = await this.prisma.multiRestaurantCart.create({
                data: {
                    cartId: cart.id,
                    restaurantId: dto.restaurantId,
                    subtotal: 0,
                },
            });
        }

        // Add or update item
        const unitPrice = menuItem.discountedPrice || menuItem.price;
        const totalPrice = unitPrice * dto.quantity;

        let cartItem = await this.prisma.multiRestaurantCartItem.findUnique({
            where: {
                multiRestaurantCartId_menuItemId: {
                    multiRestaurantCartId: multiRestaurantCart.id,
                    menuItemId: dto.menuItemId,
                },
            },
        });

        if (cartItem) {
            cartItem = await this.prisma.multiRestaurantCartItem.update({
                where: { id: cartItem.id },
                data: {
                    quantity: cartItem.quantity + dto.quantity,
                    totalPrice: cartItem.totalPrice + totalPrice,
                },
            });
        } else {
            cartItem = await this.prisma.multiRestaurantCartItem.create({
                data: {
                    multiRestaurantCartId: multiRestaurantCart.id,
                    menuItemId: dto.menuItemId,
                    quantity: dto.quantity,
                    unitPrice,
                    totalPrice,
                },
            });
        }

        // Update restaurant subtotal
        await this.prisma.multiRestaurantCart.update({
            where: { id: multiRestaurantCart.id },
            data: { subtotal: { increment: totalPrice } },
        });

        return {
            success: true,
            cartItem,
            restaurantSubtotal: multiRestaurantCart.subtotal + totalPrice,
        };
    }

    // ─── Update multi-restaurant cart item ─────────────────────────────────────

    async updateMultiRestaurantCartItem(id: string, userId: string, quantity: number) {
        const cartItem = await this.prisma.multiRestaurantCartItem.findUnique({
            where: { id },
            include: { multiRestaurantCart: true },
        });

        if (!cartItem) throw new NotFoundException("Cart item not found");

        // Verify ownership
        const cart = await this.prisma.cart.findUnique({
            where: { id: cartItem.multiRestaurantCart.cartId },
        });

        if (!cart || cart.userId !== userId) {
            throw new ForbiddenException("Not your cart");
        }

        if (quantity <= 0) {
            return this.removeMultiRestaurantCartItem(id, userId);
        }

        const priceDifference = (quantity - cartItem.quantity) * cartItem.unitPrice;

        await this.prisma.multiRestaurantCartItem.update({
            where: { id },
            data: {
                quantity,
                totalPrice: quantity * cartItem.unitPrice,
            },
        });

        await this.prisma.multiRestaurantCart.update({
            where: { id: cartItem.multiRestaurantCartId },
            data: { subtotal: { increment: priceDifference } },
        });

        return { success: true };
    }

    // ─── Remove multi-restaurant cart item ─────────────────────────────────────

    async removeMultiRestaurantCartItem(id: string, userId: string) {
        const cartItem = await this.prisma.multiRestaurantCartItem.findUnique({
            where: { id },
            include: { multiRestaurantCart: true },
        });

        if (!cartItem) throw new NotFoundException("Cart item not found");

        const cart = await this.prisma.cart.findUnique({
            where: { id: cartItem.multiRestaurantCart.cartId },
        });

        if (!cart || cart.userId !== userId) {
            throw new ForbiddenException("Not your cart");
        }

        await this.prisma.multiRestaurantCartItem.delete({
            where: { id },
        });

        await this.prisma.multiRestaurantCart.update({
            where: { id: cartItem.multiRestaurantCartId },
            data: { subtotal: { decrement: cartItem.totalPrice } },
        });

        return { success: true };
    }

    // ─── Remove restaurant from cart ───────────────────────────────────────────

    async removeRestaurantFromCart(restaurantId: string, userId: string) {
        const cart = await this.prisma.cart.findUnique({
            where: { userId },
        });

        if (!cart) throw new NotFoundException("Cart not found");

        const multiRestaurantCart = await this.prisma.multiRestaurantCart.findUnique({
            where: {
                cartId_restaurantId: {
                    cartId: cart.id,
                    restaurantId,
                },
            },
        });

        if (!multiRestaurantCart) {
            throw new NotFoundException("Restaurant not found in cart");
        }

        await this.prisma.multiRestaurantCartItem.deleteMany({
            where: { multiRestaurantCartId: multiRestaurantCart.id },
        });

        await this.prisma.multiRestaurantCart.delete({
            where: { id: multiRestaurantCart.id },
        });

        return { success: true };
    }

    // ─── Get multi-restaurant cart ─────────────────────────────────────────────

    async getMultiRestaurantCart(userId: string) {
        const cart = await this.prisma.cart.findUnique({
            where: { userId },
            include: {
                multiRestaurantCarts: {
                    include: {
                        restaurant: {
                            select: {
                                id: true,
                                name: true,
                                imageUrl: true,
                                cuisineType: true,
                                avgDeliveryTime: true,
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
                                        discountedPrice: true,
                                        isVeg: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!cart) {
            return { isMultiRestaurant: false, restaurants: [], totalAmount: 0 };
        }

        const totalAmount = cart.multiRestaurantCarts.reduce(
            (sum, rc) => sum + rc.subtotal,
            0
        );

        return {
            isMultiRestaurant: cart.isMultiRestaurant,
            restaurants: cart.multiRestaurantCarts,
            totalAmount,
            restaurantCount: cart.multiRestaurantCarts.length,
        };
    }

    // ─── Checkout multi-restaurant order ───────────────────────────────────────

    async checkoutMultiRestaurant(userId: string, dto: {
        addressId: string;
        instructions?: string;
    }) {
        const cart = await this.prisma.cart.findUnique({
            where: { userId },
            include: {
                multiRestaurantCarts: {
                    include: {
                        restaurant: true,
                        items: {
                            include: { menuItem: true },
                        },
                    },
                },
            },
        });

        if (!cart || !cart.isMultiRestaurant) {
            throw new BadRequestException("No multi-restaurant cart found");
        }

        if (cart.multiRestaurantCarts.length === 0) {
            throw new BadRequestException("Cart is empty");
        }

        // Validate address
        const address = await this.prisma.address.findUnique({
            where: { id: dto.addressId },
        });

        if (!address || address.userId !== userId) {
            throw new NotFoundException("Address not found");
        }

        // Create separate orders for each restaurant
        const orders = [];

        for (const restaurantCart of cart.multiRestaurantCarts) {
            const itemsTotal = restaurantCart.subtotal;
            const deliveryFee = restaurantCart.restaurant.deliveryFee || 4900;
            const platformFee = 499;
            const taxes = Math.floor(itemsTotal * restaurantCart.restaurant.taxPercent / 100);
            const totalAmount = itemsTotal + deliveryFee + platformFee + taxes;

            const order = await this.prisma.order.create({
                data: {
                    userId,
                    restaurantId: restaurantCart.restaurantId,
                    addressId: dto.addressId,
                    status: "PLACED",
                    paymentMethod: "ONLINE",
                    itemsTotal,
                    deliveryFee,
                    platformFee,
                    taxes,
                    totalAmount,
                    deliveryAddress: address.line1,
                    deliveryLat: address.latitude,
                    deliveryLng: address.longitude,
                    instructions: dto.instructions,
                    isGroupOrder: false,
                    isMultiRestaurant: true,
                    isRated: false,
                },
            });

            // Create order items
            for (const cartItem of restaurantCart.items) {
                await this.prisma.orderItem.create({
                    data: {
                        orderId: order.id,
                        menuItemId: cartItem.menuItemId,
                        quantity: cartItem.quantity,
                        unitPrice: cartItem.unitPrice,
                        totalPrice: cartItem.totalPrice,
                    },
                });
            }

            orders.push({
                orderId: order.id,
                restaurantId: restaurantCart.restaurantId,
                restaurantName: restaurantCart.restaurant.name,
                totalAmount,
            });
        }

        // Clear cart
        await this.prisma.multiRestaurantCartItem.deleteMany({
            where: {
                multiRestaurantCartId: {
                    in: cart.multiRestaurantCarts.map(rc => rc.id),
                },
            },
        });

        await this.prisma.multiRestaurantCart.deleteMany({
            where: { cartId: cart.id },
        });

        await this.prisma.cart.update({
            where: { id: cart.id },
            data: {
                isMultiRestaurant: false,
                restaurantId: null,
            },
        });

        return {
            success: true,
            orders,
            totalAmount: orders.reduce((sum, o) => sum + o.totalAmount, 0),
            orderCount: orders.length,
        };
    }
}
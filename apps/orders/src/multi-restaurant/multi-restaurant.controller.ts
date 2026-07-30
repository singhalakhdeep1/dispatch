import { Controller, Get, Post, Patch, Delete, Body, Param, Headers, Query, DefaultValuePipe, ParseIntPipe } from "@nestjs/common";
import { MultiRestaurantService } from "./multi-restaurant.service";

@Controller("v1/multi-restaurant")
export class MultiRestaurantController {
    constructor(private readonly service: MultiRestaurantService) { }

    @Post("cart/enable")
    enableMultiRestaurant(@Headers("x-user-id") userId: string) {
        return this.service.enableMultiRestaurant(userId);
    }

    @Post("cart/add")
    addToMultiRestaurantCart(
        @Headers("x-user-id") userId: string,
        @Body() dto: { restaurantId: string; menuItemId: string; quantity: number },
    ) {
        return this.service.addToMultiRestaurantCart(userId, dto);
    }

    @Patch("cart/items/:id")
    updateMultiRestaurantCartItem(
        @Param("id") id: string,
        @Headers("x-user-id") userId: string,
        @Body() dto: { quantity: number },
    ) {
        return this.service.updateMultiRestaurantCartItem(id, userId, dto.quantity);
    }

    @Delete("cart/items/:id")
    removeMultiRestaurantCartItem(
        @Param("id") id: string,
        @Headers("x-user-id") userId: string,
    ) {
        return this.service.removeMultiRestaurantCartItem(id, userId);
    }

    @Delete("cart/restaurants/:restaurantId")
    removeRestaurantFromCart(
        @Param("restaurantId") restaurantId: string,
        @Headers("x-user-id") userId: string,
    ) {
        return this.service.removeRestaurantFromCart(restaurantId, userId);
    }

    @Get("cart")
    getMultiRestaurantCart(@Headers("x-user-id") userId: string) {
        return this.service.getMultiRestaurantCart(userId);
    }

    @Post("checkout")
    checkoutMultiRestaurant(
        @Headers("x-user-id") userId: string,
        @Body() dto: {
            addressId: string;
            instructions?: string;
        },
    ) {
        return this.service.checkoutMultiRestaurant(userId, dto);
    }
}
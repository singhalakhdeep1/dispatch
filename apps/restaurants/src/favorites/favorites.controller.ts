import { Controller, Get, Post, Delete, Body, Param, Headers, Query, DefaultValuePipe, ParseIntPipe } from "@nestjs/common";
import { FavoritesService } from "./favorites.service";

@Controller("v1/favorites")
export class FavoritesController {
    constructor(private readonly service: FavoritesService) { }

    @Get()
    findMyFavorites(
        @Headers("x-user-id") userId: string,
        @Query("type") type?: string, // 'restaurant' or 'item'
        @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query("pageSize", new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    ) {
        return this.service.findUserFavorites(userId, type, page, pageSize);
    }

    @Post()
    addFavorite(
        @Headers("x-user-id") userId: string,
        @Body() dto: { restaurantId?: string; menuItemId?: string },
    ) {
        return this.service.addFavorite(userId, dto);
    }

    @Delete(":id")
    removeFavorite(
        @Param("id") id: string,
        @Headers("x-user-id") userId: string,
    ) {
        return this.service.removeFavorite(id, userId);
    }

    @Get("check/:restaurantId")
    checkFavorite(
        @Param("restaurantId") restaurantId: string,
        @Headers("x-user-id") userId: string,
    ) {
        return this.service.checkFavorite(userId, restaurantId);
    }
}
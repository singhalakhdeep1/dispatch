import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    Headers,
    HttpCode,
    HttpStatus,
    ParseIntPipe,
    DefaultValuePipe,
    ParseFloatPipe,
} from "@nestjs/common";
import { RestaurantsService } from "./restaurants.service";
import { RestaurantStatus } from "@orderhub/database";
import {
    CreateRestaurantSchema,
    UpdateRestaurantSchema,
    UpdateRestaurantStatusSchema,
    ListRestaurantsSchema,
} from "@orderhub/shared";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { z } from "zod";

@Controller("v1/restaurants")
export class RestaurantsController {
    constructor(private readonly service: RestaurantsService) { }

    // GET /v1/restaurants — public listing
    @Get()
    findAll(
        @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query("pageSize", new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
        @Query("lat") lat?: string,
        @Query("lng") lng?: string,
        @Query("radiusKm") radiusKm?: string,
        @Query("cuisine") cuisine?: string,
        @Query("search") search?: string,
        @Query("isVeg") isVeg?: string,
        @Query("minRating") minRating?: string,
        @Query("sortBy") sortBy?: "rating" | "deliveryTime" | "distance",
    ) {
        return this.service.findAll({
            page,
            pageSize,
            lat: lat ? parseFloat(lat) : undefined,
            lng: lng ? parseFloat(lng) : undefined,
            radiusKm: radiusKm ? parseFloat(radiusKm) : undefined,
            cuisine,
            search,
            isVeg: isVeg !== undefined ? isVeg === "true" : undefined,
            minRating: minRating ? parseFloat(minRating) : undefined,
            sortBy,
        });
    }

    // GET /v1/restaurants/mine — owner's restaurants
    @Get("mine")
    findMine(@Headers("x-user-id") userId: string) {
        return this.service.findMine(userId);
    }

    // GET /v1/restaurants/:id — single restaurant with menu
    @Get(":id")
    findOne(@Param("id") id: string) {
        return this.service.findOne(id);
    }

    // POST /v1/restaurants — restaurant owner creates
    @Post()
    create(
        @Headers("x-user-id") userId: string,
        @Body(new ZodValidationPipe(CreateRestaurantSchema)) dto: z.infer<typeof CreateRestaurantSchema>,
    ) {
        return this.service.create(userId, dto);
    }

    // PATCH /v1/restaurants/:id — restaurant owner updates
    @Patch(":id")
    update(
        @Param("id") id: string,
        @Headers("x-user-id") userId: string,
        @Body(new ZodValidationPipe(UpdateRestaurantSchema)) dto: z.infer<typeof UpdateRestaurantSchema>,
    ) {
        return this.service.update(id, userId, dto);
    }

    // PATCH /v1/restaurants/:id/status — admin only
    @Patch(":id/status")
    updateStatus(
        @Param("id") id: string,
        @Headers("x-user-id") adminId: string,
        @Body(new ZodValidationPipe(UpdateRestaurantStatusSchema)) dto: z.infer<typeof UpdateRestaurantStatusSchema>,
    ) {
        return this.service.updateStatus(id, dto.status as RestaurantStatus, adminId);
    }

    // PATCH /v1/restaurants/:id/toggle — owner toggles open/closed
    @Patch(":id/toggle")
    toggleOpen(
        @Param("id") id: string,
        @Headers("x-user-id") userId: string,
        @Body("open") open: boolean,
    ) {
        return this.service.toggleOpen(id, userId, open);
    }

    // DELETE /v1/restaurants/:id
    @Delete(":id")
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param("id") id: string, @Headers("x-user-id") userId: string) {
        return this.service.remove(id, userId);
    }

    // GET /v1/restaurants/:id/analytics
    @Get(":id/analytics")
    getAnalytics(
        @Param("id") id: string,
        @Headers("x-user-id") userId: string,
        @Query("days", new DefaultValuePipe(30), ParseIntPipe) days: number,
    ) {
        return this.service.getAnalytics(id, userId, days);
    }
}

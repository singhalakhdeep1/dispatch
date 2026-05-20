import { Controller, Get, Post, Patch, Delete, Body, Param, Headers, HttpCode, HttpStatus } from "@nestjs/common";
import { CategoriesService } from "./categories.service";
import { CreateCategorySchema, UpdateCategorySchema } from "@orderhub/shared";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { z } from "zod";

@Controller("v1/restaurants/:restaurantId/categories")
export class CategoriesController {
    constructor(private readonly service: CategoriesService) { }

    @Get()
    findAll(@Param("restaurantId") restaurantId: string) {
        return this.service.findAll(restaurantId);
    }

    @Post()
    create(
        @Param("restaurantId") restaurantId: string,
        @Headers("x-user-id") userId: string,
        @Body(new ZodValidationPipe(CreateCategorySchema)) dto: z.infer<typeof CreateCategorySchema>,
    ) {
        return this.service.create(restaurantId, userId, dto);
    }

    @Patch(":categoryId")
    update(
        @Param("categoryId") categoryId: string,
        @Headers("x-user-id") userId: string,
        @Body(new ZodValidationPipe(UpdateCategorySchema)) dto: z.infer<typeof UpdateCategorySchema>,
    ) {
        return this.service.update(categoryId, userId, dto);
    }

    @Delete(":categoryId")
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param("categoryId") categoryId: string, @Headers("x-user-id") userId: string) {
        return this.service.remove(categoryId, userId);
    }
}

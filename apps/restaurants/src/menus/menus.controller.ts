import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Headers,
    HttpCode,
    HttpStatus,
} from "@nestjs/common";
import { MenusService } from "./menus.service";
import { CreateMenuItemSchema, UpdateMenuItemSchema } from "@orderhub/shared";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { z } from "zod";

@Controller("v1/restaurants/:restaurantId/menu")
export class MenusController {
    constructor(private readonly service: MenusService) { }

    @Get()
    findAll(@Param("restaurantId") restaurantId: string) {
        return this.service.findAll(restaurantId);
    }

    @Get(":itemId")
    findOne(@Param("itemId") itemId: string) {
        return this.service.findOne(itemId);
    }

    @Post()
    create(
        @Param("restaurantId") restaurantId: string,
        @Headers("x-user-id") userId: string,
        @Body(new ZodValidationPipe(CreateMenuItemSchema)) dto: z.infer<typeof CreateMenuItemSchema>,
    ) {
        return this.service.create(restaurantId, userId, dto);
    }

    @Patch("bulk-availability")
    bulkUpdateAvailability(
        @Param("restaurantId") restaurantId: string,
        @Headers("x-user-id") userId: string,
        @Body() body: { updates: { id: string; isAvailable: boolean }[] },
    ) {
        return this.service.bulkUpdateAvailability(restaurantId, userId, body.updates);
    }

    @Patch(":itemId")
    update(
        @Param("itemId") itemId: string,
        @Headers("x-user-id") userId: string,
        @Body(new ZodValidationPipe(UpdateMenuItemSchema)) dto: z.infer<typeof UpdateMenuItemSchema>,
    ) {
        return this.service.update(itemId, userId, dto);
    }

    @Delete(":itemId")
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param("itemId") itemId: string, @Headers("x-user-id") userId: string) {
        return this.service.remove(itemId, userId);
    }
}

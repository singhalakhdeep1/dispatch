import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Query,
    Param,
    Body,
    Request,
    UseGuards,
    SetMetadata,
    HttpCode,
    HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard, IS_PUBLIC_KEY } from "../auth/guards/jwt.guard";
import { ProxyService } from "../proxy/proxy.service";

@ApiTags("restaurants")
@Controller({ path: "restaurants", version: "1" })
export class RestaurantsController {
    constructor(private readonly proxy: ProxyService) { }

    @Get()
    @SetMetadata(IS_PUBLIC_KEY, true)
    findAll(@Query() query: any, @Request() req: any) {
        const qs = new URLSearchParams(query).toString();
        return this.proxy.forward("restaurants", `/v1/restaurants?${qs}`, "GET", null, req);
    }

    @Get("mine")
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    findMine(@Request() req: any) {
        return this.proxy.forward("restaurants", "/v1/restaurants/mine", "GET", null, req);
    }

    @Get(":id")
    @SetMetadata(IS_PUBLIC_KEY, true)
    findOne(@Param("id") id: string, @Request() req: any) {
        return this.proxy.forward("restaurants", `/v1/restaurants/${id}`, "GET", null, req);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    create(@Body() body: any, @Request() req: any) {
        return this.proxy.forward("restaurants", "/v1/restaurants", "POST", body, req);
    }

    @Patch(":id")
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    update(@Param("id") id: string, @Body() body: any, @Request() req: any) {
        return this.proxy.forward("restaurants", `/v1/restaurants/${id}`, "PATCH", body, req);
    }

    @Patch(":id/status")
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    updateStatus(@Param("id") id: string, @Body() body: any, @Request() req: any) {
        return this.proxy.forward("restaurants", `/v1/restaurants/${id}/status`, "PATCH", body, req);
    }

    @Patch(":id/toggle")
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    toggleOpen(@Param("id") id: string, @Body() body: any, @Request() req: any) {
        return this.proxy.forward("restaurants", `/v1/restaurants/${id}/toggle`, "PATCH", body, req);
    }

    @Delete(":id")
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param("id") id: string, @Request() req: any) {
        return this.proxy.forward("restaurants", `/v1/restaurants/${id}`, "DELETE", null, req);
    }

    @Get(":id/analytics")
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    getAnalytics(@Param("id") id: string, @Query() query: any, @Request() req: any) {
        const qs = new URLSearchParams(query).toString();
        return this.proxy.forward("restaurants", `/v1/restaurants/${id}/analytics?${qs}`, "GET", null, req);
    }

    // ─── Categories ───────────────────────────────────────────────────────────

    @Get(":restaurantId/categories")
    @SetMetadata(IS_PUBLIC_KEY, true)
    getCategories(@Param("restaurantId") restaurantId: string, @Request() req: any) {
        return this.proxy.forward("restaurants", `/v1/restaurants/${restaurantId}/categories`, "GET", null, req);
    }

    @Post(":restaurantId/categories")
    @UseGuards(JwtAuthGuard)
    createCategory(@Param("restaurantId") restaurantId: string, @Body() body: any, @Request() req: any) {
        return this.proxy.forward("restaurants", `/v1/restaurants/${restaurantId}/categories`, "POST", body, req);
    }

    @Patch(":restaurantId/categories/:categoryId")
    @UseGuards(JwtAuthGuard)
    updateCategory(@Param("restaurantId") restaurantId: string, @Param("categoryId") categoryId: string, @Body() body: any, @Request() req: any) {
        return this.proxy.forward("restaurants", `/v1/restaurants/${restaurantId}/categories/${categoryId}`, "PATCH", body, req);
    }

    @Delete(":restaurantId/categories/:categoryId")
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    deleteCategory(@Param("restaurantId") restaurantId: string, @Param("categoryId") categoryId: string, @Request() req: any) {
        return this.proxy.forward("restaurants", `/v1/restaurants/${restaurantId}/categories/${categoryId}`, "DELETE", null, req);
    }

    // ─── Menu items ───────────────────────────────────────────────────────────

    @Get(":restaurantId/menu")
    @SetMetadata(IS_PUBLIC_KEY, true)
    getMenu(@Param("restaurantId") restaurantId: string, @Request() req: any) {
        return this.proxy.forward("restaurants", `/v1/restaurants/${restaurantId}/menu`, "GET", null, req);
    }

    @Post(":restaurantId/menu")
    @UseGuards(JwtAuthGuard)
    createMenuItem(@Param("restaurantId") restaurantId: string, @Body() body: any, @Request() req: any) {
        return this.proxy.forward("restaurants", `/v1/restaurants/${restaurantId}/menu`, "POST", body, req);
    }

    @Patch(":restaurantId/menu/bulk-availability")
    @UseGuards(JwtAuthGuard)
    bulkUpdateAvailability(@Param("restaurantId") restaurantId: string, @Body() body: any, @Request() req: any) {
        return this.proxy.forward("restaurants", `/v1/restaurants/${restaurantId}/menu/bulk-availability`, "PATCH", body, req);
    }

    @Patch(":restaurantId/menu/:itemId")
    @UseGuards(JwtAuthGuard)
    updateMenuItem(@Param("restaurantId") restaurantId: string, @Param("itemId") itemId: string, @Body() body: any, @Request() req: any) {
        return this.proxy.forward("restaurants", `/v1/restaurants/${restaurantId}/menu/${itemId}`, "PATCH", body, req);
    }

    @Delete(":restaurantId/menu/:itemId")
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    deleteMenuItem(@Param("restaurantId") restaurantId: string, @Param("itemId") itemId: string, @Request() req: any) {
        return this.proxy.forward("restaurants", `/v1/restaurants/${restaurantId}/menu/${itemId}`, "DELETE", null, req);
    }
}


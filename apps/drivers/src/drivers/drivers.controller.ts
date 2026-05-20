import {
    Controller,
    Patch,
    Get,
    Body,
    Param,
    Query,
    Request,
    HttpCode,
    HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { DriversService } from "./drivers.service";
import { LocationService } from "../location/location.service";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import {
    UpdateLocationSchema,
    UpdateDriverStatusSchema,
    RespondToOrderSchema,
    UpdateLocationDto,
    UpdateDriverStatusDto,
    RespondToOrderDto,
} from "@orderhub/shared";
import { DriverStatus } from "@orderhub/database";

@ApiTags("drivers")
@Controller({ path: "drivers", version: "1" })
export class DriversController {
    constructor(
        private readonly driversService: DriversService,
        private readonly locationService: LocationService,
    ) {}

    @Patch("location")
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: "Update driver location" })
    async updateLocation(
        @Body(new ZodValidationPipe(UpdateLocationSchema)) dto: UpdateLocationDto,
        @Request() req: any,
    ) {
        const driverId: string = req.headers["x-driver-id"] ?? req.user?.driverId;
        await this.locationService.updateLocation(driverId, dto);
    }

    @Patch("status")
    @ApiOperation({ summary: "Toggle online/offline" })
    updateStatus(
        @Body(new ZodValidationPipe(UpdateDriverStatusSchema)) dto: UpdateDriverStatusDto,
        @Request() req: any,
    ) {
        const userId: string = req.headers["x-user-id"] ?? req.user?.sub;
        return this.driversService.updateStatus(userId, dto.status as DriverStatus);
    }

    @Get("nearby")
    @ApiOperation({ summary: "List nearby online drivers (internal)" })
    getNearby(
        @Query("lat") lat: string,
        @Query("lng") lng: string,
        @Query("radiusKm") radiusKm = "5",
    ) {
        return this.driversService.getNearbyDrivers(
            parseFloat(lat),
            parseFloat(lng),
            parseFloat(radiusKm),
        );
    }

    @Get(":id")
    @ApiOperation({ summary: "Get driver profile" })
    getDriver(@Param("id") id: string) {
        return this.driversService.getDriver(id);
    }

    @Patch(":id/orders/:orderId/respond")
    @ApiOperation({ summary: "Accept or reject an order request" })
    respond(
        @Param("id") id: string,
        @Param("orderId") orderId: string,
        @Body(new ZodValidationPipe(RespondToOrderSchema)) dto: RespondToOrderDto,
    ) {
        return this.driversService.respondToOrder(id, orderId, dto.accept, dto.rejectReason);
    }
}

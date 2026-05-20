import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Inject,
    Logger,
} from "@nestjs/common";
import { PrismaClient, DriverStatus } from "@orderhub/database";
import { PRISMA_TOKEN } from "../database/database.module";
import { KafkaService } from "../kafka/kafka.service";
import { LocationService } from "../location/location.service";
import {
    KAFKA_TOPICS,
    DriverAssignedPayload,
    DriverStatusChangedPayload,
    NearbyDriver,
    JwtPayload,
} from "@orderhub/shared";

@Injectable()
export class DriversService {
    private readonly logger = new Logger(DriversService.name);

    constructor(
        @Inject(PRISMA_TOKEN) private readonly prisma: PrismaClient,
        private readonly kafka: KafkaService,
        private readonly location: LocationService,
    ) {}

    async updateStatus(userId: string, status: DriverStatus) {
        const driver = await this.prisma.driver.findUniqueOrThrow({ where: { userId } });

        await this.prisma.driver.update({
            where: { id: driver.id },
            data: { status },
        });

        if (status === DriverStatus.OFFLINE) {
            await this.location.removeFromGeo(driver.id);
        }

        await this.kafka.emit<DriverStatusChangedPayload>(KAFKA_TOPICS.DRIVER_STATUS_CHANGED, {
            driverId: driver.id,
            userId,
            status: status as any,
            changedAt: new Date().toISOString(),
        });

        return { driverId: driver.id, status };
    }

    async getDriver(driverId: string) {
        return this.prisma.driver.findUniqueOrThrow({
            where: { id: driverId },
            include: {
                user: { select: { id: true, email: true, fullName: true, phone: true, avatarUrl: true } },
            },
        });
    }

    /**
     * Find the nearest ONLINE driver using PostGIS ST_DWithin.
     * Falls back to Redis geo cache for speed.
     */
    async findNearestOnlineDriver(
        restaurantLat: number,
        restaurantLng: number,
        radiusKm: number = 5,
    ): Promise<string | null> {
        // Try Redis geo first (faster)
        const nearbyIds = await this.location.getNearbyDriverIds(
            restaurantLat,
            restaurantLng,
            radiusKm,
        );

        if (nearbyIds.length > 0) {
            // Verify they are actually ONLINE in DB
            const driver = await this.prisma.driver.findFirst({
                where: { id: { in: nearbyIds }, status: DriverStatus.ONLINE },
                select: { id: true },
                orderBy: { lastSeenAt: "desc" },
            });
            if (driver) return driver.id;
        }

        // PostGIS fallback — precise query using last known location
        const results = await this.prisma.$queryRaw<{ id: string; dist_m: number }[]>`
            SELECT d.id,
                   ST_Distance(
                       ST_MakePoint(d."lastLng", d."lastLat")::geography,
                       ST_MakePoint(${restaurantLng}, ${restaurantLat})::geography
                   ) AS dist_m
            FROM "Driver" d
            WHERE d.status = 'ONLINE'
              AND d."lastLat" IS NOT NULL
              AND ST_DWithin(
                  ST_MakePoint(d."lastLng", d."lastLat")::geography,
                  ST_MakePoint(${restaurantLng}, ${restaurantLat})::geography,
                  ${radiusKm * 1000}
              )
            ORDER BY dist_m ASC
            LIMIT 1
        `;

        return results[0]?.id ?? null;
    }

    async assignDriver(orderId: string, driverId: string, userId: string) {
        await this.prisma.driver.update({
            where: { id: driverId },
            data: { status: DriverStatus.ON_TRIP },
        });

        const payload: DriverAssignedPayload = {
            orderId,
            driverId,
            userId,
            assignedAt: new Date().toISOString(),
        };

        await this.kafka.emit(KAFKA_TOPICS.DRIVER_ASSIGNED, payload);
        this.logger.log(`Driver ${driverId} assigned to order ${orderId}`);
    }

    async respondToOrder(
        driverId: string,
        orderId: string,
        accept: boolean,
        rejectReason?: string,
    ) {
        if (!accept) {
            // Put driver back online, mark order as finding driver again
            await this.prisma.driver.update({
                where: { id: driverId },
                data: { status: DriverStatus.ONLINE },
            });

            this.logger.log(`Driver ${driverId} rejected order ${orderId}: ${rejectReason}`);

            // Re-emit order.finding-driver so the consumer tries to find another driver
            await this.kafka.emit(KAFKA_TOPICS.ORDER_FINDING_DRIVER, {
                orderId,
                retryCount: 1,
                rejectedDriverId: driverId,
            });

            return { accepted: false };
        }

        // Driver accepted — fetch order details to confirm
        const order = await this.prisma.order.findUniqueOrThrow({
            where: { id: orderId },
            include: { restaurant: true },
        });

        return { accepted: true, order };
    }

    async getNearbyDrivers(lat: number, lng: number, radiusKm: number): Promise<NearbyDriver[]> {
        const results = await this.prisma.$queryRaw<
            { id: string; lat: number; lng: number; vehicleType: string; dist_m: number }[]
        >`
            SELECT d.id,
                   d."lastLat" AS lat,
                   d."lastLng" AS lng,
                   d."vehicleType",
                   ST_Distance(
                       ST_MakePoint(d."lastLng", d."lastLat")::geography,
                       ST_MakePoint(${lng}, ${lat})::geography
                   ) AS dist_m
            FROM "Driver" d
            WHERE d.status = 'ONLINE'
              AND d."lastLat" IS NOT NULL
              AND ST_DWithin(
                  ST_MakePoint(d."lastLng", d."lastLat")::geography,
                  ST_MakePoint(${lng}, ${lat})::geography,
                  ${radiusKm * 1000}
              )
            ORDER BY dist_m ASC
            LIMIT 20
        `;

        return results.map((r) => ({
            driverId: r.id,
            lat: r.lat,
            lng: r.lng,
            vehicleType: r.vehicleType as any,
            distanceKm: r.dist_m / 1000,
        }));
    }
}

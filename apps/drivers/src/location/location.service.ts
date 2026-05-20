import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaClient } from "@orderhub/database";
import { PRISMA_TOKEN } from "../database/database.module";
import { UpdateLocationDto } from "@orderhub/shared";
import Redis from "ioredis";

export const REDIS_GEO_KEY = "orderhub:drivers:online";

@Injectable()
export class LocationService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(LocationService.name);
    private redis: Redis;

    constructor(
        @Inject(PRISMA_TOKEN) private readonly prisma: PrismaClient,
        private readonly config: ConfigService,
    ) {
        this.redis = new Redis(config.get<string>("app.redis.url")!);
    }

    async onModuleInit() {
        this.redis.on("error", (err) => this.logger.error("Redis error", err));
        this.logger.log("LocationService connected to Redis");
    }

    async onModuleDestroy() {
        await this.redis.quit();
    }

    async updateLocation(driverId: string, dto: UpdateLocationDto) {
        // Persist to DriverLocation table
        await this.prisma.driverLocation.create({
            data: {
                driverId,
                latitude: dto.lat,
                longitude: dto.lng,
                heading: dto.heading,
                speed: dto.speed,
            },
        });

        // Update driver's cached last position
        await this.prisma.driver.update({
            where: { id: driverId },
            data: {
                lastLat: dto.lat,
                lastLng: dto.lng,
                lastSeenAt: new Date(),
            },
        });

        // Redis GEOADD for fast geo queries
        await this.redis.geoadd(REDIS_GEO_KEY, dto.lng, dto.lat, driverId);
    }

    async getNearbyDriverIds(lat: number, lng: number, radiusKm: number): Promise<string[]> {
        // ioredis georadius: returns driver IDs within radiusKm
        const results = await this.redis.georadius(
            REDIS_GEO_KEY,
            lng,
            lat,
            radiusKm,
            "km",
            "ASC",
            "COUNT",
            10,
        );
        return results as string[];
    }

    async removeFromGeo(driverId: string) {
        await this.redis.zrem(REDIS_GEO_KEY, driverId);
    }

    getRedis() {
        return this.redis;
    }
}

import { registerAs } from "@nestjs/config";

export default registerAs("app", () => ({
    port: parseInt(process.env.DRIVERS_PORT ?? "3003", 10),
    nodeEnv: process.env.NODE_ENV ?? "development",
    kafka: {
        brokers: (process.env.KAFKA_BROKERS ?? "localhost:9094").split(","),
        clientId: "drivers-service",
    },
    redis: {
        url: process.env.REDIS_URL ?? "redis://localhost:6379",
    },
    geo: {
        searchRadiusKm: parseFloat(process.env.DRIVER_SEARCH_RADIUS_KM ?? "5"),
    },
}));

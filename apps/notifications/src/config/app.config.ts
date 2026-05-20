import { registerAs } from "@nestjs/config";

export default registerAs("app", () => ({
    port: parseInt(process.env.NOTIFICATIONS_PORT ?? "3004", 10),
    nodeEnv: process.env.NODE_ENV ?? "development",
    kafka: {
        brokers: (process.env.KAFKA_BROKERS ?? "localhost:9094").split(","),
        clientId: "notifications-service",
        groupId: "notifications",
    },
    redis: {
        url: process.env.REDIS_URL ?? "redis://localhost:6379",
    },
    cors: {
        origins: [
            process.env.WEB_URL ?? "http://localhost:3000",
            process.env.DRIVER_APP_URL ?? "http://localhost:3006",
        ],
    },
}));

import { registerAs } from "@nestjs/config";

export default registerAs("app", () => ({
    port: parseInt(process.env.RESTAURANTS_PORT ?? "3007", 10),
    nodeEnv: process.env.NODE_ENV ?? "development",

    database: {
        url: process.env.DATABASE_URL!,
    },

    redis: {
        url: process.env.REDIS_URL ?? "redis://localhost:6379",
    },

    kafka: {
        brokers: (process.env.KAFKA_BROKERS ?? "localhost:9094").split(","),
        clientId: process.env.KAFKA_CLIENT_ID ?? "orderhub-restaurants",
        groupId: "restaurants-service",
    },
}));

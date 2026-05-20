import { registerAs } from "@nestjs/config";

export default registerAs("app", () => ({
    port: parseInt(process.env.ORDERS_PORT ?? "3002", 10),
    nodeEnv: process.env.NODE_ENV ?? "development",
    kafka: {
        brokers: (process.env.KAFKA_BROKERS ?? "localhost:9094").split(","),
        clientId: "orders-service",
        groupId: "orders-group",
    },
    redis: {
        url: process.env.REDIS_URL ?? "redis://localhost:6379",
    },
    services: {
        pricingUrl: process.env.PRICING_SERVICE_URL ?? "http://localhost:3005",
        restaurantsUrl: process.env.RESTAURANTS_SERVICE_URL ?? "http://localhost:3007",
    },
    razorpay: {
        keyId: process.env.RAZORPAY_KEY_ID ?? "",
        keySecret: process.env.RAZORPAY_KEY_SECRET ?? "",
        webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? "",
    },
}));

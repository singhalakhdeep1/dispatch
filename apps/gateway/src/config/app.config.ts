import { registerAs } from "@nestjs/config";

export default registerAs("app", () => ({
    port: parseInt(process.env.GATEWAY_PORT ?? "3001", 10),
    nodeEnv: process.env.NODE_ENV ?? "development",
    jwt: {
        secret: process.env.JWT_SECRET ?? "change-me",
        expiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
    },
    services: {
        ordersUrl: process.env.ORDERS_SERVICE_URL ?? "http://localhost:3002",
        driversUrl: process.env.DRIVERS_SERVICE_URL ?? "http://localhost:3003",
        notificationsUrl: process.env.NOTIFICATIONS_SERVICE_URL ?? "http://localhost:3004",
        pricingUrl: process.env.PRICING_SERVICE_URL ?? "http://localhost:3005",
        restaurantsUrl: process.env.RESTAURANTS_SERVICE_URL ?? "http://localhost:3007",
    },
    grpc: {
        ordersUrl: process.env.ORDERS_GRPC_URL ?? "localhost:5002",
    },
    web: {
        url: process.env.WEB_URL ?? "http://localhost:3000",
        driverAppUrl: process.env.DRIVER_APP_URL ?? "http://localhost:3006",
    },
}));

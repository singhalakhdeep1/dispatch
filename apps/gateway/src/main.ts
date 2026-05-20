import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { VersioningType } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import * as compression from "compression";
import * as cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger:
            process.env.NODE_ENV === "production"
                ? ["error", "warn", "log"]
                : ["error", "warn", "log", "debug"],
    });

    app.use(helmet({ contentSecurityPolicy: process.env.NODE_ENV === "production" }));
    app.use(compression());
    app.use(cookieParser());

    app.enableCors({
        origin: [
            process.env.WEB_URL ?? "http://localhost:3000",
            process.env.DRIVER_APP_URL ?? "http://localhost:3006",
        ],
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    });

    app.enableVersioning({ type: VersioningType.URI });
    app.setGlobalPrefix("api");

    if (process.env.NODE_ENV !== "production") {
        const config = new DocumentBuilder()
            .setTitle("OrderHub Gateway API")
            .setDescription("Polyglot food-delivery platform — API Gateway")
            .setVersion("1.0")
            .addBearerAuth()
            .build();

        const doc = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup("api/docs", app, doc);
    }

    const port = parseInt(process.env.GATEWAY_PORT ?? "3001", 10);
    await app.listen(port);
    console.log(`OrderHub Gateway running on http://localhost:${port}`);
}

bootstrap();

import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { VersioningType } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.enableVersioning({ type: VersioningType.URI });

    if (process.env.NODE_ENV !== "production") {
        const config = new DocumentBuilder()
            .setTitle("OrderHub — Drivers Service")
            .setVersion("1.0")
            .build();
        SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, config));
    }

    const port = parseInt(process.env.DRIVERS_PORT ?? "3003", 10);
    await app.listen(port, "0.0.0.0");
    console.log(`Drivers service running on http://localhost:${port}`);
}

bootstrap();

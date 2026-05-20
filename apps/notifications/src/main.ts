import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { VersioningType } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.enableCors({ origin: "*", credentials: false });
    app.enableVersioning({ type: VersioningType.URI });

    const port = parseInt(process.env.NOTIFICATIONS_PORT ?? "3004", 10);
    await app.listen(port, "0.0.0.0");
    console.log(`Notifications service running on http://localhost:${port} (WS included)`);
}

bootstrap();

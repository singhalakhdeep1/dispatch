import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config";
import helmet from "helmet";
import compression from "compression";
import { Logger } from "@nestjs/common";

async function bootstrap() {
    const app = await NestFactory.create(AppModule, { bufferLogs: true });
    const config = app.get(ConfigService);
    const port = config.get<number>("app.port") ?? 3007;

    app.use(helmet());
    app.use(compression());
    app.enableCors({ origin: "*", methods: "GET,POST,PATCH,DELETE,OPTIONS" });

    await app.listen(port);
    Logger.log(`Restaurants service running on port ${port}`, "Bootstrap");
}

bootstrap();

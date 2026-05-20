import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { VersioningType } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { ORDERS_PROTO_PATH } from "@orderhub/grpc";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // ── gRPC microservice transport (runs alongside the HTTP server) ──────────
    const grpcPort = parseInt(process.env.ORDERS_GRPC_PORT ?? "5002", 10);
    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.GRPC,
        options: {
            package: "orders",
            protoPath: ORDERS_PROTO_PATH,
            url: `0.0.0.0:${grpcPort}`,
        },
    });

    app.enableVersioning({ type: VersioningType.URI });

    if (process.env.NODE_ENV !== "production") {
        const config = new DocumentBuilder()
            .setTitle("OrderHub — Orders Service")
            .setVersion("1.0")
            .build();
        SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, config));
    }

    await app.startAllMicroservices();

    const port = parseInt(process.env.ORDERS_PORT ?? "3002", 10);
    await app.listen(port, "0.0.0.0");
    console.log(`Orders service running — HTTP: ${port}, gRPC: ${grpcPort}`);
}

bootstrap();

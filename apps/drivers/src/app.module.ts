import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./database/database.module";
import { KafkaModule } from "./kafka/kafka.module";
import { DriversModule } from "./drivers/drivers.module";
import appConfig from "./config/app.config";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig],
            envFilePath: ["../../.env.local", "../../.env"],
        }),
        DatabaseModule,
        KafkaModule,
        DriversModule,
    ],
})
export class AppModule {}

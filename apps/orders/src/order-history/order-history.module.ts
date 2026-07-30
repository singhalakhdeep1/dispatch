import { Module } from "@nestjs/common";
import { OrderHistoryController } from "./order-history.controller";
import { OrderHistoryService } from "./order-history.service";
import { DatabaseModule } from "../database/database.module";

@Module({
    imports: [DatabaseModule],
    controllers: [OrderHistoryController],
    providers: [OrderHistoryService],
    exports: [OrderHistoryService],
})
export class OrderHistoryModule {}
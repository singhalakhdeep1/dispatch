import { Module } from "@nestjs/common";
import { ScheduledOrdersController } from "./scheduled-orders.controller";
import { ScheduledOrdersService } from "./scheduled-orders.service";
import { DatabaseModule } from "../database/database.module";

@Module({
    imports: [DatabaseModule],
    controllers: [ScheduledOrdersController],
    providers: [ScheduledOrdersService],
    exports: [ScheduledOrdersService],
})
export class ScheduledOrdersModule {}
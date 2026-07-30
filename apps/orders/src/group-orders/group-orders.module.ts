import { Module } from "@nestjs/common";
import { GroupOrdersController } from "./group-orders.controller";
import { GroupOrdersService } from "./group-orders.service";
import { DatabaseModule } from "../database/database.module";

@Module({
    imports: [DatabaseModule],
    controllers: [GroupOrdersController],
    providers: [GroupOrdersService],
    exports: [GroupOrdersService],
})
export class GroupOrdersModule {}
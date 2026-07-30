import { Module } from "@nestjs/common";
import { LoyaltyController } from "./loyalty.controller";
import { LoyaltyService } from "./loyalty.service";
import { DatabaseModule } from "../database/database.module";

@Module({
    imports: [DatabaseModule],
    controllers: [LoyaltyController],
    providers: [LoyaltyService],
    exports: [LoyaltyService],
})
export class LoyaltyModule {}
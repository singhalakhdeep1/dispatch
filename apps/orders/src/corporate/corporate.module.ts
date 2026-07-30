import { Module } from "@nestjs/common";
import { CorporateController } from "./corporate.controller";
import { CorporateService } from "./corporate.service";
import { DatabaseModule } from "../database/database.module";

@Module({
    imports: [DatabaseModule],
    controllers: [CorporateController],
    providers: [CorporateService],
    exports: [CorporateService],
})
export class CorporateModule {}
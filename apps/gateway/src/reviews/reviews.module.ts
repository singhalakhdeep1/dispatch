import { Module } from "@nestjs/common";
import { ReviewsController } from "./reviews.controller";
import { ProxyModule } from "../proxy/proxy.module";

@Module({
    imports: [ProxyModule],
    controllers: [ReviewsController],
})
export class ReviewsModule { }

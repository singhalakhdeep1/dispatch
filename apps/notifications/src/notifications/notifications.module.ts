import { Module } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { NotificationsController } from "./notifications.controller";
import { TrackingGateway } from "../gateways/tracking.gateway";
import { KafkaConsumer } from "../kafka/kafka.consumer";

@Module({
    controllers: [NotificationsController],
    providers: [NotificationsService, TrackingGateway, KafkaConsumer],
    exports: [NotificationsService, TrackingGateway],
})
export class NotificationsModule { }

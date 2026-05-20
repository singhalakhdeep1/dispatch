import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { KafkaService } from "./kafka.service";
import { NotificationsService } from "../notifications/notifications.service";
import { TrackingGateway } from "../gateways/tracking.gateway";
import {
    KAFKA_TOPICS,
    KafkaEvent,
    OrderPlacedPayload,
    DriverAssignedPayload,
    OrderPickedUpPayload,
    OrderDeliveredPayload,
    OrderCancelledPayload,
    DriverLocationUpdatedPayload,
    DriverStatusChangedPayload,
} from "@orderhub/shared";
import { NotificationType } from "@orderhub/database";

@Injectable()
export class KafkaConsumer implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(KafkaConsumer.name);
    private consumer = this.kafka.createConsumer("notifications");

    constructor(
        private readonly kafka: KafkaService,
        private readonly notifications: NotificationsService,
        private readonly gateway: TrackingGateway,
    ) {}

    async onModuleInit() {
        await this.consumer.connect();

        await this.consumer.subscribe({
            topics: Object.values(KAFKA_TOPICS),
            fromBeginning: false,
        });

        await this.consumer.run({
            eachMessage: async ({ topic, message }) => {
                try {
                    const event: KafkaEvent<any> = JSON.parse(message.value!.toString());
                    await this.dispatch(topic, event);
                } catch (err) {
                    this.logger.error(`Error processing ${topic}: ${err}`);
                }
            },
        });

        this.logger.log("Notifications Kafka consumer started");
    }

    async onModuleDestroy() {
        await this.consumer.disconnect();
    }

    private async dispatch(topic: string, event: KafkaEvent<any>) {
        switch (topic) {
            case KAFKA_TOPICS.ORDER_PLACED: {
                const d = event.data as OrderPlacedPayload;
                await this.notifications.create({
                    userId: d.userId,
                    type: NotificationType.ORDER_PLACED,
                    title: "Order Placed! 🎉",
                    body: "Your order has been placed. Looking for a nearby driver...",
                    data: { orderId: d.orderId },
                    orderId: d.orderId,
                });
                this.gateway.emitToOrder(d.orderId, "order:update", {
                    orderId: d.orderId,
                    status: "PLACED",
                });
                break;
            }

            case KAFKA_TOPICS.DRIVER_ASSIGNED: {
                const d = event.data as DriverAssignedPayload;
                await this.notifications.create({
                    userId: d.userId,
                    type: NotificationType.DRIVER_ASSIGNED,
                    title: "Driver Assigned! 🛵",
                    body: "A driver is on their way to pick up your order.",
                    data: { orderId: d.orderId, driverId: d.driverId },
                    orderId: d.orderId,
                });
                this.gateway.emitToOrder(d.orderId, "order:update", {
                    orderId: d.orderId,
                    status: "DRIVER_ASSIGNED",
                    driverId: d.driverId,
                });
                break;
            }

            case KAFKA_TOPICS.ORDER_PICKED_UP: {
                const d = event.data as OrderPickedUpPayload;
                await this.notifications.create({
                    userId: d.userId,
                    type: NotificationType.ORDER_PICKED_UP,
                    title: "Order Picked Up! 📦",
                    body: "Your food has been picked up and is on the way!",
                    data: { orderId: d.orderId },
                    orderId: d.orderId,
                });
                this.gateway.emitToOrder(d.orderId, "order:update", {
                    orderId: d.orderId,
                    status: "PICKED_UP",
                });
                break;
            }

            case KAFKA_TOPICS.ORDER_DELIVERED: {
                const d = event.data as OrderDeliveredPayload;
                await this.notifications.create({
                    userId: d.userId,
                    type: NotificationType.ORDER_DELIVERED,
                    title: "Order Delivered! ✅",
                    body: "Enjoy your meal! Please rate your experience.",
                    data: { orderId: d.orderId },
                    orderId: d.orderId,
                });
                this.gateway.emitToOrder(d.orderId, "order:update", {
                    orderId: d.orderId,
                    status: "DELIVERED",
                });
                break;
            }

            case KAFKA_TOPICS.ORDER_CANCELLED: {
                const d = event.data as OrderCancelledPayload;
                await this.notifications.create({
                    userId: d.userId,
                    type: NotificationType.ORDER_CANCELLED,
                    title: "Order Cancelled",
                    body: d.cancelReason ?? "Your order has been cancelled.",
                    data: { orderId: d.orderId },
                    orderId: d.orderId,
                });
                this.gateway.emitToOrder(d.orderId, "order:update", {
                    orderId: d.orderId,
                    status: "CANCELLED",
                });
                break;
            }

            case KAFKA_TOPICS.DRIVER_LOCATION_UPDATED: {
                const d = event.data as DriverLocationUpdatedPayload;
                // Broadcast driver position to all tracking that order
                this.gateway.emitToOrder(d.orderId ?? "", "driver:location", {
                    driverId: d.driverId,
                    lat: d.lat,
                    lng: d.lng,
                    heading: d.heading,
                    timestamp: event.timestamp,
                });
                break;
            }
        }
    }
}

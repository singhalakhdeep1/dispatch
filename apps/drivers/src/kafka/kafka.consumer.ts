import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaClient } from "@orderhub/database";
import { PRISMA_TOKEN } from "../database/database.module";
import { KafkaService } from "../kafka/kafka.service";
import { DriversService } from "../drivers/drivers.service";
import {
    KAFKA_TOPICS,
    KafkaEvent,
    OrderPlacedPayload,
} from "@orderhub/shared";

@Injectable()
export class OrderConsumer implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(OrderConsumer.name);
    private consumer = this.kafka.createConsumer("drivers-order-listener");

    constructor(
        @Inject(PRISMA_TOKEN) private readonly prisma: PrismaClient,
        private readonly kafka: KafkaService,
        private readonly drivers: DriversService,
        private readonly config: ConfigService,
    ) {}

    async onModuleInit() {
        await this.consumer.connect();
        await this.consumer.subscribe({
            topics: [KAFKA_TOPICS.ORDER_PLACED, KAFKA_TOPICS.ORDER_FINDING_DRIVER],
            fromBeginning: false,
        });

        await this.consumer.run({
            eachMessage: async ({ topic, message }) => {
                try {
                    const event: KafkaEvent<any> = JSON.parse(message.value!.toString());
                    if (topic === KAFKA_TOPICS.ORDER_PLACED || topic === KAFKA_TOPICS.ORDER_FINDING_DRIVER) {
                        await this.handleOrderPlaced(event.data);
                    }
                } catch (err) {
                    this.logger.error(`Error processing ${topic}: ${err}`);
                }
            },
        });

        this.logger.log("Drivers order consumer started");
    }

    async onModuleDestroy() {
        await this.consumer.disconnect();
    }

    private async handleOrderPlaced(payload: OrderPlacedPayload & { retryCount?: number; rejectedDriverId?: string }) {
        const radiusKm = this.config.get<number>("app.geo.searchRadiusKm") ?? 5;

        this.logger.log(`Looking for driver for order ${payload.orderId} near ${payload.restaurantLat},${payload.restaurantLng}`);

        const driverId = await this.drivers.findNearestOnlineDriver(
            payload.restaurantLat,
            payload.restaurantLng,
            radiusKm,
        );

        if (!driverId) {
            this.logger.warn(`No driver found for order ${payload.orderId} within ${radiusKm}km`);

            // Update order to cancelled if we've retried too many times
            if ((payload.retryCount ?? 0) >= 3) {
                await this.prisma.order.update({
                    where: { id: payload.orderId },
                    data: { status: "CANCELLED", cancelReason: "No drivers available" } as any,
                });
                await this.kafka.emit(KAFKA_TOPICS.ORDER_CANCELLED, {
                    orderId: payload.orderId,
                    userId: payload.userId,
                    cancelReason: "No drivers available",
                    cancelledAt: new Date().toISOString(),
                });
            }
            return;
        }

        await this.drivers.assignDriver(payload.orderId, driverId, payload.userId);
    }
}

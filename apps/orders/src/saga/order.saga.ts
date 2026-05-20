import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject } from "@nestjs/common";
import { PrismaClient, OrderStatus } from "@orderhub/database";
import { PRISMA_TOKEN } from "../database/database.module";
import { KafkaService } from "../kafka/kafka.service";
import {
    KAFKA_TOPICS,
    KafkaEvent,
    DriverAssignedPayload,
    OrderPickedUpPayload,
    OrderDeliveredPayload,
    OrderCancelledPayload,
} from "@orderhub/shared";

@Injectable()
export class OrderSaga implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(OrderSaga.name);
    private consumer = this.kafka.createConsumer("orders-saga");

    constructor(
        @Inject(PRISMA_TOKEN) private readonly prisma: PrismaClient,
        private readonly kafka: KafkaService,
    ) {}

    async onModuleInit() {
        await this.consumer.connect();

        await this.consumer.subscribe({
            topics: [
                KAFKA_TOPICS.DRIVER_ASSIGNED,
                KAFKA_TOPICS.ORDER_PICKED_UP,
                KAFKA_TOPICS.ORDER_DELIVERED,
            ],
            fromBeginning: false,
        });

        await this.consumer.run({
            eachMessage: async ({ topic, message }) => {
                try {
                    const event: KafkaEvent<any> = JSON.parse(message.value!.toString());
                    await this.handleEvent(topic as any, event);
                } catch (err) {
                    this.logger.error(`Error processing ${topic}: ${err}`);
                }
            },
        });

        this.logger.log("OrderSaga consumer started");
    }

    async onModuleDestroy() {
        await this.consumer.disconnect();
    }

    private async handleEvent(topic: string, event: KafkaEvent<any>) {
        switch (topic) {
            case KAFKA_TOPICS.DRIVER_ASSIGNED: {
                const payload = event.data as DriverAssignedPayload;
                await this.prisma.order.update({
                    where: { id: payload.orderId },
                    data: {
                        status: OrderStatus.DRIVER_ASSIGNED,
                        driverId: payload.driverId,
                        driverAssignedAt: new Date(payload.assignedAt),
                    },
                });
                this.logger.log(`Order ${payload.orderId} → DRIVER_ASSIGNED (${payload.driverId})`);
                break;
            }

            case KAFKA_TOPICS.ORDER_PICKED_UP: {
                const payload = event.data as OrderPickedUpPayload;
                await this.prisma.order.update({
                    where: { id: payload.orderId },
                    data: {
                        status: OrderStatus.PICKED_UP,
                        pickedUpAt: new Date(payload.pickedUpAt),
                    },
                });
                this.logger.log(`Order ${payload.orderId} → PICKED_UP`);
                break;
            }

            case KAFKA_TOPICS.ORDER_DELIVERED: {
                const payload = event.data as OrderDeliveredPayload;
                await this.prisma.order.update({
                    where: { id: payload.orderId },
                    data: {
                        status: OrderStatus.DELIVERED,
                        deliveredAt: new Date(payload.deliveredAt),
                    },
                });
                this.logger.log(`Order ${payload.orderId} → DELIVERED`);
                break;
            }
        }
    }
}

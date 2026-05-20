import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Kafka, Producer, Consumer, CompressionTypes, logLevel } from "kafkajs";
import { KafkaEvent, KafkaTopic } from "@orderhub/shared";
import { randomUUID } from "crypto";

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(KafkaService.name);
    private kafka: Kafka;
    private producer: Producer;

    constructor(private readonly config: ConfigService) {
        this.kafka = new Kafka({
            clientId: config.get<string>("app.kafka.clientId")!,
            brokers: config.get<string[]>("app.kafka.brokers")!,
            logLevel: logLevel.WARN,
        });

        this.producer = this.kafka.producer({ allowAutoTopicCreation: true, idempotent: true, maxInFlightRequests: 1 });
    }

    async onModuleInit() {
        await this.producer.connect();
        this.logger.log("Kafka producer connected");
    }

    async onModuleDestroy() {
        await this.producer.disconnect();
    }

    async emit<T>(topic: KafkaTopic, data: T): Promise<void> {
        const event: KafkaEvent<T> = {
            eventId: randomUUID(),
            eventType: topic,
            timestamp: new Date().toISOString(),
            data,
        };
        await this.producer.send({
            topic,
            compression: CompressionTypes.GZIP,
            messages: [{ key: event.eventId, value: JSON.stringify(event) }],
        });
    }

    createConsumer(groupId: string): Consumer {
        return this.kafka.consumer({ groupId, allowAutoTopicCreation: true });
    }
}

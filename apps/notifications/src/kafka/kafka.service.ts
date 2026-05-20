import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Kafka, Consumer, logLevel } from "kafkajs";
import { KafkaEvent, KafkaTopic } from "@orderhub/shared";

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(KafkaService.name);
    private kafka: Kafka;

    constructor(private readonly config: ConfigService) {
        this.kafka = new Kafka({
            clientId: config.get<string>("app.kafka.clientId")!,
            brokers: config.get<string[]>("app.kafka.brokers")!,
            logLevel: logLevel.WARN,
        });
    }

    async onModuleInit() {
        this.logger.log("Kafka service initialized");
    }

    async onModuleDestroy() {}

    createConsumer(groupId: string): Consumer {
        return this.kafka.consumer({ groupId, allowAutoTopicCreation: true });
    }
}

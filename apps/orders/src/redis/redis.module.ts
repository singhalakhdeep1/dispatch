import { Module, Global } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

export const REDIS_TOKEN = "REDIS";

@Global()
@Module({
    providers: [
        {
            provide: REDIS_TOKEN,
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const url = config.get<string>("app.redis.url") ?? "redis://localhost:6379";
                return new Redis(url, { maxRetriesPerRequest: 3, lazyConnect: false });
            },
        },
    ],
    exports: [REDIS_TOKEN],
})
export class RedisModule { }

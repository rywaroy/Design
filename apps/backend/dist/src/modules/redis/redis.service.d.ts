import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
export declare class RedisService implements OnModuleDestroy {
    private configService;
    private readonly redis;
    constructor(configService: ConfigService);
    getClient(): Redis;
    onModuleDestroy(): Promise<void>;
    set(key: string, value: string, ttl?: number): Promise<'OK'>;
    get(key: string): Promise<string | null>;
    del(key: string): Promise<number>;
}

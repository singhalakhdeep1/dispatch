// Redis TimeSeries service for dispatch

import { createClient } from 'redis';

class RedisTimeSeriesService {
  private client: ReturnType<typeof createClient>;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });
  }

  async connect() {
    await this.client.connect();
  }

  async disconnect() {
    await this.client.disconnect();
  }

  async add(key: string, timestamp: number, value: number, labels?: Record<string, string>) {
    try {
      const args = ['TS.ADD', key, timestamp.toString(), value.toString()];
      if (labels) {
        Object.entries(labels).forEach(([label, value]) => {
          args.push('LABELS', label, value);
        });
      }
      await this.client.sendCommand(args);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async get(key: string, from: number, to: number) {
    try {
      const result = await this.client.sendCommand(['TS.RANGE', key, from.toString(), to.toString()]);
      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async createRule(sourceKey: string, destKey: string, aggregationType: string, bucketSize: number) {
    try {
      await this.client.sendCommand([
        'TS.CREATERULE',
        sourceKey,
        destKey,
        aggregationType,
        bucketSize.toString(),
      ]);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getInfo(key: string) {
    try {
      const result = await this.client.sendCommand(['TS.INFO', key]);
      return { success: true, info: result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async delete(key: string) {
    try {
      await this.client.del(key);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const redisTimeSeriesService = new RedisTimeSeriesService();

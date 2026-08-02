// Apache Pulsar producer for dispatch

import { Pulsar } from 'pulsar-client';

class PulsarProducer {
  private client: Pulsar;
  private producer: any;

  constructor() {
    this.client = new Pulsar({
      serviceUrl: process.env.PULSAR_URL || 'pulsar://localhost:6650',
    });
  }

  async connect(topic: string) {
    this.producer = await this.client.createProducer({
      topic,
      sendTimeoutMs: 30000,
    });
  }

  async disconnect() {
    if (this.producer) {
      await this.producer.close();
    }
    await this.client.close();
  }

  async sendMessage(message: any) {
    try {
      await this.producer.send({
        data: Buffer.from(JSON.stringify(message)),
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async sendBatch(messages: any[]) {
    try {
      for (const msg of messages) {
        await this.producer.send({
          data: Buffer.from(JSON.stringify(msg)),
        });
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const pulsarProducer = new PulsarProducer();

// Apache Pulsar consumer for dispatch

import { Pulsar } from 'pulsar-client';

class PulsarConsumer {
  private client: Pulsar;
  private consumer: any;

  constructor() {
    this.client = new Pulsar({
      serviceUrl: process.env.PULSAR_URL || 'pulsar://localhost:6650',
    });
  }

  async connect(topic: string, subscription: string) {
    this.consumer = await this.client.subscribe({
      topic,
      subscription,
      subscriptionType: 'Shared',
    });
  }

  async disconnect() {
    if (this.consumer) {
      await this.consumer.close();
    }
    await this.client.close();
  }

  async consume(callback: (message: any) => Promise<void>) {
    while (true) {
      try {
        const msg = await this.consumer.receive();
        const data = JSON.parse(msg.getData().toString());
        await callback(data);
        this.consumer.acknowledge(msg);
      } catch (error) {
        console.error('Error consuming message:', error);
      }
    }
  }
}

export const pulsarConsumer = new PulsarConsumer();

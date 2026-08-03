/**
 * Event Bus Service for Dispatch Platform
 * Implements publish-subscribe pattern for event-driven dispatch operations
 */
import { EventEmitter } from 'events';

export interface EventPayload {
  eventType: string;
  data: any;
  timestamp: Date;
  correlationId?: string;
}

export interface EventHandler {
  eventType: string;
  handler: (payload: EventPayload) => Promise<void>;
}

export class EventBusService extends EventEmitter {
  private subscribers: Map<string, EventHandler[]> = new Map();

  publish(eventType: string, data: any, correlationId?: string): void {
    const payload: EventPayload = {
      eventType,
      data,
      timestamp: new Date(),
      correlationId,
    };

    this.emit(eventType, payload);
    console.log(`Published event: ${eventType}`);
  }

  subscribe(eventType: string, handler: (payload: EventPayload) => Promise<void>): void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    this.subscribers.get(eventType)!.push({ eventType, handler });
    this.on(eventType, handler);
    console.log(`Subscribed to event: ${eventType}`);
  }

  unsubscribe(eventType: string, handler: (payload: EventPayload) => Promise<void>): void {
    const handlers = this.subscribers.get(eventType);
    if (handlers) {
      const index = handlers.findIndex((h) => h.handler === handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
    this.off(eventType, handler);
  }

  getSubscribers(): Map<string, EventHandler[]> {
    return new Map(this.subscribers);
  }
}

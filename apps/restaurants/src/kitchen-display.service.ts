/**
 * Kitchen Display System Service
 * Real-time kitchen order management and display
 */

import { Injectable } from '@nestjs/common';

interface KitchenOrder {
  id: string;
  orderId: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    specialInstructions?: string;
    status: 'pending' | 'preparing' | 'ready' | 'served';
    prepTime: number;
    startedAt?: Date;
    completedAt?: Date;
  }>;
  priority: 'normal' | 'high' | 'urgent';
  estimatedTime: number;
  createdAt: Date;
  tableNumber?: string;
  deliveryAddress?: string;
}

interface KitchenStation {
  id: string;
  name: string;
  type: 'hot' | 'cold' | 'bar' | 'dessert';
  orders: string[];
  capacity: number;
}

@Injectable()
export class KitchenDisplayService {
  private orders: Map<string, KitchenOrder> = new Map();
  private stations: Map<string, KitchenStation> = new Map();
  private orderHistory: Map<string, any[]> = new Map();

  constructor() {
    this.initializeStations();
  }

  /**
   * Initialize kitchen stations
   */
  private initializeStations(): void {
    this.stations.set('hot', {
      id: 'hot',
      name: 'Hot Station',
      type: 'hot',
      orders: [],
      capacity: 5,
    });

    this.stations.set('cold', {
      id: 'cold',
      name: 'Cold Station',
      type: 'cold',
      orders: [],
      capacity: 3,
    });

    this.stations.set('bar', {
      id: 'bar',
      name: 'Bar Station',
      type: 'bar',
      orders: [],
      capacity: 4,
    });

    this.stations.set('dessert', {
      id: 'dessert',
      name: 'Dessert Station',
      type: 'dessert',
      orders: [],
      capacity: 2,
    });
  }

  /**
   * Add order to kitchen display
   */
  addOrder(order: Omit<KitchenOrder, 'id' | 'createdAt'>): KitchenOrder {
    const kitchenOrder: KitchenOrder = {
      ...order,
      id: `kitchen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };

    this.orders.set(kitchenOrder.id, kitchenOrder);

    // Assign to appropriate stations based on items
    this.assignOrderToStations(kitchenOrder);

    return kitchenOrder;
  }

  /**
   * Assign order to kitchen stations
   */
  private assignOrderToStations(order: KitchenOrder): void {
    const stationTypes = this.determineStationTypes(order.items);
    
    stationTypes.forEach(stationType => {
      const station = this.stations.get(stationType);
      if (station && station.orders.length < station.capacity) {
        station.orders.push(order.id);
      }
    });
  }

  /**
   * Determine which stations are needed for items
   */
  private determineStationTypes(items: KitchenOrder['items']): string[] {
    const types = new Set<string>();

    items.forEach(item => {
      // Simple categorization - in production would use menu metadata
      const name = item.name.toLowerCase();
      if (name.includes('drink') || name.includes('cocktail') || name.includes('beer') || name.includes('wine')) {
        types.add('bar');
      } else if (name.includes('ice cream') || name.includes('cake') || name.includes('dessert')) {
        types.add('dessert');
      } else if (name.includes('salad') || name.includes('cold') || name.includes('sandwich')) {
        types.add('cold');
      } else {
        types.add('hot');
      }
    });

    return Array.from(types);
  }

  /**
   * Update item status
   */
  updateItemStatus(
    orderId: string,
    itemId: string,
    status: KitchenOrder['items'][0]['status']
  ): void {
    const order = this.orders.get(orderId);
    if (!order) return;

    const item = order.items.find(i => i.id === itemId);
    if (!item) return;

    item.status = status;

    if (status === 'preparing' && !item.startedAt) {
      item.startedAt = new Date();
    }

    if (status === 'ready' && !item.completedAt) {
      item.completedAt = new Date();
    }

    // Check if all items are ready
    if (order.items.every(i => i.status === 'ready')) {
      this.markOrderReady(orderId);
    }

    // Log to history
    this.logOrderEvent(orderId, {
      itemId,
      status,
      timestamp: new Date(),
    });
  }

  /**
   * Mark order as ready
   */
  private markOrderReady(orderId: string): void {
    const order = this.orders.get(orderId);
    if (!order) return;

    // Remove from stations
    this.stations.forEach(station => {
      station.orders = station.orders.filter(id => id !== orderId);
    });
  }

  /**
   * Get orders for a station
   */
  getStationOrders(stationId: string): KitchenOrder[] {
    const station = this.stations.get(stationId);
    if (!station) return [];

    return station.orders
      .map(orderId => this.orders.get(orderId))
      .filter(order => order !== undefined) as KitchenOrder[];
  }

  /**
   * Get all active orders
   */
  getActiveOrders(): KitchenOrder[] {
    return Array.from(this.orders.values()).filter(
      order => order.items.some(item => item.status !== 'served')
    );
  }

  /**
   * Get order by ID
   */
  getOrder(orderId: string): KitchenOrder | undefined {
    return this.orders.get(orderId);
  }

  /**
   * Get kitchen status
   */
  getKitchenStatus(): {
    totalOrders: number;
    ordersByStatus: Record<string, number>;
    stationStatus: Array<{
      stationId: string;
      stationName: string;
      currentOrders: number;
      capacity: number;
      utilization: number;
    }>;
    averagePrepTime: number;
  } {
    const activeOrders = this.getActiveOrders();
    const totalOrders = activeOrders.length;

    const ordersByStatus: Record<string, number> = {
      pending: 0,
      preparing: 0,
      ready: 0,
      served: 0,
    };

    activeOrders.forEach(order => {
      order.items.forEach(item => {
        ordersByStatus[item.status]++;
      });
    });

    const stationStatus = Array.from(this.stations.values()).map(station => ({
      stationId: station.id,
      stationName: station.name,
      currentOrders: station.orders.length,
      capacity: station.capacity,
      utilization: (station.orders.length / station.capacity) * 100,
    }));

    // Calculate average prep time
    const completedItems: number[] = [];
    this.orders.forEach(order => {
      order.items.forEach(item => {
        if (item.startedAt && item.completedAt) {
          const prepTime = item.completedAt.getTime() - item.startedAt.getTime();
          completedItems.push(prepTime / 1000 / 60); // minutes
        }
      });
    });

    const averagePrepTime = completedItems.length > 0
      ? completedItems.reduce((sum, time) => sum + time, 0) / completedItems.length
      : 0;

    return {
      totalOrders,
      ordersByStatus,
      stationStatus,
      averagePrepTime,
    };
  }

  /**
   * Get rush prediction
   */
  getRushPrediction(): {
    currentRush: 'low' | 'medium' | 'high';
    predictedRush: 'low' | 'medium' | 'high';
    recommendedStaffing: number;
  } {
    const activeOrders = this.getActiveOrders();
    const orderCount = activeOrders.length;

    // Current rush level
    let currentRush: 'low' | 'medium' | 'high' = 'low';
    if (orderCount > 10) currentRush = 'high';
    else if (orderCount > 5) currentRush = 'medium';

    // Predict rush based on time of day
    const hour = new Date().getHours();
    let predictedRush: 'low' | 'medium' | 'high' = 'low';

    if ((hour >= 11 && hour <= 14) || (hour >= 18 && hour <= 21)) {
      predictedRush = 'high';
    } else if ((hour >= 10 && hour <= 15) || (hour >= 17 && hour <= 22)) {
      predictedRush = 'medium';
    }

    // Recommended staffing
    const recommendedStaffing = Math.ceil(orderCount / 3) + (predictedRush === 'high' ? 2 : 0);

    return {
      currentRush,
      predictedRush,
      recommendedStaffing,
    };
  }

  /**
   * Log order event for analytics
   */
  private logOrderEvent(orderId: string, event: any): void {
    if (!this.orderHistory.has(orderId)) {
      this.orderHistory.set(orderId, []);
    }

    this.orderHistory.get(orderId)!.push(event);
  }

  /**
   * Get order history
   */
  getOrderHistory(orderId: string): any[] {
    return this.orderHistory.get(orderId) || [];
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    averageOrderTime: number;
    onTimeRate: number;
    itemsCompleted: number;
    stationsEfficiency: Record<string, number>;
  } {
    const completedOrders = Array.from(this.orders.values()).filter(
      order => order.items.every(item => item.status === 'ready' || item.status === 'served')
    );

    let totalOrderTime = 0;
    let onTimeCount = 0;
    let itemsCompleted = 0;

    const stationTimes: Record<string, number[]> = {
      hot: [],
      cold: [],
      bar: [],
      dessert: [],
    };

    completedOrders.forEach(order => {
      const orderStart = order.createdAt;
      const orderEnd = order.items.reduce((max, item) => {
        if (item.completedAt && item.completedAt > max) return item.completedAt;
        return max;
      }, order.createdAt);

      totalOrderTime += orderEnd.getTime() - orderStart.getTime();

      if (orderEnd.getTime() - orderStart.getTime() <= order.estimatedTime * 60 * 1000) {
        onTimeCount++;
      }

      order.items.forEach(item => {
        if (item.status === 'ready' || item.status === 'served') {
          itemsCompleted++;
          
          if (item.startedAt && item.completedAt) {
            const stationTypes = this.determineStationTypes([item]);
            const prepTime = item.completedAt.getTime() - item.startedAt.getTime();
            stationTypes.forEach(type => {
              stationTimes[type].push(prepTime);
            });
          }
        }
      });
    });

    const averageOrderTime = completedOrders.length > 0
      ? totalOrderTime / completedOrders.length / 1000 / 60
      : 0;

    const onTimeRate = completedOrders.length > 0
      ? (onTimeCount / completedOrders.length) * 100
      : 0;

    const stationsEfficiency: Record<string, number> = {};
    Object.keys(stationTimes).forEach(station => {
      const times = stationTimes[station];
      stationsEfficiency[station] = times.length > 0
        ? times.reduce((sum, t) => sum + t, 0) / times.length / 1000 / 60
        : 0;
    });

    return {
      averageOrderTime,
      onTimeRate,
      itemsCompleted,
      stationsEfficiency,
    };
  }

  /**
   * Clear completed orders
   */
  clearCompletedOrders(): number {
    let cleared = 0;

    this.orders.forEach((order, orderId) => {
      if (order.items.every(item => item.status === 'served')) {
        this.orders.delete(orderId);
        cleared++;
      }
    });

    return cleared;
  }
}

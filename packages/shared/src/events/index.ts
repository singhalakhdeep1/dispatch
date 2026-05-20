// ─── Kafka Topic Registry ─────────────────────────────────────────────────────

export const KAFKA_TOPICS = {
    // Order lifecycle
    ORDER_PLACED: "order.placed",
    ORDER_FINDING_DRIVER: "order.finding-driver",
    DRIVER_ASSIGNED: "driver.assigned",
    ORDER_ACCEPTED: "order.accepted",
    ORDER_PICKED_UP: "order.picked-up",
    ORDER_DELIVERED: "order.delivered",
    ORDER_CANCELLED: "order.cancelled",
    ORDER_REFUNDED: "order.refunded",
    // Driver
    DRIVER_LOCATION_UPDATED: "driver.location-updated",
    DRIVER_STATUS_CHANGED: "driver.status-changed",
    DRIVER_EARNING_CREATED: "driver.earning-created",
    // Restaurant
    RESTAURANT_APPROVED: "restaurant.approved",
    MENU_ITEM_UPDATED: "menu.item-updated",
    // Payment
    PAYMENT_INITIATED: "payment.initiated",
    PAYMENT_SUCCESS: "payment.success",
    PAYMENT_FAILED: "payment.failed",
    PAYMENT_REFUNDED: "payment.refunded",
} as const;

export type KafkaTopic = (typeof KAFKA_TOPICS)[keyof typeof KAFKA_TOPICS];

// ─── Base Event Envelope ──────────────────────────────────────────────────────

export interface KafkaEvent<T = unknown> {
    eventId: string;    // UUID — for idempotency / dedup
    eventType: KafkaTopic;
    timestamp: string;  // ISO 8601
    data: T;
}

// ─── Event Payloads ───────────────────────────────────────────────────────────

export interface OrderPlacedPayload {
    orderId: string;
    userId: string;
    restaurantId: string;
    restaurantLat: number;
    restaurantLng: number;
    deliveryLat: number;
    deliveryLng: number;
    totalAmount: number;    // paise
    itemCount: number;
    paymentMethod: string;
}

export interface DriverAssignedPayload {
    orderId: string;
    driverId: string;
    userId: string;
    restaurantOwnerId: string;
    driverName: string;
    vehicleType: string;
    vehicleNumber: string;
    estimatedPickupMins: number;
    estimatedDeliveryMins: number;
    driverLat: number;
    driverLng: number;
}

export interface OrderPickedUpPayload {
    orderId: string;
    driverId: string;
    userId: string;
    restaurantOwnerId: string;
    pickedUpAt: string;
}

export interface OrderDeliveredPayload {
    orderId: string;
    driverId: string;
    userId: string;
    deliveredAt: string;
    totalAmount: number;
}

export interface OrderCancelledPayload {
    orderId: string;
    userId: string;
    driverId?: string;
    cancelReason: string;
    cancelledAt: string;
    refundAmount?: number; // paise
}

export interface OrderRefundedPayload {
    orderId: string;
    userId: string;
    refundAmount: number;  // paise
    refundedAt: string;
}

export interface DriverLocationUpdatedPayload {
    driverId: string;
    orderId?: string;
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
}

export interface DriverStatusChangedPayload {
    driverId: string;
    userId: string;
    previousStatus: string;
    newStatus: string;
}

export interface DriverEarningCreatedPayload {
    driverId: string;
    orderId: string;
    baseAmount: number;
    tip: number;
    bonus: number;
    deductions: number;
    netAmount: number;
}

export interface RestaurantApprovedPayload {
    restaurantId: string;
    ownerId: string;
    name: string;
}

export interface PaymentSuccessPayload {
    orderId: string;
    userId: string;
    amount: number;       // paise
    method: string;
    razorpayPaymentId?: string;
}

export interface PaymentFailedPayload {
    orderId: string;
    userId: string;
    reason: string;
}


export type KafkaTopic = (typeof KAFKA_TOPICS)[keyof typeof KAFKA_TOPICS];

// ─── Base Event Envelope ──────────────────────────────────────────────────────

export interface KafkaEvent<T = unknown> {
    eventId: string;    // UUID — for idempotency / dedup
    eventType: KafkaTopic;
    timestamp: string;  // ISO 8601
    data: T;
}

// ─── Event Payloads ───────────────────────────────────────────────────────────

export interface OrderPlacedPayload {
    orderId: string;
    userId: string;
    restaurantId: string;
    restaurantLat: number;
    restaurantLng: number;
    deliveryLat: number;
    deliveryLng: number;
    totalAmount: number;    // paise
    itemCount: number;
}

export interface DriverAssignedPayload {
    orderId: string;
    driverId: string;
    userId: string;         // customer userId for notification
    driverName: string;
    vehicleType: string;
    vehicleNumber: string;
    estimatedPickupMins: number;
    estimatedDeliveryMins: number;
    driverLat: number;
    driverLng: number;
}

export interface OrderPickedUpPayload {
    orderId: string;
    driverId: string;
    userId: string;
    pickedUpAt: string;
}

export interface OrderDeliveredPayload {
    orderId: string;
    driverId: string;
    userId: string;
    deliveredAt: string;
    totalAmount: number;
}

export interface OrderCancelledPayload {
    orderId: string;
    userId: string;
    driverId?: string;
    cancelReason: string;
    cancelledAt: string;
}

export interface DriverLocationUpdatedPayload {
    driverId: string;
    orderId?: string;   // present if driver is on a trip
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    timestamp: string;
}

export interface DriverStatusChangedPayload {
    driverId: string;
    userId: string;
    previousStatus: string;
    newStatus: string;
    timestamp: string;
}

// ─── Order Status ─────────────────────────────────────────────────────────────

export enum OrderStatus {
    PLACED = "PLACED",
    FINDING_DRIVER = "FINDING_DRIVER",
    DRIVER_ASSIGNED = "DRIVER_ASSIGNED",
    PICKED_UP = "PICKED_UP",
    DELIVERED = "DELIVERED",
    CANCELLED = "CANCELLED",
    REFUNDED = "REFUNDED",
}

// ─── Driver Status ────────────────────────────────────────────────────────────

export enum DriverStatus {
    OFFLINE = "OFFLINE",
    ONLINE = "ONLINE",
    ON_TRIP = "ON_TRIP",
    SUSPENDED = "SUSPENDED",
}

export enum VehicleType {
    BIKE = "BIKE",
    SCOOTER = "SCOOTER",
    CAR = "CAR",
}

// ─── User Role ────────────────────────────────────────────────────────────────

export enum UserRole {
    CUSTOMER = "CUSTOMER",
    DRIVER = "DRIVER",
    RESTAURANT_OWNER = "RESTAURANT_OWNER",
    ADMIN = "ADMIN",
}

// ─── Restaurant ───────────────────────────────────────────────────────────────

export enum RestaurantStatus {
    PENDING_APPROVAL = "PENDING_APPROVAL",
    OPEN = "OPEN",
    CLOSED = "CLOSED",
    TEMPORARILY_CLOSED = "TEMPORARILY_CLOSED",
    SUSPENDED = "SUSPENDED",
}

// ─── Payment ──────────────────────────────────────────────────────────────────

export enum PaymentMethod {
    CASH_ON_DELIVERY = "CASH_ON_DELIVERY",
    UPI = "UPI",
    CARD = "CARD",
    WALLET = "WALLET",
    NETBANKING = "NETBANKING",
}

export enum PaymentStatus {
    PENDING = "PENDING",
    PAID = "PAID",
    FAILED = "FAILED",
    REFUNDED = "REFUNDED",
    PARTIALLY_REFUNDED = "PARTIALLY_REFUNDED",
}

// ─── JWT Payload ──────────────────────────────────────────────────────────────

export interface JwtPayload {
    sub: string;                // userId
    email: string;
    role: UserRole;
    driverId?: string;          // populated for DRIVER role
    restaurantIds?: string[];   // populated for RESTAURANT_OWNER role
    iat?: number;
    exp?: number;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// ─── Geo ──────────────────────────────────────────────────────────────────────

export interface Coordinates {
    latitude: number;
    longitude: number;
}

export interface NearbyDriver {
    id: string;
    userId: string;
    vehicleType: VehicleType;
    rating: number;
    distanceMeters: number;
    lastLat: number;
    lastLng: number;
}

// ─── Pricing ─────────────────────────────────────────────────────────────────

export interface PriceBreakdown {
    itemsTotal: number;          // paise
    deliveryFee: number;         // paise
    platformFee: number;         // paise
    packagingFee: number;        // paise
    taxes: number;               // paise
    discount: number;            // paise
    totalAmount: number;         // paise
    surgeMultiplier: number;     // e.g. 1.5x
    estimatedDeliveryMins: number;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface CartItemView {
    id: string;
    menuItemId: string;
    name: string;
    price: number;         // paise (effective price after discount)
    originalPrice: number; // paise
    imageUrl?: string;
    isVeg: boolean;
    quantity: number;
    subtotal: number;      // paise
}

export interface CartView {
    id: string;
    restaurantId: string;
    restaurantName: string;
    items: CartItemView[];
    itemsTotal: number;    // paise
    itemCount: number;
}


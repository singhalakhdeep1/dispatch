import { z } from "zod";

// ─── Place Order ──────────────────────────────────────────────────────────────

export const PlaceOrderSchema = z.object({
    restaurantId: z.string().min(1),
    addressId: z.string().optional(),
    items: z
        .array(
            z.object({
                menuItemId: z.string().min(1),
                quantity: z.number().int().min(1).max(20),
            }),
        )
        .min(1, "Order must have at least one item"),
    deliveryLat: z.number().min(-90).max(90),
    deliveryLng: z.number().min(-180).max(180),
    deliveryAddress: z.string().min(5),
    instructions: z.string().max(300).optional(),
});

export type PlaceOrderDto = z.infer<typeof PlaceOrderSchema>;

// ─── Cancel Order ─────────────────────────────────────────────────────────────

export const CancelOrderSchema = z.object({
    reason: z.string().min(5, "Please provide a reason").max(200),
});

export type CancelOrderDto = z.infer<typeof CancelOrderSchema>;

// ─── List Orders ──────────────────────────────────────────────────────────────

export const ListOrdersSchema = z.object({
    status: z
        .enum(["PLACED", "FINDING_DRIVER", "DRIVER_ASSIGNED", "PICKED_UP", "DELIVERED", "CANCELLED"])
        .optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type ListOrdersDto = z.infer<typeof ListOrdersSchema>;

// ─── Rate Order ───────────────────────────────────────────────────────────────

export const RateOrderSchema = z.object({
    restaurantRating: z.number().min(1).max(5),
    driverRating: z.number().min(1).max(5).optional(),
    comment: z.string().max(300).optional(),
});

export type RateOrderDto = z.infer<typeof RateOrderSchema>;

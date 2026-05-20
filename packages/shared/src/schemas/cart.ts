import { z } from "zod";

// ─── Cart ─────────────────────────────────────────────────────────────────────

export const AddToCartSchema = z.object({
    menuItemId: z.string().min(1),
    quantity: z.number().int().min(1).max(20),
});
export type AddToCartDto = z.infer<typeof AddToCartSchema>;

export const UpdateCartItemSchema = z.object({
    quantity: z.number().int().min(0).max(20), // 0 = remove
});
export type UpdateCartItemDto = z.infer<typeof UpdateCartItemSchema>;

// ─── Promo ────────────────────────────────────────────────────────────────────

export const ApplyPromoSchema = z.object({
    code: z.string().min(1).max(30).toUpperCase(),
});
export type ApplyPromoDto = z.infer<typeof ApplyPromoSchema>;

export const CreatePromoSchema = z.object({
    restaurantId: z.string().optional(),
    code: z.string().min(3).max(30).toUpperCase(),
    description: z.string().min(5),
    type: z.enum(["PERCENTAGE", "FLAT", "FREE_DELIVERY"]),
    value: z.number().int().min(1),
    minOrderAmount: z.number().int().min(0).default(0),
    maxDiscount: z.number().int().min(0).optional(),
    usageLimit: z.number().int().min(1).optional(),
    perUserLimit: z.number().int().min(1).default(1),
    validFrom: z.coerce.date(),
    validUntil: z.coerce.date(),
});
export type CreatePromoDto = z.infer<typeof CreatePromoSchema>;

// ─── Review ───────────────────────────────────────────────────────────────────

export const CreateReviewSchema = z.object({
    orderId: z.string().min(1),
    restaurantRating: z.number().int().min(1).max(5),
    restaurantComment: z.string().max(500).optional(),
    driverRating: z.number().int().min(1).max(5).optional(),
    driverComment: z.string().max(300).optional(),
    itemRatings: z.array(z.object({
        menuItemId: z.string(),
        rating: z.number().int().min(1).max(5),
    })).optional(),
    images: z.array(z.string().url()).max(5).optional(),
});
export type CreateReviewDto = z.infer<typeof CreateReviewSchema>;

export const OwnerReplySchema = z.object({
    reply: z.string().min(5).max(500),
});
export type OwnerReplyDto = z.infer<typeof OwnerReplySchema>;

// ─── Payment ──────────────────────────────────────────────────────────────────

export const InitiatePaymentSchema = z.object({
    orderId: z.string().min(1),
    method: z.enum(["UPI", "CARD", "WALLET", "NETBANKING"]),
});
export type InitiatePaymentDto = z.infer<typeof InitiatePaymentSchema>;

export const VerifyPaymentSchema = z.object({
    orderId: z.string().min(1),
    razorpayOrderId: z.string(),
    razorpayPaymentId: z.string(),
    razorpaySignature: z.string(),
});
export type VerifyPaymentDto = z.infer<typeof VerifyPaymentSchema>;

// ─── Address ──────────────────────────────────────────────────────────────────

export const CreateAddressSchema = z.object({
    label: z.string().min(1).max(30),
    line1: z.string().min(5).max(200),
    line2: z.string().max(200).optional(),
    city: z.string().min(2),
    pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits"),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    isDefault: z.boolean().default(false),
});
export type CreateAddressDto = z.infer<typeof CreateAddressSchema>;

export const UpdateAddressSchema = CreateAddressSchema.partial();
export type UpdateAddressDto = z.infer<typeof UpdateAddressSchema>;

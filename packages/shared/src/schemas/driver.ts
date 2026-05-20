import { z } from "zod";

// ─── Register / Login ─────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
    email: z.string().email().max(255).toLowerCase().trim(),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(72)
        .regex(/[A-Z]/, "Must contain uppercase")
        .regex(/[a-z]/, "Must contain lowercase")
        .regex(/[0-9]/, "Must contain a number"),
    fullName: z.string().min(2).max(100).trim(),
    phone: z.string().regex(/^\+?[0-9\s\-]{7,15}$/, "Invalid phone number").optional(),
    role: z.enum(["CUSTOMER", "DRIVER"]).default("CUSTOMER"),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
    email: z.string().email().toLowerCase().trim(),
    password: z.string().min(1),
});

export type LoginDto = z.infer<typeof LoginSchema>;

// ─── Driver Registration ──────────────────────────────────────────────────────

export const RegisterDriverSchema = RegisterSchema.extend({
    role: z.literal("DRIVER"),
    vehicleType: z.enum(["BIKE", "SCOOTER", "CAR"]),
    vehicleNumber: z
        .string()
        .min(4)
        .max(15)
        .regex(/^[A-Z0-9\s]+$/, "Invalid vehicle number"),
    licenseNumber: z.string().min(8).max(20),
});

export type RegisterDriverDto = z.infer<typeof RegisterDriverSchema>;

// ─── Update Location (driver) ─────────────────────────────────────────────────

export const UpdateLocationSchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    heading: z.number().min(0).max(360).optional(),
    speed: z.number().min(0).max(200).optional(),
});

export type UpdateLocationDto = z.infer<typeof UpdateLocationSchema>;

// ─── Update Driver Status ─────────────────────────────────────────────────────

export const UpdateDriverStatusSchema = z.object({
    status: z.enum(["ONLINE", "OFFLINE"]),
});

export type UpdateDriverStatusDto = z.infer<typeof UpdateDriverStatusSchema>;

// ─── Accept / Reject Order ────────────────────────────────────────────────────

export const RespondToOrderSchema = z.object({
    accept: z.boolean(),
    rejectReason: z.string().max(200).optional(),
});

export type RespondToOrderDto = z.infer<typeof RespondToOrderSchema>;

// ─── Nearby Restaurants ───────────────────────────────────────────────────────

export const NearbyRestaurantsSchema = z.object({
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    radiusKm: z.coerce.number().min(0.5).max(20).default(5),
    cuisine: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type NearbyRestaurantsDto = z.infer<typeof NearbyRestaurantsSchema>;

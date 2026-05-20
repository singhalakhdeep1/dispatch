import { z } from "zod";

// ─── Create Restaurant ────────────────────────────────────────────────────────

export const CreateRestaurantSchema = z.object({
    name: z.string().min(2).max(100),
    description: z.string().max(500).optional(),
    imageUrl: z.string().url().optional(),
    coverImageUrl: z.string().url().optional(),
    cuisineType: z.array(z.string()).min(1).max(10),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().min(10),
    city: z.string().min(2),
    pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits"),
    phone: z.string().regex(/^\+?[\d\s-]{10,15}$/).optional(),
    email: z.string().email().optional(),
    openingTime: z.string().regex(/^\d{2}:\d{2}$/).default("09:00"),
    closingTime: z.string().regex(/^\d{2}:\d{2}$/).default("22:00"),
    minOrderAmount: z.number().int().min(0).default(0),        // paise
    avgDeliveryTime: z.number().int().min(5).max(120).default(30),
    deliveryRadius: z.number().int().min(500).max(20000).default(5000),
    taxPercent: z.number().min(0).max(28).default(5.0),
    packagingFee: z.number().int().min(0).default(0),          // paise
    fssaiLicense: z.string().optional(),
});

export type CreateRestaurantDto = z.infer<typeof CreateRestaurantSchema>;

// ─── Update Restaurant ────────────────────────────────────────────────────────

export const UpdateRestaurantSchema = CreateRestaurantSchema.partial();
export type UpdateRestaurantDto = z.infer<typeof UpdateRestaurantSchema>;

// ─── Update Status ────────────────────────────────────────────────────────────

export const UpdateRestaurantStatusSchema = z.object({
    status: z.enum(["OPEN", "CLOSED", "TEMPORARILY_CLOSED"]),
});
export type UpdateRestaurantStatusDto = z.infer<typeof UpdateRestaurantStatusSchema>;

// ─── List Restaurants ─────────────────────────────────────────────────────────

export const ListRestaurantsSchema = z.object({
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    radius: z.coerce.number().int().min(500).max(20000).default(5000),
    cuisine: z.string().optional(),
    search: z.string().max(100).optional(),
    sortBy: z.enum(["rating", "deliveryTime", "distance"]).default("rating"),
    isVeg: z.coerce.boolean().optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export type ListRestaurantsDto = z.infer<typeof ListRestaurantsSchema>;

// ─── Menu Category ────────────────────────────────────────────────────────────

export const CreateCategorySchema = z.object({
    name: z.string().min(1).max(50),
    description: z.string().max(200).optional(),
    imageUrl: z.string().url().optional(),
    sortOrder: z.number().int().min(0).default(0),
});
export type CreateCategoryDto = z.infer<typeof CreateCategorySchema>;

export const UpdateCategorySchema = CreateCategorySchema.partial();
export type UpdateCategoryDto = z.infer<typeof UpdateCategorySchema>;

// ─── Menu Item ────────────────────────────────────────────────────────────────

export const CreateMenuItemSchema = z.object({
    categoryId: z.string().optional(),
    name: z.string().min(1).max(100),
    description: z.string().max(400).optional(),
    price: z.number().int().min(1),            // paise — required
    discountedPrice: z.number().int().min(0).optional(),
    imageUrl: z.string().url().optional(),
    isVeg: z.boolean().default(true),
    isAvailable: z.boolean().default(true),
    isBestseller: z.boolean().default(false),
    preparationTime: z.number().int().min(1).max(120).default(15),
    spicyLevel: z.number().int().min(0).max(3).default(0),
    tags: z.array(z.string()).max(10).default([]),
    sortOrder: z.number().int().min(0).default(0),
});
export type CreateMenuItemDto = z.infer<typeof CreateMenuItemSchema>;

export const UpdateMenuItemSchema = CreateMenuItemSchema.partial();
export type UpdateMenuItemDto = z.infer<typeof UpdateMenuItemSchema>;

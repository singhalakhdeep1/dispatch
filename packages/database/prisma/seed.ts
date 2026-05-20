import { prisma, UserRole, VehicleType, RestaurantStatus } from "../src/index";
import * as bcrypt from "bcryptjs";

async function main() {
    console.log("🌱 Seeding OrderHub database...");

    // ── Users ─────────────────────────────────────────────────────────────────
    const customerHash = await bcrypt.hash("Password1!", 12);
    const driverHash = await bcrypt.hash("Password1!", 12);

    const customer = await prisma.user.upsert({
        where: { email: "customer@orderhub.dev" },
        update: {},
        create: {
            email: "customer@orderhub.dev",
            passwordHash: customerHash,
            fullName: "Priya Sharma",
            phone: "+91 98765 43210",
            role: UserRole.CUSTOMER,
        },
    });

    const driverUser = await prisma.user.upsert({
        where: { email: "driver@orderhub.dev" },
        update: {},
        create: {
            email: "driver@orderhub.dev",
            passwordHash: driverHash,
            fullName: "Ravi Kumar",
            phone: "+91 87654 32109",
            role: UserRole.DRIVER,
        },
    });

    // ── Driver profile ────────────────────────────────────────────────────────
    await prisma.driver.upsert({
        where: { userId: driverUser.id },
        update: {},
        create: {
            userId: driverUser.id,
            vehicleType: VehicleType.BIKE,
            vehicleNumber: "MH12AB1234",
            licenseNumber: "MH1234567890123",
            lastLat: 19.076,
            lastLng: 72.8777,
        },
    });

    // ── Address ───────────────────────────────────────────────────────────────
    await prisma.address.upsert({
        where: { id: "seed-address-1" },
        update: {},
        create: {
            id: "seed-address-1",
            userId: customer.id,
            label: "Home",
            line1: "301, Andheri West",
            city: "Mumbai",
            pincode: "400053",
            latitude: 19.1332,
            longitude: 72.8299,
            isDefault: true,
        },
    });

    // ── Restaurants ───────────────────────────────────────────────────────────
    const r1 = await prisma.restaurant.upsert({
        where: { id: "seed-restaurant-1" },
        update: {},
        create: {
            id: "seed-restaurant-1",
            name: "Biryani House",
            description: "Authentic Hyderabadi biryani and kebabs",
            cuisineType: ["Biryani", "Mughlai", "Kebabs"],
            rating: 4.5,
            ratingCount: 1200,
            status: RestaurantStatus.OPEN,
            latitude: 19.1,
            longitude: 72.84,
            address: "Shop 12, Juhu Market",
            city: "Mumbai",
            pincode: "400049",
            avgDeliveryTime: 35,
            minOrderAmount: 19900,
        },
    });

    const r2 = await prisma.restaurant.upsert({
        where: { id: "seed-restaurant-2" },
        update: {},
        create: {
            id: "seed-restaurant-2",
            name: "Burger Barn",
            description: "Gourmet burgers, crispy fries & thick shakes",
            cuisineType: ["Burgers", "American", "Fast Food"],
            rating: 4.2,
            ratingCount: 890,
            status: RestaurantStatus.OPEN,
            latitude: 19.12,
            longitude: 72.83,
            address: "G-5, Versova Link Road",
            city: "Mumbai",
            pincode: "400061",
            avgDeliveryTime: 25,
            minOrderAmount: 14900,
        },
    });

    // ── Menu items ────────────────────────────────────────────────────────────
    const cat1 = await prisma.menuCategory.create({
        data: { restaurantId: r1.id, name: "Biryani", sortOrder: 1 },
    });

    await prisma.menuItem.createMany({
        skipDuplicates: true,
        data: [
            {
                restaurantId: r1.id,
                categoryId: cat1.id,
                name: "Chicken Dum Biryani",
                description: "Slow-cooked aromatic basmati rice with tender chicken",
                price: 27900,
                isVeg: false,
                rating: 4.7,
            },
            {
                restaurantId: r1.id,
                categoryId: cat1.id,
                name: "Veg Biryani",
                description: "Fresh vegetables with fragrant long-grain rice",
                price: 21900,
                isVeg: true,
                rating: 4.3,
            },
            {
                restaurantId: r2.id,
                name: "Classic Smash Burger",
                description: "Double smash patty, American cheese, pickles, special sauce",
                price: 24900,
                isVeg: false,
                rating: 4.5,
            },
            {
                restaurantId: r2.id,
                name: "Crispy Fries",
                description: "Golden thin-cut fries with garlic aioli",
                price: 12900,
                isVeg: true,
                rating: 4.4,
            },
        ],
    });

    // ── Admin user ────────────────────────────────────────────────────────────
    const adminHash = await bcrypt.hash("Admin1234!", 12);
    await prisma.user.upsert({
        where: { email: "admin@orderhub.dev" },
        update: {},
        create: {
            email: "admin@orderhub.dev",
            passwordHash: adminHash,
            fullName: "Admin User",
            phone: "+91 90000 00001",
            role: UserRole.ADMIN,
        },
    });

    // ── Restaurant owner user ─────────────────────────────────────────────────
    const ownerHash = await bcrypt.hash("Owner1234!", 12);
    const owner = await prisma.user.upsert({
        where: { email: "owner@orderhub.dev" },
        update: {},
        create: {
            email: "owner@orderhub.dev",
            passwordHash: ownerHash,
            fullName: "Suresh Patel",
            phone: "+91 99887 76655",
            role: UserRole.RESTAURANT_OWNER,
        },
    });

    // Assign ownership of r1 to owner
    await prisma.restaurant.update({
        where: { id: "seed-restaurant-1" },
        data: { ownerId: owner.id },
    }).catch(() => null);

    // ── Promo codes ───────────────────────────────────────────────────────────
    await prisma.promoCode.upsert({
        where: { code: "SAVE50" },
        update: {},
        create: {
            code: "SAVE50",
            description: "50% off up to ₹100",
            discountType: "PERCENT",
            discountValue: 50,
            maxDiscount: 10000,
            minOrderAmount: 19900,
            isActive: true,
            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
    }).catch(() => null);

    await prisma.promoCode.upsert({
        where: { code: "FIRST100" },
        update: {},
        create: {
            code: "FIRST100",
            description: "₹100 off your first order",
            discountType: "FLAT",
            discountValue: 10000,
            minOrderAmount: 20000,
            isActive: true,
            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
    }).catch(() => null);

    // ── Customer wallet ───────────────────────────────────────────────────────
    await prisma.wallet.upsert({
        where: { userId: customer.id },
        update: {},
        create: {
            userId: customer.id,
            balance: 25000, // ₹250 in paise
        },
    }).catch(() => null);

    console.log("✅ Seed complete");
    console.log(`   Admin:    admin@orderhub.dev    / Admin1234!`);
    console.log(`   Owner:    owner@orderhub.dev    / Owner1234!`);
    console.log(`   Customer: customer@orderhub.dev / Password1!`);
    console.log(`   Driver:   driver@orderhub.dev   / Password1!`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

# Database Schema Documentation

## Overview
OrderHub uses PostgreSQL 16 with PostGIS 3.5 extension for geospatial queries, managed through Prisma ORM 5. The schema consists of 35+ models organized into functional domains.

## Schema Domains

### 1. Users & Authentication
Models: `User`, `Address`, `ReviewHelpfulVote`

**User Model**
- Fields: id, email, passwordHash, fullName, phone, avatarUrl, role, isActive
- Roles: CUSTOMER, DRIVER, RESTAURANT_OWNER, ADMIN
- Relations: orders, driver, addresses, notifications, cart, wallet, reviews, payments, restaurantsOwned, helpfulVotes, favorites, orderHistory, loyaltyPoints, subscriptions, groupOrders, giftCards, corporateEmployee

**Address Model**
- Fields: id, userId, label, line1, line2, city, pincode, latitude, longitude, isDefault
- Purpose: User delivery addresses with geospatial coordinates
- Indexes: userId, (userId, createdAt DESC)

### 2. Restaurants & Menu
Models: `Restaurant`, `MenuCategory`, `MenuItem`, `PromoCode`, `Favorite`

**Restaurant Model**
- Fields: id, ownerId, name, description, imageUrl, coverImageUrl, cuisineType[], rating, ratingCount, reviewCount, status, latitude, longitude, address, city, pincode, phone, email, openingTime, closingTime, minOrderAmount, avgDeliveryTime, deliveryRadius, taxPercent, packagingFee, fssaiLicense
- Status: PENDING_APPROVAL, OPEN, CLOSED, TEMPORARILY_CLOSED, SUSPENDED
- New Fields: isVeganOnly, isGlutenFree, isHalalCertified, isOrganic, dietaryTags[]
- Indexes: (city, status), ownerId

**MenuItem Model**
- Fields: id, restaurantId, categoryId, name, description, price, discountedPrice, imageUrl, isVeg, isAvailable, isBestseller, preparationTime, spicyLevel, tags[], sortOrder, rating, ratingCount
- New Fields: isGlutenFree, isDairyFree, isNutFree, isEggFree, isSoyFree, isKeto, isPaleo, isVegan, isHalal, isHighProtein, isLowCarb, isLowSodium, isOrganic, allergens[], nutritionalInfo
- Indexes: (restaurantId, isAvailable)

### 3. Orders & Cart
Models: `Order`, `OrderItem`, `Cart`, `CartItem`, `OrderHistory`, `ScheduledOrder`, `MultiRestaurantCart`, `MultiRestaurantCartItem`, `GroupOrder`, `GroupOrderParticipant`

**Order Model**
- Fields: id, userId, restaurantId, addressId, driverId, promoCodeId, status, paymentMethod, itemsTotal, deliveryFee, platformFee, packagingFee, taxes, discount, totalAmount, surgeMultiplier, deliveryAddress, deliveryLat, deliveryLng, instructions, placedAt, acceptedAt, pickedUpAt, deliveredAt, cancelledAt, cancelReason, estimatedPickupMins, estimatedDeliveryMins, isRated
- Status: 19 states from PLACED to DELIVERED
- New Fields: isGroupOrder, isScheduled, scheduledFor, loyaltyPointsEarned, loyaltyPointsRedeemed, giftCardAmountRedeemed, corporateApproval
- Indexes: (userId, status), restaurantId, driverId

**ScheduledOrder Model**
- Fields: id, userId, restaurantId, scheduledFor, status, orderData, deliveryAddress, specialInstructions, createdAt, updatedAt
- Status: PENDING, CONFIRMED, CANCELLED, COMPLETED
- Indexes: (userId, scheduledFor), (restaurantId, scheduledFor)

**GroupOrder Model**
- Fields: id, hostUserId, restaurantId, status, maxParticipants, orderAt, totalAmount, createdAt, updatedAt
- Status: ACTIVE, COMPLETED, CANCELLED
- Indexes: hostUserId, restaurantId

**MultiRestaurantCart Model**
- Fields: id, cartId, restaurantId, subtotal, createdAt, updatedAt
- Purpose: Separate cart segments for multi-restaurant ordering
- Indexes: (cartId, restaurantId), cartId, restaurantId

### 4. Drivers & Geo
Models: `Driver`, `DriverLocation`, `DriverEarning`

**Driver Model**
- Fields: id, userId, vehicleType, vehiclePlate, licenseNumber, profilePhoto, vehiclePhoto, isVerified, status, rating, ratingCount, totalTrips, totalEarnings, lastLat, lastLng, lastSeenAt
- Status: OFFLINE, ONLINE, ON_TRIP, SUSPENDED
- Vehicle Types: BIKE, SCOOTER, CAR
- Indexes: userId

**DriverLocation Model**
- Fields: id, driverId, latitude, longitude, heading, speed, recordedAt
- Purpose: GPS location history for drivers
- Indexes: (driverId, recordedAt DESC)

### 5. Wallet & Payments
Models: `Wallet`, `WalletTransaction`, `Payment`, `GiftCard`, `GiftCardRedemption`

**Wallet Model**
- Fields: id, userId, balance, currency, createdAt, updatedAt
- Purpose: User wallet for payments and refunds
- Balance in paise (integer, no floats)

**GiftCard Model**
- Fields: id, code, amount, balance, senderUserId, recipientEmail, recipientPhone, message, status, expiresAt, createdAt, updatedAt
- Status: ACTIVE, REDEEMED, EXPIRED, CANCELLED
- Purpose: Gift card purchase and redemption system
- Indexes: code, status

### 6. Loyalty & Rewards
Models: `LoyaltyProgram`, `UserLoyaltyPoints`, `Reward`, `RewardRedemption`

**LoyaltyProgram Model**
- Fields: id, name, description, pointsPerRupee, redemptionRate, maxPointsPerOrder, isActive, createdAt, updatedAt
- Purpose: Loyalty program configuration
- Features: Points earning rate, redemption rate, per-order caps

**UserLoyaltyPoints Model**
- Fields: id, userId, programId, pointsBalance, totalEarned, totalRedeemed, tier, createdAt, updatedAt
- Tiers: BRONZE, SILVER, GOLD, PLATINUM
- Purpose: User loyalty points and tier tracking
- Indexes: userId

**Reward Model**
- Fields: id, programId, name, description, pointsRequired, rewardType, rewardValue, imageUrl, isActive, validFrom, validUntil, createdAt, updatedAt
- Reward Types: FREE_DELIVERY, DISCOUNT, FREE_ITEM
- Purpose: Available rewards for points redemption

### 7. Subscriptions
Models: `Subscription`, `SubscriptionOrder`

**Subscription Model**
- Fields: id, userId, planType, status, startDate, endDate, autoRenew, nextBillingDate, createdAt, updatedAt
- Plan Types: MONTHLY, YEARLY
- Status: ACTIVE, PAUSED, CANCELLED, EXPIRED
- Purpose: Subscription management for free delivery benefits
- Indexes: (userId, status), nextBillingDate

### 8. Corporate Accounts
Models: `CorporateAccount`, `CorporateEmployee`, `CorporateOrder`

**CorporateAccount Model**
- Fields: id, companyName, companyEmail, contactPerson, contactPhone, billingAddress, taxId, creditLimit, currentBalance, status, createdAt, updatedAt
- Status: ACTIVE, SUSPENDED, CLOSED
- Purpose: B2B corporate account management
- Indexes: companyEmail

**CorporateEmployee Model**
- Fields: id, corporateAccountId, userId, employeeId, department, spendingLimit, isActive, createdAt, updatedAt
- Purpose: Employee management with spending limits
- Indexes: (corporateAccountId, userId), corporateAccountId

### 9. Platform
Models: `Notification`, `Review`, `PromoCodeUsage`

**Review Model**
- Fields: id, userId, orderId, targetType, restaurantId, driverId, menuItemId, rating, comment, images[], ownerReply, ownerReplyAt, isVerified, isFlagged, helpfulCount, createdAt, updatedAt
- Target Types: RESTAURANT, DRIVER, MENU_ITEM
- New Fields: ownerReplyAt, isFlagged, helpfulCount
- Indexes: restaurantId, driverId, isFlagged

**Notification Model**
- Fields: id, userId, type, title, body, isRead, data, createdAt, updatedAt
- Purpose: User notifications with read status
- Indexes: (userId, createdAt DESC)

## Relationships

### Core Relationships
- User → Orders (one-to-many)
- User → Driver (one-to-one)
- User → Restaurants (one-to-many, as owner)
- Restaurant → Orders (one-to-many)
- Restaurant → MenuItems (one-to-many)
- Order → OrderItems (one-to-many)
- Order → Driver (many-to-one)
- Order → Payment (one-to-one)

### New Feature Relationships
- User → Favorites (one-to-many)
- User → OrderHistory (one-to-many)
- User → LoyaltyPoints (one-to-many)
- User → Subscriptions (one-to-many)
- User → GiftCards (one-to-many, as sender)
- User → GiftCardRedemptions (one-to-many)
- User → CorporateEmployee (one-to-many)
- Restaurant → Favorites (one-to-many)
- Restaurant → MultiRestaurantCarts (one-to-many)
- Order → OrderHistory (one-to-one)
- Order → SubscriptionOrders (one-to-many)
- Order → GiftCardRedemptions (one-to-many)
- Order → CorporateOrders (one-to-many)

## Indexes Strategy

### Performance Indexes
- Foreign key indexes on all relations
- Composite indexes for common query patterns
- Time-based indexes for history queries
- Geospatial indexes for location queries
- Unique constraints for data integrity

### Geospatial Indexes
- Restaurant location for radius queries
- Driver location for nearest driver search
- Address coordinates for delivery validation

## Data Integrity

### Constraints
- Unique constraints on emails, employee IDs, gift card codes
- Foreign key constraints for referential integrity
- Check constraints for enum values
- Not null constraints on required fields

### Cascading Deletes
- User data cascades to related records
- Restaurant deletion cascades to menu items
- Cart deletion cascades to cart items

## Migration Strategy

### Version Control
- Prisma migration files
- Rollback capability
- Migration history tracking

### Production Deployment
- Zero-downtime migrations
- Data validation before schema changes
- Backup before major migrations
# OrderHub — Food Delivery Platform

> A production-grade **Swiggy / Zomato clone** built as a polyglot microservices monorepo.
> Real-time GPS tracking, Kafka-choreographed order sagas, surge pricing, PostGIS geospatial driver matching, and PWA support for consumers, drivers, restaurant owners, and super admins.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Database Schema](#4-database-schema)
5. [Kafka Topics & Event Flow](#5-kafka-topics--event-flow)
6. [WebSocket Events](#6-websocket-events)
7. [API Reference](#7-api-reference)
8. [Frontend Applications](#8-frontend-applications)
9. [Environment Variables](#9-environment-variables)
10. [Quick Start](#10-quick-start)
11. [Full Docker Deployment](#11-full-docker-deployment)
12. [Key Design Decisions](#12-key-design-decisions)
13. [Project Structure](#13-project-structure)

---

## 1. Project Overview

OrderHub is a full-featured food delivery platform with four distinct user personas:

| Persona         | Application              | Key Capabilities                                                                      |
| --------------- | ------------------------ | ------------------------------------------------------------------------------------- |
| **Consumer**    | `apps/web`               | Browse restaurants, search by cuisine/location, add to cart, track order live on map  |
| **Driver**      | `apps/driver-app`        | Go online/offline, accept order requests, navigate with map, update delivery status   |
| **Restaurant**  | `apps/web` (admin panel) | Manage menu, mark items unavailable, accept/reject orders, view sales analytics       |
| **Super Admin** | `apps/web` (admin panel) | Approve restaurants, manage users, monitor platform metrics, configure surge settings |

The platform uses a **choreography-based Saga** pattern via Kafka for the distributed order workflow, ensuring eventual consistency across independent microservices without a central orchestrator.

---

## 2. Architecture

```
orderhub/
├── apps/
│   ├── gateway/        ← NestJS 10 — Auth (JWT), request routing, trusted headers
│   ├── orders/         ← NestJS 10 — Order lifecycle + Kafka Saga
│   ├── drivers/        ← NestJS 10 — Driver matching (PostGIS), geo-presence (Redis)
│   ├── notifications/  ← NestJS 10 — Kafka consumer + Socket.IO real-time push
│   ├── restaurants/    ← NestJS 10 — Restaurant / menu / promo management
│   ├── pricing/        ← FastAPI (Python 3.12) — Surge pricing via Redis demand counters
│   ├── web/            ← Next.js 15 — Consumer PWA + Restaurant admin + Super admin
│   └── driver-app/     ← Next.js 15 — Driver PWA (go online, accept orders, navigate)
├── packages/
│   ├── database/       ← Prisma 5 + PostgreSQL/PostGIS shared schema (19 models)
│   ├── shared/         ← Kafka event envelopes, Zod schemas, TS types, proto definitions
│   ├── grpc/           ← Generated gRPC client stubs (orders ↔ pricing, gateway ↔ orders)
│   └── ui/             ← Shared TailwindCSS + Radix UI component library
├── docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
```

### Service Ports

| Service                      | Port |
| ---------------------------- | ---- |
| Consumer web (Next.js)       | 3000 |
| Gateway (NestJS)             | 3001 |
| Orders service (NestJS)      | 3002 |
| Drivers service (NestJS)     | 3003 |
| Notifications / Socket.IO    | 3004 |
| Pricing service (FastAPI)    | 3005 |
| Driver app (Next.js)         | 3006 |
| Restaurants service (NestJS) | 3007 |
| Kafka broker (external)      | 9094 |
| PostgreSQL                   | 5432 |
| Redis                        | 6379 |
| Kafka UI (dev profile)       | 8080 |

---

## 3. Tech Stack

| Layer                | Technology                                                                    |
| -------------------- | ----------------------------------------------------------------------------- |
| API Gateway          | NestJS 10, Passport JWT, Helmet, compression                                  |
| Microservices        | NestJS 10, KafkaJS 2, class-validator, class-transformer                      |
| Pricing Engine       | FastAPI 0.115, Python 3.12, redis-py, uvicorn                                 |
| Consumer & Driver UI | Next.js 15 App Router, TailwindCSS, React-Leaflet, Zustand, TanStack Query v5 |
| Real-time            | Socket.IO 4 (namespaced rooms per order)                                      |
| Message Bus          | Apache Kafka 3.9 KRaft (no Zookeeper), 3 partitions per topic                 |
| Database             | PostgreSQL 16 + PostGIS 3.5, Prisma ORM 5                                     |
| Cache / Geo          | Redis 7 — GEOADD/GEORADIUS, demand counters, idempotency keys                 |
| Payments             | Razorpay (orders), paise integers (no floats)                                 |
| Internal RPC         | gRPC (Protocol Buffers) — service-to-service calls within the monorepo        |
| Resilience           | opossum circuit breaker, exponential-backoff retry on service calls           |
| Monorepo             | Turborepo 2, pnpm 9 workspaces                                                |
| Containerisation     | Docker 26, Docker Compose v3.9                                                |
| Validation           | Zod (shared), class-validator + class-transformer                             |

---

## 4. Database Schema

19 Prisma models across the following domains:

### Users & Auth

| Model     | Key Fields                                                                                                 |
| --------- | ---------------------------------------------------------------------------------------------------------- |
| `User`    | id, email, passwordHash, fullName, phone, role (CUSTOMER \| DRIVER \| RESTAURANT_OWNER \| ADMIN), isActive |
| `Address` | id, userId, label, line1, city, pincode, latitude, longitude, isDefault                                    |

### Restaurants & Menu

| Model          | Key Fields                                                                                                                                                                 |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Restaurant`   | id, ownerId, name, cuisineType[], status (PENDING_APPROVAL \| OPEN \| CLOSED \| SUSPENDED), latitude, longitude, deliveryRadius, avgDeliveryTime, taxPercent, fssaiLicense |
| `MenuCategory` | id, restaurantId, name, sortOrder, isActive                                                                                                                                |
| `MenuItem`     | id, restaurantId, categoryId, name, price (paise), discountedPrice (paise), isVeg, isAvailable                                                                             |
| `PromoCode`    | id, restaurantId, code, discountType, discountValue, minOrderAmount, maxUses, expiresAt                                                                                    |

### Orders & Cart

| Model       | Key Fields                                                                                                                                    |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `Order`     | id, userId, restaurantId, driverId, status (19 states), subtotal, deliveryFee, discount, tax, total (all paise), paymentMethod, paymentStatus |
| `OrderItem` | id, orderId, menuItemId, quantity, unitPrice, totalPrice                                                                                      |
| `Cart`      | id, userId, restaurantId                                                                                                                      |
| `CartItem`  | id, cartId, menuItemId, quantity                                                                                                              |

### Drivers & Geo

| Model           | Key Fields                                                                                     |
| --------------- | ---------------------------------------------------------------------------------------------- |
| `Driver`        | id, userId, vehicleType, vehiclePlate, isOnline, currentLat, currentLng, totalEarnings, rating |
| `DriverEarning` | id, driverId, orderId, amount, settled                                                         |

### Wallet & Payments

| Model     | Key Fields                                               |
| --------- | -------------------------------------------------------- |
| `Wallet`  | id, userId, balance (paise), currency                    |
| `Payment` | id, userId, orderId, provider, razorpayOrderId, status   |
| `Review`  | id, userId, restaurantId, orderId, rating (1–5), comment |

### Platform

| Model          | Key Fields                                         |
| -------------- | -------------------------------------------------- |
| `Notification` | id, userId, type, title, body, isRead, data (JSON) |

---

## 5. Kafka Topics & Event Flow

### Topics

| Topic                     | Producer | Consumer(s)            |
| ------------------------- | -------- | ---------------------- |
| `order.placed`            | orders   | drivers, notifications |
| `driver.assigned`         | drivers  | orders, notifications  |
| `order.status_updated`    | orders   | notifications          |
| `driver.location_updated` | drivers  | notifications          |
| `payment.completed`       | gateway  | orders                 |
| `order.cancelled`         | orders   | notifications, pricing |

### Order Saga Sequence

```
Consumer places order
        │
        ▼
  [Gateway :3001]
  POST /v1/orders  ──►  [Orders :3002] creates order (PENDING)
                               │
                               │  Kafka: order.placed { orderId, restaurantId, location }
                               ▼
                        [Drivers :3003]
                        PostGIS ST_DWithin → nearest online driver
                               │
                               │  Kafka: driver.assigned { orderId, driverId }
                               ▼
                        [Orders :3002]  status → DRIVER_ASSIGNED
                               │
                               │  Kafka: order.status_updated
                               ▼
                        [Notifications :3004]
                        Persist notification + Socket.IO emit
                        to rooms: user:{userId}  /  order:{orderId}
```

### Kafka Event Envelope

All events use a typed envelope defined in `packages/shared`:

```ts
{
  eventId: string; // UUID — used for idempotent consumers (Redis SETNX)
  eventType: string; // e.g. "order.placed"
  timestamp: string; // ISO 8601
  data: T; // event-specific payload
}
```

---

## 6. WebSocket Events

Connect to `ws://localhost:3004` (default namespace) with `?token=<jwt>`.

### Client → Server

| Event             | Payload                        | Description                        |
| ----------------- | ------------------------------ | ---------------------------------- |
| `joinRoom`        | `{ room: "order:abc123" }`     | Subscribe to an order room         |
| `leaveRoom`       | `{ room: "order:abc123" }`     | Unsubscribe                        |
| `driver:location` | `{ lat: number, lng: number }` | Driver GPS ping (DRIVER role only) |

### Server → Client

| Event              | Payload                                      | Description                 |
| ------------------ | -------------------------------------------- | --------------------------- |
| `order:update`     | `{ orderId, status, updatedAt }`             | Order status changed        |
| `driver:location`  | `{ orderId, driverId, lat, lng, timestamp }` | Live driver position update |
| `notification:new` | `{ title, body, type, data }`                | Push notification to user   |

---

## 7. API Reference

All external requests go through the **Gateway at `:3001`**. Internal service ports are not exposed in production.
Swagger UI: `http://localhost:3001/api/docs`

### Authentication

| Method | Path                       | Auth   | Description                      |
| ------ | -------------------------- | ------ | -------------------------------- |
| POST   | `/v1/auth/register`        | Public | Register a consumer account      |
| POST   | `/v1/auth/register/driver` | Public | Register a driver account        |
| POST   | `/v1/auth/login`           | Public | Login → `{ access_token, user }` |
| GET    | `/v1/auth/me`              | JWT    | Get current user profile         |
| PATCH  | `/v1/auth/me`              | JWT    | Update profile                   |
| POST   | `/v1/auth/logout`          | JWT    | Invalidate session               |

### Restaurants

| Method | Path                                     | Auth              | Description                              |
| ------ | ---------------------------------------- | ----------------- | ---------------------------------------- |
| GET    | `/v1/restaurants`                        | Public            | List restaurants (filter: city, cuisine) |
| GET    | `/v1/restaurants/nearby`                 | JWT               | Nearby restaurants (lat/lng/radius)      |
| GET    | `/v1/restaurants/:id`                    | Public            | Restaurant details + full menu           |
| POST   | `/v1/restaurants`                        | JWT (OWNER)       | Create restaurant                        |
| PATCH  | `/v1/restaurants/:id`                    | JWT (OWNER)       | Update restaurant info                   |
| PATCH  | `/v1/restaurants/:id/status`             | JWT (ADMIN/OWNER) | Toggle OPEN / CLOSED                     |
| POST   | `/v1/restaurants/:id/menu-items`         | JWT (OWNER)       | Add menu item                            |
| PATCH  | `/v1/restaurants/:id/menu-items/:itemId` | JWT (OWNER)       | Update menu item                         |
| DELETE | `/v1/restaurants/:id/menu-items/:itemId` | JWT (OWNER)       | Remove menu item                         |
| POST   | `/v1/restaurants/:id/promo-codes`        | JWT (OWNER)       | Create promo code                        |

### Orders

| Method | Path                         | Auth               | Description                                   |
| ------ | ---------------------------- | ------------------ | --------------------------------------------- |
| POST   | `/v1/orders`                 | JWT                | Place an order (triggers Kafka saga)          |
| GET    | `/v1/orders`                 | JWT                | List my orders (paginated)                    |
| GET    | `/v1/orders/:id`             | JWT                | Order detail with live status                 |
| PATCH  | `/v1/orders/:id/cancel`      | JWT                | Cancel order (allowed before DRIVER_ASSIGNED) |
| PATCH  | `/v1/orders/:id/status`      | JWT (DRIVER/OWNER) | Update order status                           |
| GET    | `/v1/orders/restaurant/:rid` | JWT (OWNER)        | Restaurant incoming orders                    |

### Cart

| Method | Path                     | Auth | Description      |
| ------ | ------------------------ | ---- | ---------------- |
| GET    | `/v1/cart`               | JWT  | Get current cart |
| POST   | `/v1/cart/items`         | JWT  | Add item to cart |
| PATCH  | `/v1/cart/items/:itemId` | JWT  | Update quantity  |
| DELETE | `/v1/cart/items/:itemId` | JWT  | Remove item      |
| DELETE | `/v1/cart`               | JWT  | Clear cart       |

### Pricing

| Method | Path                    | Auth | Description                       |
| ------ | ----------------------- | ---- | --------------------------------- |
| POST   | `/v1/pricing/calculate` | JWT  | Calculate fees (subtotal + surge) |
| GET    | `/v1/pricing/surge`     | JWT  | Current surge multiplier for zone |

### Drivers

| Method | Path                   | Auth (DRIVER role) | Description             |
| ------ | ---------------------- | ------------------ | ----------------------- |
| GET    | `/v1/drivers/me`       | JWT                | Driver profile + stats  |
| PATCH  | `/v1/drivers/status`   | JWT                | Toggle online / offline |
| POST   | `/v1/drivers/location` | JWT                | Push GPS coordinates    |
| GET    | `/v1/drivers/earnings` | JWT                | Earnings history        |
| GET    | `/v1/drivers/orders`   | JWT                | My assigned orders      |

### Notifications

| Method | Path                             | Auth | Description                    |
| ------ | -------------------------------- | ---- | ------------------------------ |
| GET    | `/v1/notifications`              | JWT  | List notifications (paginated) |
| GET    | `/v1/notifications/unread-count` | JWT  | Unread notification count      |
| PATCH  | `/v1/notifications/:id/read`     | JWT  | Mark single as read            |
| PATCH  | `/v1/notifications/read-all`     | JWT  | Mark all as read               |

### Admin

| Method | Path                                | Auth (ADMIN) | Description                            |
| ------ | ----------------------------------- | ------------ | -------------------------------------- |
| GET    | `/v1/admin/restaurants/pending`     | JWT          | Restaurants awaiting approval          |
| PATCH  | `/v1/admin/restaurants/:id/approve` | JWT          | Approve restaurant                     |
| PATCH  | `/v1/admin/restaurants/:id/suspend` | JWT          | Suspend restaurant                     |
| GET    | `/v1/admin/users`                   | JWT          | All users (paginated)                  |
| PATCH  | `/v1/admin/users/:id/deactivate`    | JWT          | Deactivate user account                |
| GET    | `/v1/admin/metrics`                 | JWT          | Platform-wide metrics                  |
| GET    | `/v1/admin/settings`                | JWT          | Platform settings                      |
| PATCH  | `/v1/admin/settings`                | JWT          | Update platform settings (surge, fees) |

---

## 8. Frontend Applications

### Consumer Web (`apps/web` — port 3000)

Built with **Next.js 15 App Router**, TailwindCSS, Zustand, TanStack Query v5, React-Leaflet.

| Route               | Description                                        |
| ------------------- | -------------------------------------------------- |
| `/`                 | Home — location picker + featured restaurants      |
| `/restaurants`      | Browse + filter restaurants (cuisine, rating, ETA) |
| `/restaurants/[id]` | Restaurant page with full menu + add-to-cart       |
| `/cart`             | Review cart, apply promo codes, choose payment     |
| `/checkout`         | Address selection + Razorpay payment flow          |
| `/orders`           | Order history                                      |
| `/orders/[id]`      | Live order tracking with map + status timeline     |
| `/profile`          | User profile + saved addresses + wallet            |
| `/auth/login`       | Login                                              |
| `/auth/register`    | Registration                                       |

**Restaurant Admin** (`/(admin)/restaurant`)

| Route                   | Description                             |
| ----------------------- | --------------------------------------- |
| `/restaurant/dashboard` | Sales charts, today's order count       |
| `/restaurant/orders`    | Live order queue (accept / reject)      |
| `/restaurant/menu`      | Menu item management (add/edit/disable) |
| `/restaurant/analytics` | Revenue, popular items, peak hours      |
| `/restaurant/profile`   | Restaurant info, hours, delivery zone   |

**Super Admin** (`/(admin)/admin`)

| Route                | Description                                     |
| -------------------- | ----------------------------------------------- |
| `/admin/dashboard`   | Platform KPIs — GMV, orders, active drivers     |
| `/admin/restaurants` | All restaurants — approve / suspend             |
| `/admin/users`       | All users — deactivate, view roles              |
| `/admin/drivers`     | All drivers — status, earnings                  |
| `/admin/orders`      | All orders — filter by status, date, restaurant |
| `/admin/settings`    | Surge pricing config, delivery fee rules, tax   |

### Driver App (`apps/driver-app` — port 3006)

| Route         | Description                                         |
| ------------- | --------------------------------------------------- |
| `/`           | Dashboard — toggle online, active order card        |
| `/order/[id]` | Active order detail — map navigation + status steps |
| `/earnings`   | Daily / weekly / monthly earnings breakdown         |
| `/history`    | Completed deliveries                                |
| `/profile`    | Driver profile + vehicle + documents                |

---

## 9. Environment Variables

Copy `.env.example` to `.env` in the project root. Key variables:

```bash
# PostgreSQL (PostGIS)
DATABASE_URL=postgresql://orderhub:orderhub_password@localhost:5432/orderhub

# Redis
REDIS_URL=redis://localhost:6379

# Kafka
KAFKA_BROKERS=localhost:9094

# JWT
JWT_SECRET=change-me-at-least-32-chars
JWT_EXPIRES_IN=7d

# Razorpay
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...

# Next.js public
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...
```

See [.env.example](.env.example) for the complete list.

---

## 10. Quick Start

### Prerequisites

- **Docker & Docker Compose** v2+
- **Node.js** 20+ and **pnpm** 9+
- **Python 3.12+** (only needed to run the pricing service locally without Docker)

### Step 1 — Start infrastructure

```bash
docker compose up postgres redis kafka -d
```

Wait for all health checks to pass (typically ~15 seconds):

```bash
docker compose ps   # all services should show "healthy"
```

### Step 2 — Install dependencies

```bash
pnpm install
```

### Step 3 — Run migrations and seed

```bash
pnpm --filter @orderhub/database db:migrate
pnpm --filter @orderhub/database db:seed
```

The seed creates:

- Three test restaurants in Bengaluru with full menus
- Consumer account: `consumer@example.com` / `password123`
- Driver account: `driver@example.com` / `password123`
- Restaurant owner: `owner@example.com` / `password123`
- Super admin: `admin@example.com` / `password123`

### Step 4 — Start all services

```bash
pnpm dev
```

Turborepo starts all apps and packages in dependency order. First run may take 30–60 s for compilation.

### Optional — Kafka UI

```bash
docker compose --profile dev-tools up kafka-ui -d
# Open http://localhost:8080
```

---

## 11. Full Docker Deployment

```bash
# 1. Copy and fill environment file
cp .env.example .env

# 2. Build and start all containers
docker compose up -d --build

# 3. Run migrations inside the API container
docker compose exec orders npx prisma migrate deploy
docker compose exec orders npx prisma db seed
```

All services, databases, and the message broker start together. The `depends_on` + `healthcheck` configuration ensures services wait for their dependencies before starting.

---

## 12. Key Design Decisions

### Money as integers

All monetary amounts (prices, fees, totals) are stored as **paise** in `Int` or `BigInt` columns. No floating-point arithmetic anywhere in the payment path. `₹1 = 100 paise`.

### Kafka envelope with idempotency

Every Kafka message uses a typed envelope from `packages/shared`. Consumers do `SETNX orderhub:processed:{eventId} 1 EX 86400` in Redis before processing — guaranteeing **exactly-once processing** in the face of Kafka redelivery.

### Trusted headers (Gateway pattern)

The Gateway validates the JWT once and forwards `X-User-Id`, `X-User-Role`, `X-Org-Id` as headers to internal services. Internal services trust these headers and never re-parse JWT — keeping auth logic in one place.

### PostGIS for driver matching

Driver matching uses `ST_DWithin(driver.location, ST_MakePoint(lng, lat)::geography, radiusMeters)` for efficient radius queries. Positions are simultaneously tracked in Redis `GEOADD orderhub:drivers` for sub-millisecond distance sorting, with PostgreSQL as the authoritative source.

### Saga choreography (no orchestrator)

The order flow uses **choreography-based saga**: each service reacts to Kafka events and emits new ones. Compensating transactions (e.g., re-assigning a driver if they reject) are handled within each service's event handler. No central orchestrator means no single point of failure.

### gRPC for internal service communication

Service-to-service calls that need a synchronous response (e.g., Gateway calling Orders to create an order, Orders calling Pricing to get the delivery fee) use **gRPC with Protocol Buffers** instead of HTTP. `.proto` definitions live in `packages/grpc/proto/`.

Reasons over internal HTTP:

- **Typed contracts** — the `.proto` file is the schema; no accidental breaking changes
- **Smaller payloads** — binary Protobuf is 3–10× smaller than equivalent JSON
- **Streaming support** — server-streaming RPCs used for real-time order status push from Orders → Gateway
- **Generated clients** — `packages/grpc/` exports pre-built `@grpc/grpc-js` client stubs consumed by each service

External consumer API calls still enter as REST via the Gateway (port 3001), which translates them to internal gRPC calls.

### Circuit breakers + retry for service resilience

Every gRPC client call and outbound HTTP call is wrapped with **opossum** circuit breakers:

```
Request → CircuitBreaker
  CLOSED (healthy)  → call executes normally
  OPEN   (tripped)  → fast-fail immediately (no network round-trip)
  HALF_OPEN         → one probe request; re-close on success, re-open on failure
```

Trip thresholds: 50% failure rate over a 10-second rolling window. On OPEN, the fallback returns a cached response or a structured error to the Gateway.

Retries use **exponential backoff with jitter**: `delay = min(base × 2^attempt, 30s) + rand(0, 500ms)`. Idempotent read operations retry up to 3 times; write operations do **not** retry automatically — they rely on client-side idempotency keys instead.

### Surge pricing (FastAPI)

The Python service counts active orders per geohash zone using Redis `INCR`/`EXPIRE` counters. Surge multiplier = `max(1.0, activeOrders / baselineCapacity × factor)`, cached in Redis with a 60-second TTL to reduce computation overhead.

---

## 13. Project Structure

```
orderhub/
├── apps/
│   ├── gateway/
│   │   └── src/
│   │       ├── auth/           ← JWT strategy, guards, register/login
│   │       ├── proxy/          ← HTTP proxy middleware to internal services
│   │       └── main.ts
│   ├── orders/
│   │   └── src/
│   │       ├── orders/         ← Order CRUD + 19-state status machine
│   │       ├── cart/           ← Cart management
│   │       ├── kafka/          ← Event producers & consumers
│   │       └── payments/       ← Razorpay integration
│   ├── drivers/
│   │   └── src/
│   │       ├── drivers/        ← Driver profile, online toggle
│   │       ├── matching/       ← PostGIS nearest-driver query
│   │       └── geo/            ← Redis GEOADD location tracking
│   ├── notifications/
│   │   └── src/
│   │       ├── notifications/  ← REST controller (list, read, unread-count)
│   │       ├── kafka/          ← Consumers for all event types
│   │       └── gateway/        ← Socket.IO gateway
│   ├── restaurants/
│   │   └── src/
│   │       ├── restaurants/    ← Restaurant CRUD + approval workflow
│   │       ├── menu/           ← Menu categories & items
│   │       └── promo/          ← Promo codes
│   ├── pricing/
│   │   ├── main.py             ← FastAPI app
│   │   ├── surge.py            ← Surge multiplier logic
│   │   └── requirements.txt
│   ├── web/
│   │   └── app/
│   │       ├── (main)/         ← Consumer pages (restaurants, cart, orders)
│   │       ├── (admin)/        ← Restaurant admin + super admin
│   │       └── (auth)/         ← Login, register
│   └── driver-app/
│       └── app/
│           ├── (main)/         ← Driver dashboard, active order, map
│           └── (auth)/
├── packages/
│   ├── database/
│   │   └── prisma/
│   │       ├── schema.prisma   ← 19 models, PostGIS extensions
│   │       └── seed.ts
│   ├── shared/
│   │   └── src/
│   │       ├── events/         ← Kafka event type definitions + envelope
│   │       ├── schemas/        ← Zod validation schemas
│   │       └── types/          ← Shared TypeScript types
│   └── ui/
│       └── src/
│           └── components/     ← Button, Card, Badge, Input, Modal, etc.
├── docker-compose.yml
├── turbo.json
├── pnpm-workspace.yaml
└── .env.example
```

# Architecture Documentation

## System Architecture

OrderHub follows a microservices architecture with event-driven communication via Kafka. The system is designed for high availability, scalability, and fault tolerance.

## Service Architecture

### Core Services

#### 1. API Gateway (Port 3001)
- **Technology**: NestJS 10
- **Responsibilities**:
  - JWT authentication and authorization
  - Request routing to internal services
  - Rate limiting and throttling
  - CORS configuration
  - Request validation
  - Response aggregation
- **Security**: Passport JWT, Helmet, compression middleware

#### 2. Orders Service (Port 3002)
- **Technology**: NestJS 10
- **Responsibilities**:
  - Order lifecycle management (19 states)
  - Cart management
  - Payment integration
  - Kafka event production
  - gRPC microservice endpoints
  - New features: Order history, scheduled orders, loyalty, group orders, subscriptions, gift cards, corporate accounts, multi-restaurant ordering
- **Message Queue**: Kafka producer for order events

#### 3. Drivers Service (Port 3003)
- **Technology**: NestJS 10
- **Responsibilities**:
  - Driver profile management
  - GPS location tracking
  - Driver matching (PostGIS)
  - Geo-presence (Redis GEOADD)
  - Earnings tracking
  - Kafka event consumption
- **Database**: PostgreSQL with PostGIS for geospatial queries
- **Cache**: Redis for location indexing

#### 4. Notifications Service (Port 3004)
- **Technology**: NestJS 10 + Socket.IO
- **Responsibilities**:
  - Kafka event consumption
  - Real-time push notifications
  - Room-based subscriptions
  - Notification persistence
  - Multi-channel delivery
- **WebSocket**: Socket.IO with namespaced rooms

#### 5. Restaurants Service (Port 3007)
- **Technology**: NestJS 10
- **Responsibilities**:
  - Restaurant CRUD operations
  - Menu management
  - Promo code management
  - Reviews and ratings
  - Favorites management
  - Kafka event consumption
- **New Features**: Enhanced reviews with helpful voting, favorites system

#### 6. Pricing Service (Port 3005)
- **Technology**: FastAPI (Python 3.12)
- **Responsibilities**:
  - Surge pricing calculation
  - Delivery fee computation
  - Demand tracking (Redis)
  - Zone-based pricing
  - AI route optimization
- **Cache**: Redis for demand counters and pricing cache

### Frontend Applications

#### 7. Consumer Web App (Port 3000)
- **Technology**: Next.js 15
- **Responsibilities**:
  - Restaurant browsing and search
  - Cart management
  - Order placement
  - Order tracking
  - User profile management
  - Loyalty program integration
  - Subscription management
- **Features**: PWA support, real-time updates, location services

#### 8. Driver App (Port 3006)
- **Technology**: Next.js 15
- **Responsibilities**:
  - Online/offline status toggle
  - Order request notifications
  - GPS navigation
  - Delivery status updates
  - Earnings dashboard
- **Features**: PWA support, background location tracking

### Shared Packages

#### 9. Database Package
- **Technology**: Prisma 5 + PostgreSQL 16 + PostGIS 3.5
- **Models**: 35+ models covering all domains
- **Features**: Schema management, migrations, type-safe queries

#### 10. Shared Package
- **Content**: Kafka event envelopes, Zod schemas, TypeScript types
- **Purpose**: Shared business logic and validation

#### 11. gRPC Package
- **Technology**: Protocol Buffers
- **Purpose**: Service-to-service communication
- **Services**: Orders ↔ Pricing, Gateway ↔ Orders

#### 12. UI Package
- **Technology**: TailwindCSS + Radix UI
- **Purpose**: Shared React components
- **Components**: Buttons, cards, inputs, badges

## Data Flow

### Order Placement Flow
1. User places order via Consumer Web App
2. Order request goes to API Gateway
3. Gateway validates JWT and routes to Orders Service
4. Orders Service validates order and creates order record
5. Orders Service publishes `order.placed` event to Kafka
6. Drivers Service consumes event and finds nearest driver
7. Notifications Service pushes real-time updates
8. Gateway responds to user with order confirmation

### Real-Time Updates Flow
1. Driver updates location → Drivers Service
2. Drivers Service publishes `driver.location_updated` event
3. Notifications Service consumes event
4. Socket.IO pushes location update to consumer
5. Consumer sees real-time driver movement on map

## Event-Driven Architecture

### Kafka Topics
- `order.placed` - New order created
- `driver.assigned` - Driver assigned to order
- `order.status_updated` - Order status changes
- `driver.location_updated` - Driver GPS updates
- `payment.completed` - Payment successful
- `order.cancelled` - Order cancellation

### Event Envelope
Each event contains:
- `eventId` - Unique UUID for idempotency
- `eventType` - Event type identifier
- `timestamp` - Event creation time
- `data` - Event payload
- `version` - Event schema version

## Database Architecture

### PostgreSQL Primary Database
- **Purpose**: Transactional data storage
- **Extensions**: PostGIS for geospatial queries
- **Features**: ACID compliance, relational integrity

### Redis Cache Layer
- **Purpose**: Caching and ephemeral data
- **Use Cases**:
  - Driver location indexing (GEOADD/GEORADIUS)
  - Demand counters for surge pricing
  - Session storage
  - Rate limiting
  - Idempotency keys

### Kafka Message Broker
- **Purpose**: Event streaming and choreography
- **Configuration**: KRaft mode (no Zookeeper)
- **Partitions**: 3 per topic for parallelism
- **Retention**: 7 days

## Security Architecture

### Authentication
- JWT tokens with 7-day expiration
- Passport.js for authentication middleware
- Token refresh mechanism
- Role-based access control (RBAC)

### Authorization
- User roles: CUSTOMER, DRIVER, RESTAURANT_OWNER, ADMIN
- Permission checks per endpoint
- Resource ownership validation

### API Security
- Rate limiting per user/IP
- CORS configuration
- Helmet security headers
- Input validation with Zod
- SQL injection prevention via Prisma

## Scalability Architecture

### Horizontal Scaling
- Stateless services can be scaled horizontally
- Load balancer distributes requests
- Database connection pooling
- Redis clustering for distributed caching

### Vertical Scaling
- CPU and memory allocation per service
- Database connection optimization
- Redis memory management

### Fault Tolerance
- Circuit breaker pattern for service calls
- Retry logic with exponential backoff
- Graceful degradation
- Health checks and monitoring

## Performance Optimization

### Database Optimization
- Proper indexing strategy
- Query optimization
- Connection pooling
- Read replicas for read-heavy operations

### Caching Strategy
- Redis for frequently accessed data
- Application-level caching
- CDN for static assets
- Edge caching for API responses

### Network Optimization
- gRPC for internal service communication
- Binary payloads (3-10x smaller than JSON)
- HTTP/2 for external communication
- Compression middleware

## Monitoring & Observability

### Health Checks
- `/health` endpoint for all services
- Database connectivity checks
- Redis connectivity checks
- Kafka connectivity checks

### Logging
- Structured JSON logging
- Correlation IDs for request tracing
- Log levels: error, warn, log, debug
- Centralized log aggregation

### Metrics
- Request/response times
- Error rates and types
- Database query performance
- Kafka message throughput
- Cache hit/miss ratios

## Deployment Architecture

### Development Environment
- Docker Compose for local development
- Shared PostgreSQL and Redis
- Single Kafka broker
- Hot reloading for all services

### Production Environment
- Kubernetes orchestration
- Separate services per microservice
- Highly available PostgreSQL with streaming replication
- Redis Cluster for distributed caching
- Kafka cluster with multiple brokers
- Load balancer with SSL termination
- CDN for static assets
- Database backups and replication
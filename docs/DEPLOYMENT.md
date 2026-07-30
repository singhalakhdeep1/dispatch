# Deployment Guide

## Infrastructure Requirements

### Prerequisites
- Docker & Docker Compose
- Kubernetes cluster (for production)
- PostgreSQL 16+ with PostGIS extension
- Redis 7+
- Apache Kafka 3.9+
- Load balancer (NGINX/HAProxy)
- SSL certificates

### Environment Setup

### Development Environment
```bash
# Start infrastructure
docker-compose up -d postgres redis kafka

# Run database migrations
pnpm --filter @orderhub/database db:push

# Start development servers
pnpm dev
```

### Production Environment

#### Kubernetes Deployment
```bash
# Build Docker images
docker-compose build

# Push to container registry
docker push <registry>/orderhub/*

# Deploy to Kubernetes
kubectl apply -f k8s/
```

#### Docker Compose Production
```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f
```

## Service Configuration

### Environment Variables
All services require the following environment variables:

#### Database
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string

#### Kafka
- `KAFKA_BROKERS` - Kafka broker addresses

#### Security
- `JWT_SECRET` - JWT signing secret
- `JWT_EXPIRES_IN` - Token expiration time

#### Services
- `GATEWAY_PORT` - Gateway service port
- `ORDERS_PORT` - Orders service port
- `DRIVERS_PORT` - Drivers service port
- `NOTIFICATIONS_PORT` - Notifications service port
- `PRICING_PORT` - Pricing service port
- `RESTAURANTS_PORT` - Restaurants service port

#### Payment
- `RAZORPAY_KEY_ID` - Razorpay key ID
- `RAZORPAY_KEY_SECRET` - Razorpay key secret

## Monitoring & Logging

### Health Checks
Each service exposes a `/health` endpoint for health monitoring.

### Logging
- Structured JSON logging
- Correlation IDs for request tracing
- Log aggregation (ELK stack recommended)

### Metrics
- Request/response times
- Error rates
- Database query performance
- Kafka message throughput

## Scaling Considerations

### Horizontal Scaling
- Stateless services can be scaled horizontally
- Database connection pooling required
- Redis clustering for distributed caching
- Kafka partition scaling

### Vertical Scaling
- CPU and memory allocation per service
- Database connection limits
- Redis memory optimization

## Backup & Recovery

### Database Backups
```bash
# Daily backups
pg_dump -U orderhub orderhub > backup_$(date +%Y%m%d).sql

# Restore
psql -U orderhub orderhub < backup_20240101.sql
```

### Redis Backups
```bash
# Snapshot persistence
redis-cli BGSAVE

# Copy RDB file
cp dump.rdb backup_$(date +%Y%m%d).rdb
```

## Security Best Practices

### Network Security
- VPC isolation
- Security groups and firewall rules
- SSL/TLS encryption for all communications
- API rate limiting

### Application Security
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Secure session management

### Data Security
- Encryption at rest (database, files)
- Encryption in transit (TLS)
- Regular security audits
- Compliance with data protection regulations
# Dispatch - Implementation

## Overview
This document describes the ML, optimization, infrastructure, messaging, and monitoring integrations added to Dispatch.

## Technologies Added

### 1. TensorFlow
- Neural network models
- Delivery time prediction
- Model training and saving
- Model loading

### 2. Prophet
- Demand forecasting
- Delivery time forecasting
- Time series predictions

### 3. OR-Tools
- Vehicle routing optimization
- Knapsack problem solving
- Assignment problem solving

### 4. RedisTimeSeries
- Time series data storage
- Range queries
- Aggregation rules
- Time series info

### 5. scikit-learn
- Regression models
- Classification models
- Clustering algorithms
- Python bridge service

### 6. Kubernetes
- API deployment
- Service configuration
- Resource limits

### 7. Terraform
- AWS VPC and subnets
- EKS cluster
- ElastiCache Redis
- MQ (RabbitMQ)

### 8. GraphQL
- Order and Driver types
- Query and mutation resolvers
- Location types

### 9. gRPC
- Order service
- Driver service
- Protocol Buffers definitions

### 10. Istio (Service Mesh)
- Gateway configuration
- VirtualService routing
- DestinationRule load balancing

### 11. Grafana/Prometheus
- Prometheus monitoring
- Grafana visualization
- Kubernetes service discovery

### 12. RabbitMQ
- Message broker deployment
- Management UI
- Secret configuration

### 13. Apache Pulsar
- Producer for publishing
- Consumer for subscribing
- Topic management

## Files Created

### ML Services
- `apps/ml-service/src/tensorflow.ts` - TensorFlow service
- `apps/ml-service/src/prophet.ts` - Prophet forecasting
- `apps/ml-service/src/scikit-learn.ts` - scikit-learn bridge
- `apps/optimization-service/src/or-tools.ts` - OR-Tools optimization

### Analytics
- `apps/analytics-service/src/redisTimeSeries.ts` - Redis TimeSeries client

### Kubernetes
- `kubernetes/deployment.yaml` - API deployment
- `kubernetes/istio-gateway.yaml` - Istio gateway
- `kubernetes/grafana.yaml` - Grafana deployment
- `kubernetes/prometheus.yaml` - Prometheus deployment
- `kubernetes/rabbitmq.yaml` - RabbitMQ deployment

### Terraform
- `terraform/main.tf` - AWS infrastructure
- `terraform/variables.tf` - Terraform variables

### GraphQL
- `apps/api-gateway/src/graphql/schema.graphql` - GraphQL schema
- `apps/api-gateway/src/graphql/resolvers.ts` - GraphQL resolvers

### gRPC
- `apps/api-gateway/src/grpc/server.ts` - gRPC server
- `apps/api-gateway/src/grpc/dispatch.proto` - Protocol Buffers

### Pulsar
- `apps/messaging-service/src/pulsar/producer.ts` - Pulsar producer
- `apps/messaging-service/src/pulsar/consumer.ts` - Pulsar consumer

## Features

### TensorFlow Service
- Neural network for delivery time prediction
- Model training with custom architectures
- Model save/load functionality
- Memory management with tensor disposal

### Prophet Service
- Demand forecasting with time series
- Delivery time forecasting
- Trend and seasonality handling

### OR-Tools Service
- Vehicle routing problem solver
- Knapsack problem solver
- Assignment problem solver

### RedisTimeSeries Service
- Time series data addition
- Range queries
- Aggregation rules
- Info retrieval

### scikit-learn Service
- Linear regression
- Classification
- K-means clustering
- Python service bridge

### Kubernetes
- 3-replica deployment
- LoadBalancer service
- Resource requests/limits
- Environment variables

### Terraform
- VPC with public subnets
- EKS cluster with node group
- ElastiCache Redis
- MQ RabbitMQ broker

### GraphQL
- Order CRUD operations
- Driver queries
- Restaurant queries
- Location-based searches

### gRPC
- Order service (create, get, update)
- Driver service (get, update location, available)
- Protocol Buffers definitions

### Istio
- Gateway for external access
- VirtualService for routing
- DestinationRule for load balancing

### Grafana/Prometheus
- Prometheus with Kubernetes discovery
- Grafana with Prometheus datasource
- Service exposure

### RabbitMQ
- RabbitMQ with management UI
- Secret for password
- Service for AMQP and management

### Pulsar
- Producer for message publishing
- Consumer for message subscription
- Shared subscription type

## Installation Required

Add to `apps/ml-service/package.json`:
```json
{
  "dependencies": {
    "@tensorflow/tfjs-node": "^4.15.0"
  }
}
```

Add to `apps/analytics-service/package.json`:
```json
{
  "dependencies": {
    "redis": "^4.6.0"
  }
}
```

Add to `apps/api-gateway/package.json`:
```json
{
  "dependencies": {
    "@grpc/grpc-js": "^1.9.0",
    "@grpc/proto-loader": "^0.7.10"
  }
}
```

Add to `apps/messaging-service/package.json`:
```json
{
  "dependencies": {
    "pulsar-client": "^1.30.0"
  }
}
```

Run:
```bash
cd apps/ml-service && npm install
cd apps/analytics-service && npm install
cd apps/api-gateway && npm install
cd apps/messaging-service && npm install
```

## Environment Variables

```env
# Redis
REDIS_URL=redis://localhost:6379

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672

# Pulsar
PULSAR_URL=pulsar://localhost:6650

# gRPC
GRPC_PORT=50051

# AWS (for Terraform)
AWS_REGION=us-east-1
MQ_PASSWORD=changeme
```

## Notes
- All code is written but packages are not installed (per user request)
- Requires running instances of Redis, RabbitMQ, Pulsar
- TensorFlow requires Python backend for full functionality
- scikit-learn requires a Python service for actual ML operations
- Istio requires Istio installation in Kubernetes cluster
- Terraform requires AWS credentials and Terraform CLI

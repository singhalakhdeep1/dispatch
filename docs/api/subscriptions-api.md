# Subscriptions API

## Overview
Subscription management for free delivery and exclusive benefits.

## Endpoints

### Subscription Management
- `GET /v1/subscriptions/my-subscription` - Get user's subscription status
- `POST /v1/subscriptions/subscribe` - Create subscription
- `PATCH /v1/subscriptions/:id/cancel` - Cancel subscription
- `PATCH /v1/subscriptions/:id/pause` - Pause subscription
- `PATCH /v1/subscriptions/:id/resume` - Resume subscription
- `GET /v1/subscriptions/plans` - Get available subscription plans
- `GET /v1/subscriptions/history` - Get subscription history

## Features
- Monthly and yearly subscription plans
- Free delivery on all orders
- Exclusive restaurant access
- Auto-renewal functionality
- Pause/resume capabilities
- Plan comparison and pricing
- Subscription history tracking
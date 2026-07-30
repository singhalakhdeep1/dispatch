# Group Orders API

## Overview
Multi-user group ordering system for office lunches and social eating.

## Endpoints

### Group Order Management
- `POST /v1/group-orders` - Create group order
- `GET /v1/group-orders/:id` - Get group order details
- `GET /v1/group-orders/my-groups` - Get user's group orders
- `POST /v1/group-orders/:id/join` - Join group order
- `PATCH /v1/group-orders/:id/complete` - Complete group order
- `DELETE /v1/group-orders/:id` - Cancel group order
- `GET /v1/group-orders/:id/participants` - Get participants list

## Features
- Host creates group order with restaurant selection
- Participants join and add individual orders
- Individual order amount tracking
- Split billing calculation
- Host completes and processes all orders
- Participant count limits
- Status tracking (ACTIVE, COMPLETED, CANCELLED)
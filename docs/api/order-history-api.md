# Order History API

## Overview
Order history management with reorder functionality and frequent order tracking.

## Endpoints

### Order History
- `GET /v1/order-history` - Get user's order history
- `POST /v1/order-history/:orderId/reorder` - Reorder from history
- `GET /v1/order-history/frequent` - Get frequently ordered items

## Features
- Complete order history with restaurant details
- One-click reorder functionality
- Frequent order suggestions
- Reorder count tracking
- Automatic cart population
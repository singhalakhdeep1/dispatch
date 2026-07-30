# Multi-Restaurant Ordering API

## Overview
Order from multiple restaurants simultaneously with separate order processing.

## Endpoints

### Multi-Restaurant Cart Management
- `POST /v1/multi-restaurant/cart/enable` - Enable multi-restaurant cart mode
- `POST /v1/multi-restaurant/cart/add` - Add item to multi-restaurant cart
- `PATCH /v1/multi-restaurant/cart/items/:id` - Update cart item quantity
- `DELETE /v1/multi-restaurant/cart/items/:id` - Remove cart item
- `DELETE /v1/multi-restaurant/cart/restaurants/:restaurantId` - Remove restaurant from cart
- `GET /v1/multi-restaurant/cart` - Get multi-restaurant cart
- `POST /v1/multi-restaurant/checkout` - Checkout multi-restaurant order

## Features
- Order from multiple restaurants in single session
- Restaurant-specific cart segments
- Individual subtotals per restaurant
- Separate order creation per restaurant
- Combined checkout process
- Cart restaurant management
- Item-level CRUD operations
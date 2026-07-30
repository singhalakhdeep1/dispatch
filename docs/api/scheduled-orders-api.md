# Scheduled Orders API

## Overview
Schedule orders for specific future times with restaurant availability checking.

## Endpoints

### Scheduled Orders
- `GET /v1/scheduled-orders` - Get user's scheduled orders
- `POST /v1/scheduled-orders` - Create scheduled order
- `PATCH /v1/scheduled-orders/:id/cancel` - Cancel scheduled order
- `PATCH /v1/scheduled-orders/:id/reschedule` - Reschedule order
- `GET /v1/scheduled-orders/available-slots/:restaurantId` - Get available time slots

## Features
- Schedule up to 7 days in advance
- Restaurant availability validation
- Time slot availability checking
- Order cancellation with time restrictions
- Rescheduling functionality
- Automated order processing
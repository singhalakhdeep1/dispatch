# Gift Cards API

## Overview
Gift card purchase, redemption, and balance management system.

## Endpoints

### Gift Card Management
- `POST /v1/gift-cards/purchase` - Purchase gift card
- `POST /v1/gift-cards/redeem` - Redeem gift card on order
- `GET /v1/gift-cards/my-gift-cards` - Get user's gift cards
- `GET /v1/gift-cards/balance/:code` - Check gift card balance
- `GET /v1/gift-cards/:id` - Get gift card details
- `GET /v1/gift-cards/redemption/history` - Get redemption history

## Features
- Multiple gift card denominations
- Email delivery with custom messages
- Balance checking and validation
- Order redemption with amount calculation
- Gift card expiration handling
- Redemption history tracking
- Unique code generation
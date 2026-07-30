# Reviews & Ratings API

## Overview
Comprehensive reviews and ratings system for restaurants, drivers, and menu items with helpful voting, owner replies, and moderation features.

## Endpoints

### Restaurant Reviews
- `GET /v1/reviews/restaurant/:restaurantId` - Get restaurant reviews with pagination
- `GET /v1/reviews/item/:menuItemId` - Get menu item reviews
- `GET /v1/reviews/driver/:driverId` - Get driver reviews
- `GET /v1/reviews/my-reviews` - Get user's review history
- `GET /v1/reviews/:reviewId` - Get single review details

### Review Management
- `POST /v1/reviews` - Create new review
- `PATCH /v1/reviews/:reviewId/reply` - Owner reply to review
- `POST /v1/reviews/:reviewId/helpful` - Mark review as helpful
- `DELETE /v1/reviews/:reviewId/helpful` - Remove helpful vote
- `POST /v1/reviews/:reviewId/flag` - Flag review for moderation
- `PATCH /v1/reviews/:reviewId` - Update review (within 24 hours)
- `DELETE /v1/reviews/:reviewId` - Delete review (within 48 hours)

## Features
- Multi-target reviews (RESTAURANT, DRIVER, MENU_ITEM)
- Helpful voting system
- Owner response functionality
- Review flagging for moderation
- Time-limited edits/deletes
- Sorting options (recent, helpful, rating)
- Image support in reviews
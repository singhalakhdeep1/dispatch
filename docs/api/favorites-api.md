# Favorites API

## Overview
User favorites management for restaurants and menu items.

## Endpoints

### Favorites Management
- `GET /v1/favorites` - Get user's favorites (restaurants and items)
- `POST /v1/favorites` - Add restaurant or item to favorites
- `DELETE /v1/favorites/:id` - Remove from favorites
- `GET /v1/favorites/check/:restaurantId` - Check if restaurant is favorited

## Features
- Separate favorites for restaurants and menu items
- Type-based filtering
- Pagination support
- Quick favorite status checking
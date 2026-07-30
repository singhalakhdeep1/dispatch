# Loyalty & Rewards API

## Overview
Comprehensive loyalty program with points earning, tier progression, and reward redemption.

## Endpoints

### Loyalty Management
- `GET /v1/loyalty/my-points` - Get user's loyalty points and tier
- `GET /v1/loyalty/rewards` - Get available rewards catalog
- `POST /v1/loyalty/rewards/:rewardId/redeem` - Redeem reward
- `GET /v1/loyalty/history` - Get redemption history
- `GET /v1/loyalty/tier` - Get user's tier and benefits
- `GET /v1/loyalty/programs` - Get available loyalty programs

## Features
- Points earning on orders with tier multipliers
- 4-tier system (Bronze, Silver, Gold, Platinum)
- Reward catalog with points redemption
- Tier-specific benefits (free delivery thresholds, multipliers)
- Redemption history tracking
- Automatic tier progression
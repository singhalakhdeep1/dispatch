import math
import redis.asyncio as aioredis
from app.config import settings

# Grid cell size in degrees (~1.1km per 0.01°)
CELL_SIZE = 0.05  # ~5.5km cells

# Surge thresholds (active orders in cell → multiplier)
SURGE_TIERS = [
    (20, 2.5),
    (15, 2.0),
    (10, 1.5),
    (5, 1.25),
    (0, 1.0),
]

BASE_DELIVERY_FEE_PAISE = 2500   # ₹25.00
PER_KM_FEE_PAISE = 800           # ₹8.00/km
FREE_DISTANCE_KM = 3.0
PLATFORM_FEE_PAISE = 499         # ₹4.99


def _geo_cell(lat: float, lng: float) -> str:
    """Snap lat/lng to a grid cell key."""
    cell_lat = math.floor(lat / CELL_SIZE) * CELL_SIZE
    cell_lng = math.floor(lng / CELL_SIZE) * CELL_SIZE
    return f"surge:{cell_lat:.2f}:{cell_lng:.2f}"


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


def calculate_delivery_fee(distance_km: float, surge: float) -> int:
    if distance_km <= FREE_DISTANCE_KM:
        base = BASE_DELIVERY_FEE_PAISE
    else:
        extra_km = distance_km - FREE_DISTANCE_KM
        base = BASE_DELIVERY_FEE_PAISE + int(extra_km * PER_KM_FEE_PAISE)
    return round(base * surge)


def estimate_delivery_mins(distance_km: float) -> int:
    # Avg 20 km/h in city + 5 min pickup time
    return max(20, round((distance_km / 20) * 60 + 5))


def format_money(paise: int) -> str:
    return f"₹{paise / 100:.2f}"


class SurgeService:
    def __init__(self):
        self._redis: aioredis.Redis | None = None

    async def _get_redis(self) -> aioredis.Redis:
        if self._redis is None:
            self._redis = aioredis.from_url(settings.redis_url, decode_responses=True)
        return self._redis

    async def get_surge_multiplier(self, lat: float, lng: float) -> float:
        try:
            r = await self._get_redis()
            cell_key = _geo_cell(lat, lng)
            # Active orders count stored in Redis by the orders service
            count_str = await r.get(cell_key)
            count = int(count_str) if count_str else 0

            for threshold, multiplier in SURGE_TIERS:
                if count >= threshold:
                    return multiplier
        except Exception:
            pass  # graceful degradation — no surge if Redis unavailable

        return 1.0

    async def calculate_price(
        self,
        restaurant_lat: float,
        restaurant_lng: float,
        delivery_lat: float,
        delivery_lng: float,
        items_total: int = 0,
    ) -> dict:
        distance_km = haversine_km(restaurant_lat, restaurant_lng, delivery_lat, delivery_lng)
        surge = await self.get_surge_multiplier(restaurant_lat, restaurant_lng)
        delivery_fee = calculate_delivery_fee(distance_km, surge)
        platform_fee = PLATFORM_FEE_PAISE
        total = items_total + delivery_fee + platform_fee

        return {
            "itemsTotal": items_total,
            "deliveryFee": delivery_fee,
            "platformFee": platform_fee,
            "discount": 0,
            "totalAmount": total,
            "surgeMultiplier": surge,
            "estimatedDeliveryMins": estimate_delivery_mins(distance_km),
            "distanceKm": round(distance_km, 2),
            "itemsTotalFormatted": format_money(items_total),
            "deliveryFeeFormatted": format_money(delivery_fee),
            "totalAmountFormatted": format_money(total),
        }


surge_service = SurgeService()

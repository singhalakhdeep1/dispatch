from pydantic import BaseModel
from typing import Optional


class PriceRequest(BaseModel):
    restaurantLat: float
    restaurantLng: float
    deliveryLat: float
    deliveryLng: float
    itemsTotal: int = 0  # paise
    restaurantId: Optional[str] = None


class PriceResponse(BaseModel):
    itemsTotal: int          # paise
    deliveryFee: int         # paise
    platformFee: int         # paise (₹4.99 = 499)
    discount: int            # paise
    totalAmount: int         # paise
    surgeMultiplier: float
    estimatedDeliveryMins: int
    distanceKm: float

    # Formatted strings for display
    itemsTotalFormatted: str
    deliveryFeeFormatted: str
    totalAmountFormatted: str


class SurgeRequest(BaseModel):
    lat: float
    lng: float


class SurgeResponse(BaseModel):
    multiplier: float
    zone: str

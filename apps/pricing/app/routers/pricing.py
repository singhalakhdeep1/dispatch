from fastapi import APIRouter
from app.models import PriceRequest, PriceResponse, SurgeResponse
from app.services.surge import surge_service

router = APIRouter()


@router.post("/calculate", response_model=PriceResponse)
async def calculate_price(req: PriceRequest):
    """Calculate full price breakdown including surge multiplier and delivery fee."""
    result = await surge_service.calculate_price(
        restaurant_lat=req.restaurantLat,
        restaurant_lng=req.restaurantLng,
        delivery_lat=req.deliveryLat,
        delivery_lng=req.deliveryLng,
        items_total=req.itemsTotal,
    )
    return result


@router.get("/surge", response_model=SurgeResponse)
async def get_surge(lat: float, lng: float):
    """Get current surge multiplier for a geographic zone."""
    multiplier = await surge_service.get_surge_multiplier(lat, lng)
    return {
        "multiplier": multiplier,
        "zone": f"{lat:.2f},{lng:.2f}",
    }

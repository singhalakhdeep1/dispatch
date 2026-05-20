from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import pricing
from app.config import settings

app = FastAPI(
    title="OrderHub Pricing Service",
    description="Surge pricing and delivery fee calculation",
    version="1.0.0",
    docs_url="/docs" if settings.debug else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pricing.router, prefix="/pricing", tags=["pricing"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "pricing"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.port, reload=settings.debug)

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    port: int = 3005
    debug: bool = False
    redis_url: str = "redis://localhost:6379"

    class Config:
        env_file = "../../.env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()

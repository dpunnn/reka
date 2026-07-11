from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    PROJECT_NAME: str = "REKA"

    DATABASE_URL: str = "postgresql+psycopg2://reka:reka_dev_password@localhost:5432/reka"

    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "reka_dev_password"

    REDIS_URL: str = "redis://localhost:6379/0"
    RABBITMQ_URL: str = "amqp://reka:reka_dev_password@localhost:5672/"

    JWT_SECRET_KEY: str = "change_this_to_a_random_secret_in_production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # Panel Harga Pangan Badan Pangan Nasional (Bapanas) — API resmi butuh
    # registrasi + verifikasi manual dari Pusdatin (lihat webapi.badanpangan.go.id/
    # documentasi), tidak instan jadi tidak feasible didapat dalam waktu
    # hackathon. Kosongkan biar sistem otomatis pakai fallback lokal — begitu
    # tim dapat approval & API key, isi env var ini, integrasi riil otomatis
    # aktif tanpa perlu ubah kode (lihat app/services/harga_pasar.py).
    BAPANAS_API_KEY: str = ""
    BAPANAS_API_BASE_URL: str = "https://webapi.badanpangan.go.id"


settings = Settings()

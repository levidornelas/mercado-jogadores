from functools import lru_cache

from pydantic import Field, PostgresDsn
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    postgres_db: str = Field(default="mercado_jogadores")
    postgres_user: str = Field(default="mercado_user")
    postgres_password: str = Field(default="mercado_password_local")
    postgres_host: str = Field(default="localhost")
    postgres_port: int = Field(default=5432)
    frontend_origin: str = Field(default="http://localhost:3000")
    api_host: str = Field(default="0.0.0.0")
    api_port: int = Field(default=8000)

    @property
    def database_url(self) -> PostgresDsn:
        return PostgresDsn.build(
            scheme="postgresql+psycopg",
            username=self.postgres_user,
            password=self.postgres_password,
            host=self.postgres_host,
            port=self.postgres_port,
            path=self.postgres_db,
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()

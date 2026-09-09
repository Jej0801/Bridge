from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Centralized app configuration. Values are read from environment
    variables (or a .env file) and validated by Pydantic at startup —
    the app will fail fast if something required is missing/malformed.
    """

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "Bridge Code Review Service"
    ENV: str = "development"

    # Postgres (async driver)
    DATABASE_URL: str = (
        "postgresql+asyncpg://bridge:bridge@db:5432/bridge_reviews"
    )

    # Where cloned repos are checked out for static analysis
    WORKSPACE_DIR: str = "/tmp/bridge-workspaces"

    # Timeouts for external analysis tool invocations (seconds)
    ANALYSIS_TIMEOUT_SECONDS: int = 300

    # Comma-separated list of allowed CORS origins (e.g. the Expo app)
    CORS_ORIGINS: str = "*"

    # Meta app access token required for Instagram's oEmbed endpoint.
    # TikTok's oEmbed endpoint is public and needs no token.
    INSTAGRAM_ACCESS_TOKEN: str | None = None


settings = Settings()

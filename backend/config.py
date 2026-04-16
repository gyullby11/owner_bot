from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # OpenAI
    OPENAI_API_KEY: str = ""

    # JWT
    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Database
    DATABASE_URL: str = "sqlite:///./owner_bot.db"

    # 환경
    ENV: str = "development"

    def model_post_init(self, __context) -> None:
        is_production = self.ENV.lower() == "production"
        if not is_production:
            return

        if not self.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY must be set in production.")

        if self.SECRET_KEY == "your-secret-key-here":
            raise ValueError("SECRET_KEY must be changed for production.")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

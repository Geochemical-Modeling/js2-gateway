import os
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database settings
    DB_HOST: str = os.getenv("DB_HOST", "")
    DB_PORT: str = os.getenv("DB_PORT", "3306")
    DB_NAME: str = os.getenv("DB_NAME", "")
    DB_USER: str = os.getenv("DB_USER", "")
    DB_PASS: str = os.getenv("DB_PASS", "")
    
    # Authentication settings
    CILOGON_CLIENT_ID: str = os.getenv("CILOGON_CLIENT_ID", "")
    CILOGON_CLIENT_SECRET: str = os.getenv("CILOGON_CLIENT_SECRET", "")
    CILOGON_REDIRECT_URI: str = os.getenv("CILOGON_REDIRECT_URI", "")
    
    # Email settings - Mailtrap
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.mailtrap.io")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "2525"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    EMAIL_FROM: str = os.getenv("EMAIL_FROM", "noreply@js2-gateway.example.com")
    EMAIL_FROM_NAME: str = os.getenv("EMAIL_FROM_NAME", "JS2 Geochemical Gateway")
    
    # Admin notification email (temporary hardcoded value)
    ADMIN_NOTIFICATION_EMAIL: str = "callsutt@iu.edu"
    
    # Secret key for JWT token generation
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkey123changemelater")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 1 week
    
    # Frontend URL for email links
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:4000")


settings = Settings()
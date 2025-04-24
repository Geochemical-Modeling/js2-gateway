from sqlmodel import Field, SQLModel
from typing import Optional
from datetime import datetime


class User(SQLModel, table=True):
    """Database model for user information and authorization."""

    __tablename__ = "user_details"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: Optional[str] = Field(default=None, max_length=45)
    name: Optional[str] = Field(default=None, max_length=45)
    institution: Optional[str] = Field(default=None, max_length=45)
    approved_user: Optional[int] = Field(default=0)
    admin_rights: Optional[int] = Field(default=0)
    approved_at: Optional[datetime] = Field(default=None)
    archived: Optional[int] = Field(default=0)
    onboarded: int = Field(default=0)

"""Password hashing and the platform auth dependency (no external deps)."""
import hashlib
import hmac
import os
import secrets
from typing import Optional

from fastapi import Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import PlatformSession, User

_ITERATIONS = 120_000


def hash_password(password: str) -> str:
    salt = os.urandom(8).hex()
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), _ITERATIONS).hex()
    return f"{salt}${digest}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt, digest = stored.split("$", 1)
    except ValueError:
        return False
    candidate = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), _ITERATIONS).hex()
    return hmac.compare_digest(candidate, digest)


def new_token() -> str:
    return secrets.token_urlsafe(32)


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    header = request.headers.get("authorization", "")
    if not header.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = header.split(" ", 1)[1].strip()
    result = await db.execute(select(PlatformSession).where(PlatformSession.token == token))
    session_row = result.scalars().first()
    if session_row is None:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    user = await db.get(User, session_row.user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="Session user no longer exists")
    return user


async def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")
    return user


def preview_modules(request: Request, user: User) -> Optional[list[str]]:
    """Admin-only 'view as client' subset override (comma separated keys)."""
    if user.role != "admin":
        return None
    raw = request.headers.get("x-preview-modules", "")
    if not raw.strip():
        return None
    return [k.strip() for k in raw.split(",") if k.strip()]

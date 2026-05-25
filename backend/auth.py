import os
from typing import Any

import jwt
from dotenv import load_dotenv
from fastapi import Cookie, Depends, Header, HTTPException, Response
from passlib.context import CryptContext

from db import collection, serialize, utc_now

load_dotenv()

JWT_SECRET = os.environ.get("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError("Missing JWT_SECRET")

AUTH_COOKIE_NAME = "cg_session"
AUTH_COOKIE_SECURE = os.environ.get("AUTH_COOKIE_SECURE") == "true"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def create_token(user: dict[str, Any]) -> str:
    return jwt.encode({"userId": user["id"], "email": user["email"]}, JWT_SECRET, algorithm="HS256")


def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])


def set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=AUTH_COOKIE_SECURE,
        samesite="lax",
        max_age=60 * 60 * 24 * 7,
        path="/",
    )


def clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(key=AUTH_COOKIE_NAME, path="/")


def get_current_user(
    authorization: str | None = Header(default=None),
    auth_cookie: str | None = Cookie(default=None, alias=AUTH_COOKIE_NAME),
) -> dict[str, Any]:
    token = auth_cookie
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "", 1)

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = decode_token(token)
    except jwt.PyJWTError as error:
        raise HTTPException(status_code=401, detail="Invalid token") from error

    user = collection("users").find_one({"id": payload["userId"]}, {"_id": 0, "passwordHash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    now = utc_now()
    collection("users").update_one({"id": payload["userId"]}, {"$set": {"lastActiveAt": now}})
    user["lastActiveAt"] = now
    return serialize(user)


CurrentUser = Depends(get_current_user)
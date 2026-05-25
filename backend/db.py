import os
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from dotenv import load_dotenv
from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.collection import Collection
from pymongo.database import Database

load_dotenv()

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")

if not MONGO_URL or not DB_NAME:
    raise RuntimeError("Missing MONGO_URL or DB_NAME")

client = MongoClient(MONGO_URL)
db: Database = client[DB_NAME]


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def make_id() -> str:
    return str(uuid4())


def collection(name: str) -> Collection:
    return db[name]


def iso(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, list):
        return [iso(item) for item in value]
    if isinstance(value, dict):
        return {key: iso(item) for key, item in value.items()}
    return value


def serialize(document: dict | None) -> dict | None:
    if not document:
        return None
    clean = {key: value for key, value in document.items() if key != "_id"}
    return iso(clean)


def serialize_many(documents: list[dict]) -> list[dict]:
    return [serialize(document) for document in documents if document]


def ensure_indexes() -> None:
    collection("users").create_index([("email", ASCENDING)], unique=True)
    collection("users").create_index([("lastActiveAt", DESCENDING)])
    collection("invite_codes").create_index([("code", ASCENDING)], unique=True)
    collection("pairs").create_index([("userIds", ASCENDING)])
    collection("messages").create_index([("pairId", ASCENDING), ("createdAt", DESCENDING)])
    collection("messages").create_index([("pairId", ASCENDING), ("readBy", ASCENDING)])
    collection("bently_entries").create_index([("sessionId", ASCENDING), ("createdAt", DESCENDING)])
    collection("journal_entries").create_index([("pairId", ASCENDING), ("createdAt", DESCENDING)])
    collection("missions").create_index([("pairId", ASCENDING), ("createdAt", DESCENDING)])
    collection("calendar_events").create_index([("pairId", ASCENDING), ("startDate", ASCENDING)])
    collection("vault_entries").create_index([("pairId", ASCENDING), ("date", DESCENDING)])
    collection("settings").create_index([("userId", ASCENDING)], unique=True)
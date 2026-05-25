from pathlib import Path
from datetime import datetime, timedelta, timezone
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr, Field

from ai_service import generate_bently_response
from auth import CurrentUser, create_token, hash_password, verify_password
from db import collection, ensure_indexes, make_id, serialize, serialize_many, utc_now

load_dotenv()
ensure_indexes()

MEDIA_ROOT = Path("/app/backend/media")
MEDIA_ROOT.mkdir(parents=True, exist_ok=True)
ALLOWED_UPLOAD_PREFIXES = ("image/", "audio/")

app = FastAPI(title="CommonGround API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/api/media", StaticFiles(directory=str(MEDIA_ROOT)), name="media")


class SignupBody(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class JoinBody(BaseModel):
    code: str = Field(min_length=8, max_length=8)


class MessageBody(BaseModel):
    content: str = Field(min_length=1, max_length=1200)


class BentlyBody(BaseModel):
    message: str = Field(min_length=1, max_length=1500)


class JournalBody(BaseModel):
    prompt: str = Field(min_length=2, max_length=180)
    content: str = Field(min_length=1, max_length=4000)
    mood: str = Field(default="Reflective")


class CalendarBody(BaseModel):
    title: str = Field(min_length=2, max_length=120)
    description: str = Field(default="", max_length=300)
    startDate: str
    endDate: str
    location: str = Field(default="", max_length=160)
    eventType: str = Field(default="CHECK_IN", max_length=40)


class SettingsBody(BaseModel):
    notifications: bool
    weeklyDigest: bool
    language: str = Field(default="English")
    theme: str = Field(default="Editorial Earth")


def rank_for_xp(xp: int) -> str:
    tiers = [
        (0, "Spark"),
        (300, "Anchor"),
        (700, "Keeper"),
        (1200, "Navigator"),
        (1800, "Sentinel"),
        (2600, "Sovereign"),
    ]
    current = tiers[0][1]
    for threshold, label in tiers:
        if xp >= threshold:
            current = label
    return current


def aware_from_iso(value: str) -> datetime:
    parsed = datetime.fromisoformat(value)
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def media_url(relative_path: str) -> str:
    return f"/api/media/{relative_path}"


def normalize_media(entry: dict[str, Any]) -> dict[str, Any]:
    entry["media"] = entry.get("media", [])
    return entry


def get_user_snapshot(user_id: str) -> dict[str, Any] | None:
    return serialize(collection("users").find_one({"id": user_id}, {"_id": 0, "passwordHash": 0}))


def build_presence(user: dict[str, Any] | None) -> dict[str, Any] | None:
    if not user:
        return None
    last_active = user.get("lastActiveAt")
    if not last_active:
        return {"isOnline": False, "label": "Away", "lastActiveAt": None, "name": user.get("name")}
    last_active_at = aware_from_iso(last_active) if isinstance(last_active, str) else last_active
    seconds_since = max(0, int((utc_now() - last_active_at).total_seconds()))
    is_online = seconds_since <= 180
    if is_online:
        label = "Online now"
    elif seconds_since < 3600:
        label = f"Active {max(1, seconds_since // 60)} min ago"
    else:
        label = last_active_at.strftime("Active %b %d")
    return {
        "isOnline": is_online,
        "label": label,
        "lastActiveAt": last_active_at.isoformat(),
        "name": user.get("name"),
    }


def unread_filter(pair_id: str, user_id: str) -> dict[str, Any]:
    return {"pairId": pair_id, "userId": {"$ne": user_id}, "readBy": {"$ne": user_id}}


def get_notification_summary(pair: dict[str, Any] | None, user_id: str) -> dict[str, Any]:
    if not pair:
        return {"unreadMessages": 0, "latestUnread": None, "partnerPresence": None}
    partner = get_partner(pair, user_id)
    partner_user = get_user_snapshot(partner["id"]) if partner else None
    unread_count = collection("messages").count_documents(unread_filter(pair["id"], user_id))
    latest_unread = serialize(
        collection("messages").find_one(unread_filter(pair["id"], user_id), {"_id": 0}, sort=[("createdAt", -1)])
    )
    return {
        "unreadMessages": unread_count,
        "latestUnread": latest_unread,
        "partnerPresence": build_presence(partner_user),
    }


async def persist_uploads(files: list[UploadFile], pair_id: str) -> list[dict[str, Any]]:
    saved: list[dict[str, Any]] = []
    pair_dir = MEDIA_ROOT / pair_id
    pair_dir.mkdir(parents=True, exist_ok=True)

    for file in files:
        if not file.filename:
            continue
        content_type = file.content_type or "application/octet-stream"
        if not content_type.startswith(ALLOWED_UPLOAD_PREFIXES):
            raise HTTPException(status_code=400, detail="Only image and audio uploads are supported")
        extension = Path(file.filename).suffix or (".bin" if "/" not in content_type else f'.{content_type.split("/")[1]}')
        filename = f"{make_id()}{extension.lower()}"
        relative_path = f"{pair_id}/{filename}"
        destination = pair_dir / filename
        content = await file.read()
        destination.write_bytes(content)
        saved.append(
            {
                "id": make_id(),
                "name": file.filename,
                "contentType": content_type,
                "size": len(content),
                "url": media_url(relative_path),
            }
        )
    return saved


def get_pair_for_user(user_id: str) -> dict[str, Any] | None:
    return serialize(
        collection("pairs").find_one(
            {"userIds": user_id, "status": {"$in": ["ACTIVE", "PENDING"]}},
            {"_id": 0},
            sort=[("updatedAt", -1)],
        )
    )


def get_partner(pair: dict[str, Any], user_id: str) -> dict[str, Any] | None:
    return next((member for member in pair.get("members", []) if member["id"] != user_id), None)


def ensure_pair_extras(pair: dict[str, Any]) -> None:
    missions_collection = collection("missions")
    if missions_collection.count_documents({"pairId": pair["id"]}) == 0:
        now = utc_now()
        missions_collection.insert_many(
            [
                {
                    "id": make_id(),
                    "pairId": pair["id"],
                    "title": "Ten-minute emotional weather report",
                    "description": "Each of you shares one honest feeling, one friction point, and one request.",
                    "category": "Connection",
                    "xpReward": 80,
                    "completed": False,
                    "createdAt": now,
                    "dueAt": now + timedelta(days=3),
                },
                {
                    "id": make_id(),
                    "pairId": pair["id"],
                    "title": "Repair one unfinished moment",
                    "description": "Name one small moment that still has static and close it gently.",
                    "category": "Repair",
                    "xpReward": 120,
                    "completed": False,
                    "createdAt": now,
                    "dueAt": now + timedelta(days=6),
                },
                {
                    "id": make_id(),
                    "pairId": pair["id"],
                    "title": "Plan one protected hour together",
                    "description": "Choose a specific time this week and protect it from everything else.",
                    "category": "Rhythm",
                    "xpReward": 60,
                    "completed": False,
                    "createdAt": now,
                    "dueAt": now + timedelta(days=8),
                },
            ]
        )

    events_collection = collection("calendar_events")
    if events_collection.count_documents({"pairId": pair["id"]}) == 0:
        now = utc_now()
        events_collection.insert_many(
            [
                {
                    "id": make_id(),
                    "pairId": pair["id"],
                    "title": "Weekly check-in",
                    "description": "Keep this hour soft and honest.",
                    "location": "Shared space",
                    "type": "CHECK_IN",
                    "startDate": now + timedelta(days=2),
                    "endDate": now + timedelta(days=2, hours=1),
                    "createdAt": now,
                },
                {
                    "id": make_id(),
                    "pairId": pair["id"],
                    "title": "Next date ritual",
                    "description": "Do something low-pressure and intentionally fun.",
                    "location": "Out in the city",
                    "type": "DATE",
                    "startDate": now + timedelta(days=5),
                    "endDate": now + timedelta(days=5, hours=2),
                    "createdAt": now,
                },
            ]
        )

    vault_collection = collection("vault_entries")
    if vault_collection.count_documents({"pairId": pair["id"]}) == 0:
        vault_collection.insert_many(
            [
                {
                    "id": make_id(),
                    "pairId": pair["id"],
                    "title": "Why we began",
                    "description": "A shared reminder of what felt true at the beginning.",
                    "kind": "LETTER",
                    "media": [],
                    "date": utc_now(),
                },
                {
                    "id": make_id(),
                    "pairId": pair["id"],
                    "title": "The first real repair",
                    "description": "A marker for the moment you both chose understanding over distance.",
                    "kind": "MILESTONE",
                    "media": [],
                    "date": utc_now() - timedelta(days=2),
                },
            ]
        )


def compute_relational_state(pair: dict[str, Any]) -> dict[str, Any]:
    messages = serialize_many(
        list(collection("messages").find({"pairId": pair["id"]}, {"_id": 0}).sort("createdAt", -1).limit(30))
    )
    journals = serialize_many(
        list(collection("journal_entries").find({"pairId": pair["id"]}, {"_id": 0}).sort("createdAt", -1).limit(10))
    )
    completed_missions = collection("missions").count_documents({"pairId": pair["id"], "completed": True})

    if not messages:
        metrics = {"availability": 46, "alignment": 52, "activation": 34, "trust": 58}
        state = "DORMANT"
        explanation = "The space is formed, but it is still waiting for regular contact to take shape."
    else:
        now = utc_now()
        recent_days = max(1, (now - aware_from_iso(messages[0]["createdAt"])).days + 1)
        counts = {}
        for message in messages:
            counts[message["userId"]] = counts.get(message["userId"], 0) + 1
        values = list(counts.values()) or [1]
        balance_ratio = min(values) / max(values) if len(values) > 1 else 0.55
        availability = max(18, 100 - (recent_days * 9))
        alignment = min(95, int(45 + balance_ratio * 40 + len(journals) * 2))
        activation = min(95, int(len(messages) * 4 + completed_missions * 10))
        trust = min(96, int(50 + balance_ratio * 28 + len(journals) * 3 - recent_days * 2))
        metrics = {
            "availability": availability,
            "alignment": alignment,
            "activation": activation,
            "trust": trust,
        }

        if trust < 40:
            state = "TRUST_FRACTURED"
        elif availability < 34:
            state = "CAPACITY_BLOCKED"
        elif alignment < 56:
            state = "MISALIGNED"
        elif activation < 42:
            state = "DORMANT"
        else:
            state = "ALIGNED"

        explanation_map = {
            "ALIGNED": "There is motion in both directions. The conversation still has softness and momentum.",
            "DORMANT": "Nothing feels broken, but the space is cooling. A gentle act of initiation would matter.",
            "MISALIGNED": "You are both showing up, but not landing in the same meaning yet.",
            "CAPACITY_BLOCKED": "At least one of you looks stretched thin. Smaller asks will travel farther right now.",
            "TRUST_FRACTURED": "The channel needs visible repair, not just reassurance. Name the break and keep the next step concrete.",
        }
        explanation = explanation_map[state]

    collection("pairs").update_one(
        {"id": pair["id"]},
        {"$set": {"relationalState": state, "relationalMetrics": metrics, "updatedAt": utc_now()}},
    )
    pair["relationalState"] = state
    pair["relationalMetrics"] = metrics
    return {"state": state, "metrics": metrics, "explanation": explanation}


def award_xp(user_id: str, amount: int) -> dict[str, Any]:
    user = collection("users").find_one({"id": user_id}, {"_id": 0})
    new_xp = int(user.get("xp", 0)) + amount
    new_rank = rank_for_xp(new_xp)
    collection("users").update_one({"id": user_id}, {"$set": {"xp": new_xp, "rank": new_rank}})
    return {"xp": new_xp, "rank": new_rank}


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/auth/signup")
def signup(body: SignupBody) -> dict[str, Any]:
    if collection("users").find_one({"email": body.email.lower()}, {"_id": 0}):
        raise HTTPException(status_code=400, detail="An account with that email already exists")

    user = {
        "id": make_id(),
        "name": body.name.strip(),
        "email": body.email.lower(),
        "passwordHash": hash_password(body.password),
        "xp": 120,
        "rank": rank_for_xp(120),
        "createdAt": utc_now(),
    }
    collection("users").insert_one(user)
    collection("settings").insert_one(
        {
            "userId": user["id"],
            "notifications": True,
            "weeklyDigest": True,
            "language": "English",
            "theme": "Editorial Earth",
        }
    )
    return {"token": create_token(user), "user": serialize({key: value for key, value in user.items() if key != "passwordHash"})}


@app.post("/api/auth/login")
def login(body: LoginBody) -> dict[str, Any]:
    user = collection("users").find_one({"email": body.email.lower()}, {"_id": 0})
    if not user or not verify_password(body.password, user["passwordHash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"token": create_token(user), "user": serialize({key: value for key, value in user.items() if key != "passwordHash"})}


@app.get("/api/auth/me")
def me(current_user: dict[str, Any] = CurrentUser) -> dict[str, Any]:
    return {"user": current_user}


@app.get("/api/pairs/me")
def my_pair(current_user: dict[str, Any] = CurrentUser) -> dict[str, Any]:
    pair = get_pair_for_user(current_user["id"])
    if not pair:
        pending_invite = serialize(
            collection("invite_codes").find_one(
                {"inviterId": current_user["id"], "status": "PENDING", "expiresAt": {"$gt": utc_now()}},
                {"_id": 0},
                sort=[("createdAt", -1)],
            )
        )
        return {"pair": None, "invite": pending_invite}
    ensure_pair_extras(pair)
    return {"pair": pair, "invite": None}


@app.get("/api/pairs/invite-status")
def invite_status(current_user: dict[str, Any] = CurrentUser) -> dict[str, Any]:
    pair = get_pair_for_user(current_user["id"])
    if pair:
        return {"pair": pair, "invite": None}
    invite = serialize(
        collection("invite_codes").find_one(
            {"inviterId": current_user["id"], "status": "PENDING", "expiresAt": {"$gt": utc_now()}},
            {"_id": 0},
            sort=[("createdAt", -1)],
        )
    )
    return {"pair": None, "invite": invite}


@app.post("/api/pairs/invite")
def create_invite(current_user: dict[str, Any] = CurrentUser) -> dict[str, Any]:
    existing_pair = get_pair_for_user(current_user["id"])
    if existing_pair:
        raise HTTPException(status_code=400, detail="You already have an active connection")

    existing_invite = serialize(
        collection("invite_codes").find_one(
            {"inviterId": current_user["id"], "status": "PENDING", "expiresAt": {"$gt": utc_now()}},
            {"_id": 0},
            sort=[("createdAt", -1)],
        )
    )
    if existing_invite:
        return existing_invite

    code = make_id().replace("-", "")[:8].upper()
    invite = {
        "id": make_id(),
        "code": code,
        "inviterId": current_user["id"],
        "inviterName": current_user["name"],
        "status": "PENDING",
        "createdAt": utc_now(),
        "expiresAt": utc_now() + timedelta(days=7),
    }
    collection("invite_codes").insert_one(invite)
    return serialize(invite)


@app.post("/api/pairs/join")
def join_pair(body: JoinBody, current_user: dict[str, Any] = CurrentUser) -> dict[str, Any]:
    invite = serialize(collection("invite_codes").find_one({"code": body.code.upper()}, {"_id": 0}))
    if not invite:
        raise HTTPException(status_code=404, detail="Invite code not found")
    if invite["inviterId"] == current_user["id"]:
        raise HTTPException(status_code=400, detail="You cannot join your own invite")
    if aware_from_iso(invite["expiresAt"]) <= utc_now():
        raise HTTPException(status_code=400, detail="Invite code expired")
    if invite["status"] != "PENDING":
        raise HTTPException(status_code=400, detail="Invite code already used")

    inviter = serialize(collection("users").find_one({"id": invite["inviterId"]}, {"_id": 0, "passwordHash": 0}))
    pair = {
        "id": make_id(),
        "userIds": [invite["inviterId"], current_user["id"]],
        "members": [
            {"id": invite["inviterId"], "name": inviter["name"], "email": inviter["email"]},
            {"id": current_user["id"], "name": current_user["name"], "email": current_user["email"]},
        ],
        "status": "ACTIVE",
        "relationalState": "DORMANT",
        "relationalMetrics": {"availability": 46, "alignment": 52, "activation": 34, "trust": 58},
        "createdAt": utc_now(),
        "updatedAt": utc_now(),
    }
    collection("pairs").insert_one(pair)
    collection("invite_codes").update_one({"id": invite["id"]}, {"$set": {"status": "ACCEPTED", "pairId": pair["id"]}})
    ensure_pair_extras(pair)
    return {"pair": serialize(pair)}


@app.get("/api/dashboard")
def dashboard(current_user: dict[str, Any] = CurrentUser) -> dict[str, Any]:
    pair = get_pair_for_user(current_user["id"])
    if not pair:
        invite = serialize(
            collection("invite_codes").find_one(
                {"inviterId": current_user["id"], "status": "PENDING", "expiresAt": {"$gt": utc_now()}},
                {"_id": 0},
                sort=[("createdAt", -1)],
            )
        )
        return {"user": current_user, "pair": None, "invite": invite, "notifications": get_notification_summary(None, current_user["id"])}

    ensure_pair_extras(pair)
    state = compute_relational_state(pair)
    missions = serialize_many(list(collection("missions").find({"pairId": pair["id"]}, {"_id": 0}).sort("dueAt", 1).limit(3)))
    upcoming = serialize_many(list(collection("calendar_events").find({"pairId": pair["id"]}, {"_id": 0}).sort("startDate", 1).limit(2)))
    journal_count = collection("journal_entries").count_documents({"pairId": pair["id"]})
    message_count = collection("messages").count_documents({"pairId": pair["id"]})
    completed = collection("missions").count_documents({"pairId": pair["id"], "completed": True})

    return {
        "user": current_user,
        "pair": pair,
        "partner": get_partner(pair, current_user["id"]),
        "state": state,
        "stats": {
            "messages": message_count,
            "journalEntries": journal_count,
            "completedMissions": completed,
            "xp": current_user.get("xp", 0),
            "rank": current_user.get("rank", rank_for_xp(current_user.get("xp", 0))),
        },
        "notifications": get_notification_summary(pair, current_user["id"]),
        "missions": missions,
        "upcoming": upcoming,
    }


@app.get("/api/notifications/summary")
def notifications_summary(current_user: dict[str, Any] = CurrentUser) -> dict[str, Any]:
    pair = get_pair_for_user(current_user["id"])
    return get_notification_summary(pair, current_user["id"])


@app.get("/api/messages")
def get_messages(current_user: dict[str, Any] = CurrentUser) -> dict[str, Any]:
    pair = get_pair_for_user(current_user["id"])
    if not pair:
        return {"items": [], "partnerPresence": None, "unreadCount": 0}
    collection("messages").update_many(
        unread_filter(pair["id"], current_user["id"]),
        {"$addToSet": {"readBy": current_user["id"]}, "$set": {"updatedAt": utc_now()}},
    )
    docs = list(collection("messages").find({"pairId": pair["id"]}, {"_id": 0}).sort("createdAt", 1))
    notifications = get_notification_summary(pair, current_user["id"])
    return {"pair": pair, "items": serialize_many(docs), "partnerPresence": notifications["partnerPresence"], "unreadCount": notifications["unreadMessages"]}


@app.post("/api/messages")
def post_message(body: MessageBody, current_user: dict[str, Any] = CurrentUser) -> dict[str, Any]:
    pair = get_pair_for_user(current_user["id"])
    if not pair:
        raise HTTPException(status_code=400, detail="Create or join a pair first")
    message = {
        "id": make_id(),
        "pairId": pair["id"],
        "userId": current_user["id"],
        "userName": current_user["name"],
        "content": body.content.strip(),
        "readBy": [current_user["id"]],
        "createdAt": utc_now(),
    }
    collection("messages").insert_one(message)
    collection("pairs").update_one({"id": pair["id"]}, {"$set": {"updatedAt": utc_now()}})
    award_xp(current_user["id"], 12)
    return {"item": serialize(message)}


@app.post("/api/bently")
async def bently(body: BentlyBody, current_user: dict[str, Any] = CurrentUser) -> dict[str, Any]:
    pair = get_pair_for_user(current_user["id"])
    state = "DORMANT"
    partner_summary = "The user is reflecting alone right now."
    session_id = f"solo:{current_user['id']}"
    if pair:
        relational = compute_relational_state(pair)
        state = relational["state"]
        partner = get_partner(pair, current_user["id"])
        partner_summary = (
            f"This is a paired conversation between {current_user['name']} and {partner['name'] if partner else 'their partner'}. "
            f"Current relational explanation: {relational['explanation']}"
        )
        session_id = f"pair:{pair['id']}:{current_user['id']}"

    response = await generate_bently_response(session_id, body.message.strip(), state, partner_summary)
    xp_update = award_xp(current_user["id"], 24)
    return {"response": response, "state": state, "xp": xp_update["xp"], "rank": xp_update["rank"]}


@app.get("/api/bently/history")
def bently_history(current_user: dict[str, Any] = CurrentUser) -> dict[str, Any]:
    pair = get_pair_for_user(current_user["id"])
    session_id = f"solo:{current_user['id']}"
    if pair:
        session_id = f"pair:{pair['id']}:{current_user['id']}"
    docs = list(collection("bently_entries").find({"sessionId": session_id}, {"_id": 0}).sort("createdAt", 1))
    return {"items": serialize_many(docs)}


@app.get("/api/journal")
def journal(current_user: dict[str, Any] = CurrentUser) -> dict[str, Any]:
    pair = get_pair_for_user(current_user["id"])
    filters: dict[str, Any] = {"userId": current_user["id"]}
    if pair:
        filters["pairId"] = pair["id"]
    entries = serialize_many(list(collection("journal_entries").find(filters, {"_id": 0}).sort("createdAt", -1)))
    return {"items": entries}


@app.post("/api/journal")
def create_journal_entry(body: JournalBody, current_user: dict[str, Any] = CurrentUser) -> dict[str, Any]:
    pair = get_pair_for_user(current_user["id"])
    entry = {
        "id": make_id(),
        "pairId": pair["id"] if pair else None,
        "userId": current_user["id"],
        "prompt": body.prompt.strip(),
        "content": body.content.strip(),
        "mood": body.mood,
        "createdAt": utc_now(),
    }
    collection("journal_entries").insert_one(entry)
    award_xp(current_user["id"], 18)
    return {"item": serialize(entry)}


@app.get("/api/missions")
def missions(current_user: dict[str, Any] = CurrentUser) -> dict[str, Any]:
    pair = get_pair_for_user(current_user["id"])
    if not pair:
        return {"items": []}
    ensure_pair_extras(pair)
    docs = list(collection("missions").find({"pairId": pair["id"]}, {"_id": 0}).sort("dueAt", 1))
    return {"items": serialize_many(docs)}


@app.patch("/api/missions/{mission_id}")
def complete_mission(mission_id: str, current_user: dict[str, Any] = CurrentUser) -> dict[str, Any]:
    mission = serialize(collection("missions").find_one({"id": mission_id}, {"_id": 0}))
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    if not mission.get("completed"):
        collection("missions").update_one(
            {"id": mission_id},
            {"$set": {"completed": True, "completedBy": current_user["id"], "completedAt": utc_now()}},
        )
        award_xp(current_user["id"], mission.get("xpReward", 0))
    updated = serialize(collection("missions").find_one({"id": mission_id}, {"_id": 0}))
    return {"item": updated}


@app.get("/api/calendar")
def calendar(current_user: dict[str, Any] = CurrentUser) -> dict[str, Any]:
    pair = get_pair_for_user(current_user["id"])
    if not pair:
        return {"items": []}
    ensure_pair_extras(pair)
    items = serialize_many(list(collection("calendar_events").find({"pairId": pair["id"]}, {"_id": 0}).sort("startDate", 1)))
    return {"items": items}


@app.post("/api/calendar")
def create_event(body: CalendarBody, current_user: dict[str, Any] = CurrentUser) -> dict[str, Any]:
    pair = get_pair_for_user(current_user["id"])
    if not pair:
        raise HTTPException(status_code=400, detail="Create or join a pair first")
    item = {
        "id": make_id(),
        "pairId": pair["id"],
        "title": body.title.strip(),
        "description": body.description.strip(),
        "location": body.location.strip(),
        "type": body.eventType,
        "startDate": datetime.fromisoformat(body.startDate),
        "endDate": datetime.fromisoformat(body.endDate),
        "createdAt": utc_now(),
    }
    collection("calendar_events").insert_one(item)
    return {"item": serialize(item)}


@app.get("/api/vault")
def vault(current_user: dict[str, Any] = CurrentUser) -> dict[str, Any]:
    pair = get_pair_for_user(current_user["id"])
    if not pair:
        return {"items": []}
    ensure_pair_extras(pair)
    docs = [normalize_media(item) for item in serialize_many(list(collection("vault_entries").find({"pairId": pair["id"]}, {"_id": 0}).sort("date", -1)))]
    return {"items": docs}


@app.post("/api/vault")
async def create_vault_entry(
    title: str = Form(...),
    description: str = Form(""),
    kind: str = Form("MOMENT"),
    files: list[UploadFile] = File(default=[]),
    current_user: dict[str, Any] = CurrentUser,
) -> dict[str, Any]:
    pair = get_pair_for_user(current_user["id"])
    if not pair:
        raise HTTPException(status_code=400, detail="Create or join a pair first")
    media = await persist_uploads(files, pair["id"])
    if not media and not description.strip():
        raise HTTPException(status_code=400, detail="Add media or a description before saving")

    entry = {
        "id": make_id(),
        "pairId": pair["id"],
        "title": title.strip(),
        "description": description.strip(),
        "kind": kind.strip().upper() or "MOMENT",
        "media": media,
        "createdBy": current_user["id"],
        "createdByName": current_user["name"],
        "date": utc_now(),
    }
    collection("vault_entries").insert_one(entry)
    xp_update = award_xp(current_user["id"], 28)
    clean_entry = normalize_media(serialize(entry))
    return {"item": clean_entry, "xp": xp_update["xp"], "rank": xp_update["rank"]}


@app.get("/api/settings")
def settings(current_user: dict[str, Any] = CurrentUser) -> dict[str, Any]:
    user_settings = serialize(collection("settings").find_one({"userId": current_user["id"]}, {"_id": 0}))
    return {"settings": user_settings}


@app.put("/api/settings")
def update_settings(body: SettingsBody, current_user: dict[str, Any] = CurrentUser) -> dict[str, Any]:
    payload = body.model_dump()
    payload["userId"] = current_user["id"]
    collection("settings").update_one({"userId": current_user["id"]}, {"$set": payload}, upsert=True)
    return {"settings": serialize(collection("settings").find_one({"userId": current_user["id"]}, {"_id": 0}))}


@app.post("/api/pairs/dissolve")
def dissolve_pair(current_user: dict[str, Any] = CurrentUser) -> dict[str, Any]:
    pair = get_pair_for_user(current_user["id"])
    if not pair:
        raise HTTPException(status_code=404, detail="No active pair found")
    collection("pairs").update_one({"id": pair["id"]}, {"$set": {"status": "DISSOLVED", "updatedAt": utc_now()}})
    return {"success": True}
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, status
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import secrets
import bcrypt
import requests
try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
except ImportError:  # pragma: no cover
    LlmChat = None
    UserMessage = None


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class UserResponse(BaseModel):
    user_id: str
    email: EmailStr
    name: str
    picture: Optional[str] = None
    role: str = "member"
    bio: str = ""
    location: str = ""
    communication_style: str = "Reflective"
    values: List[str] = Field(default_factory=list)
    interests: List[str] = Field(default_factory=list)
    goals: List[str] = Field(default_factory=list)
    created_at: str


class AuthSignup(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class AuthLogin(BaseModel):
    email: EmailStr
    password: str


class GoogleSessionRequest(BaseModel):
    session_id: str = Field(min_length=8)


class ProfileUpdate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=80)
    bio: Optional[str] = Field(default=None, max_length=280)
    location: Optional[str] = Field(default=None, max_length=80)
    communication_style: Optional[str] = Field(default=None, max_length=60)
    values: Optional[List[str]] = None
    interests: Optional[List[str]] = None
    goals: Optional[List[str]] = None


class DiscussionCreate(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    body: str = Field(min_length=3, max_length=1200)
    tag: str = Field(default="common-ground", max_length=40)


class CommentCreate(BaseModel):
    body: str = Field(min_length=1, max_length=600)


class InviteAccept(BaseModel):
    invite_code: str = Field(min_length=4, max_length=12)


class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=1200)


class BentlyPrompt(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    mode: str = "solo"


class JournalCreate(BaseModel):
    title: str = Field(default="Reflection", max_length=120)
    content: str = Field(min_length=1, max_length=3000)
    sentiment: str = Field(default="neutral", max_length=40)


class CalendarCreate(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    description: str = Field(default="", max_length=400)
    date: str
    event_type: str = Field(default="checkin", max_length=40)


class VaultCreate(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    category: str = Field(default="Memory", max_length=40)
    note: str = Field(default="", max_length=700)


class SettingsUpdate(BaseModel):
    notifications_enabled: Optional[bool] = None
    email_digest: Optional[bool] = None
    language: Optional[str] = None


class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatusCheckCreate(BaseModel):
    client_name: str


DEMO_MATCHES = [
    {
        "user_id": "demo_maya",
        "name": "Maya Chen",
        "email": "maya@example.com",
        "picture": "https://images.unsplash.com/photo-1701728667207-54b43dbdab97?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85",
        "bio": "Community facilitator focused on honest listening and calmer conflict repair.",
        "location": "Brooklyn, NY",
        "communication_style": "Listener",
        "values": ["trust", "family", "accountability", "growth"],
        "interests": ["neighborhood circles", "journaling", "mediation"],
        "goals": ["build safer conversations", "practice repair"],
    },
    {
        "user_id": "demo_jordan",
        "name": "Jordan Ellis",
        "email": "jordan@example.com",
        "picture": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85",
        "bio": "Organizer who helps groups find shared language before decisions get tense.",
        "location": "Austin, TX",
        "communication_style": "Direct",
        "values": ["transparency", "growth", "shared purpose", "trust"],
        "interests": ["civic projects", "mutual aid", "dialogue"],
        "goals": ["map shared values", "reduce misunderstandings"],
    },
    {
        "user_id": "demo_samira",
        "name": "Samira Patel",
        "email": "samira@example.com",
        "picture": "https://images.unsplash.com/photo-1609436132311-e4b0c9370469?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85",
        "bio": "Coach for teams and couples practicing consent, boundaries, and repair rituals.",
        "location": "Chicago, IL",
        "communication_style": "Reflective",
        "values": ["boundaries", "care", "accountability", "clarity"],
        "interests": ["relationship design", "workshops", "community care"],
        "goals": ["make conflict useful", "create repeatable check-ins"],
    },
]


SAMPLE_POSTS = [
    {
        "post_id": "sample_001",
        "title": "How do you restart a hard conversation without blame?",
        "body": "Our group pauses when things get tense. I want a way to come back to the topic without everyone bracing for impact.",
        "tag": "repair",
        "author_name": "Maya Chen",
        "author_id": "demo_maya",
        "comment_count": 2,
        "created_at": "2026-01-08T14:00:00+00:00",
        "is_sample": True,
    },
    {
        "post_id": "sample_002",
        "title": "What values should be named before a shared decision?",
        "body": "I am testing a pre-decision ritual: each person names the value they are protecting before offering a solution.",
        "tag": "values",
        "author_name": "Jordan Ellis",
        "author_id": "demo_jordan",
        "comment_count": 1,
        "created_at": "2026-01-07T18:30:00+00:00",
        "is_sample": True,
    },
]


DEFAULT_MISSIONS = [
    {"mission_id": "mission_difficult_conversation", "title": "Have a difficult conversation", "description": "Discuss something that has been on your mind with care and specificity.", "difficulty": "medium", "xp_reward": 50, "completed": False, "due_date": "2026-06-03"},
    {"mission_id": "mission_daily_checkin", "title": "Daily check-in", "description": "Spend 10 minutes asking what feels heavy and what feels hopeful.", "difficulty": "easy", "xp_reward": 25, "completed": False, "due_date": "2026-05-25"},
    {"mission_id": "mission_repair_past", "title": "Repair one past rupture", "description": "Pick one unresolved moment and make one keepable repair commitment.", "difficulty": "hard", "xp_reward": 100, "completed": False, "due_date": "2026-06-10"},
]


RANKS = [
    {"level": 1, "rank": "Initiate", "xp": 0},
    {"level": 3, "rank": "Advocate", "xp": 500},
    {"level": 5, "rank": "Navigator", "xp": 1500},
    {"level": 8, "rank": "Sentinel", "xp": 3000},
    {"level": 10, "rank": "Sovereign", "xp": 5000},
]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def sanitize_list(values: Optional[List[str]]) -> List[str]:
    if not values:
        return []
    cleaned = []
    for value in values[:8]:
        item = value.strip().lower()
        if item and item not in cleaned:
            cleaned.append(item[:40])
    return cleaned


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def serialize_user(doc: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "user_id": doc["user_id"],
        "email": doc["email"],
        "name": doc.get("name") or doc["email"].split("@")[0],
        "picture": doc.get("picture"),
        "role": doc.get("role", "member"),
        "bio": doc.get("bio", ""),
        "location": doc.get("location", ""),
        "communication_style": doc.get("communication_style", "Reflective"),
        "values": doc.get("values", []),
        "interests": doc.get("interests", []),
        "goals": doc.get("goals", []),
        "created_at": doc.get("created_at", now_iso()),
    }


def clean_bently_text(text: str) -> str:
    return (
        text.replace("**", "")
        .replace("*\"", "\"")
        .replace("\n- ", "\n")
        .replace("\n\n", "\n")
        .strip()
    )


def set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/",
    )


async def create_session(response: Response, user_id: str, token: Optional[str] = None) -> str:
    session_token = token or f"sess_{secrets.token_urlsafe(32)}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.update_one(
        {"session_token": session_token},
        {
            "$set": {
                "session_token": session_token,
                "user_id": user_id,
                "expires_at": expires_at,
                "created_at": datetime.now(timezone.utc),
            }
        },
        upsert=True,
    )
    set_session_cookie(response, session_token)
    return session_token


async def get_current_user(request: Request) -> Dict[str, Any]:
    session_token = request.cookies.get("session_token")
    auth_header = request.headers.get("Authorization", "")
    if not session_token and auth_header.startswith("Bearer "):
        session_token = auth_header.replace("Bearer ", "", 1).strip()
    if not session_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    session_doc = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session not found")

    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        await db.user_sessions.delete_one({"session_token": session_token})
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired")

    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0, "password_hash": 0})
    if not user_doc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return serialize_user(user_doc)


async def admin_required(request: Request) -> Dict[str, Any]:
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "CommonGround API is ready", "app": "AxMCommonGround"}


@api_router.post("/auth/signup")
async def signup(input: AuthSignup, response: Response):
    existing = await db.users.find_one({"email": input.email.lower()}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=409, detail="An account already exists for this email")

    real_user_count = await db.users.count_documents({"is_demo": {"$ne": True}})
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    doc = {
        "user_id": user_id,
        "email": input.email.lower(),
        "name": input.name.strip(),
        "password_hash": hash_password(input.password),
        "picture": None,
        "role": "admin" if real_user_count == 0 else "member",
        "bio": "",
        "location": "",
        "communication_style": "Reflective",
        "values": [],
        "interests": [],
        "goals": [],
        "created_at": now_iso(),
        "auth_provider": "password",
    }
    await db.users.insert_one(doc)
    session_token = await create_session(response, user_id)
    return {"user": serialize_user(doc), "session_token": session_token}


@api_router.post("/auth/login")
async def login(input: AuthLogin, response: Response):
    user_doc = await db.users.find_one({"email": input.email.lower()}, {"_id": 0})
    if not user_doc or not user_doc.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_password(input.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    session_token = await create_session(response, user_doc["user_id"])
    return {"user": serialize_user(user_doc), "session_token": session_token}


@api_router.post("/auth/google/session")
async def google_session(input: GoogleSessionRequest, response: Response):
    auth_response = requests.get(
        "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
        headers={"X-Session-ID": input.session_id},
        timeout=15,
    )
    if auth_response.status_code != 200:
        raise HTTPException(status_code=401, detail="Google session could not be verified")
    session_data = auth_response.json()
    email = session_data.get("email", "").lower()
    if not email:
        raise HTTPException(status_code=401, detail="Google account email missing")

    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": session_data.get("name") or existing.get("name"), "picture": session_data.get("picture") or existing.get("picture"), "auth_provider": "google"}},
        )
    else:
        real_user_count = await db.users.count_documents({"is_demo": {"$ne": True}})
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one(
            {
                "user_id": user_id,
                "email": email,
                "name": session_data.get("name") or email.split("@")[0],
                "picture": session_data.get("picture"),
                "role": "admin" if real_user_count == 0 else "member",
                "bio": "",
                "location": "",
                "communication_style": "Reflective",
                "values": [],
                "interests": [],
                "goals": [],
                "created_at": now_iso(),
                "auth_provider": "google",
            }
        )
    session_token = await create_session(response, user_id, session_data.get("session_token"))
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    return {"user": serialize_user(user_doc), "session_token": session_token}


@api_router.get("/auth/me", response_model=UserResponse)
async def auth_me(request: Request):
    return await get_current_user(request)


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    auth_header = request.headers.get("Authorization", "")
    if not session_token and auth_header.startswith("Bearer "):
        session_token = auth_header.replace("Bearer ", "", 1).strip()
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie(key="session_token", path="/", secure=True, samesite="none")
    return {"success": True}


@api_router.get("/profile", response_model=UserResponse)
async def get_profile(request: Request):
    return await get_current_user(request)


@api_router.patch("/profile", response_model=UserResponse)
async def update_profile(input: ProfileUpdate, request: Request):
    user = await get_current_user(request)
    updates: Dict[str, Any] = {}
    for field in ["name", "bio", "location", "communication_style"]:
        value = getattr(input, field)
        if value is not None:
            updates[field] = value.strip()
    for field in ["values", "interests", "goals"]:
        value = getattr(input, field)
        if value is not None:
            updates[field] = sanitize_list(value)
    updates["updated_at"] = now_iso()
    if updates:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": updates})
    user_doc = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "password_hash": 0})
    return serialize_user(user_doc)


@api_router.get("/matches")
async def get_matches(request: Request):
    user = await get_current_user(request)
    current_values = set(user.get("values", []))
    current_interests = set(user.get("interests", []))
    real_users = await db.users.find({"user_id": {"$ne": user["user_id"]}}, {"_id": 0, "password_hash": 0}).to_list(50)
    candidates = [serialize_user(doc) for doc in real_users] + DEMO_MATCHES

    scored = []
    for candidate in candidates:
        values = set(candidate.get("values", []))
        interests = set(candidate.get("interests", []))
        shared_values = sorted(current_values.intersection(values))
        shared_interests = sorted(current_interests.intersection(interests))
        score = min(98, 42 + (len(shared_values) * 15) + (len(shared_interests) * 10))
        if not current_values and not current_interests:
            score = 68 if candidate["user_id"].startswith("demo_") else 55
        scored.append({**candidate, "score": score, "shared_values": shared_values, "shared_interests": shared_interests})
    scored.sort(key=lambda item: item["score"], reverse=True)
    return {"items": scored[:8]}


@api_router.get("/discussions")
async def list_discussions(request: Request):
    await get_current_user(request)
    posts = await db.discussions.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"items": posts + SAMPLE_POSTS}


@api_router.post("/discussions")
async def create_discussion(input: DiscussionCreate, request: Request):
    user = await get_current_user(request)
    post = {
        "post_id": f"post_{uuid.uuid4().hex[:12]}",
        "title": input.title.strip(),
        "body": input.body.strip(),
        "tag": input.tag.strip().lower() or "common-ground",
        "author_id": user["user_id"],
        "author_name": user["name"],
        "comment_count": 0,
        "created_at": now_iso(),
        "is_sample": False,
    }
    await db.discussions.insert_one(post.copy())
    return post


@api_router.get("/discussions/{post_id}/comments")
async def list_comments(post_id: str, request: Request):
    await get_current_user(request)
    comments = await db.comments.find({"post_id": post_id}, {"_id": 0}).sort("created_at", 1).to_list(100)
    if post_id == "sample_001":
        comments = [
            {"comment_id": "sample_c1", "post_id": post_id, "author_name": "Samira Patel", "body": "Try naming the shared intention first: I want us to understand this, not win it.", "created_at": "2026-01-08T15:10:00+00:00"},
            {"comment_id": "sample_c2", "post_id": post_id, "author_name": "Jordan Ellis", "body": "A two-minute reset helps: each person says what they heard before responding.", "created_at": "2026-01-08T16:00:00+00:00"},
        ] + comments
    elif post_id == "sample_002":
        comments = [{"comment_id": "sample_c3", "post_id": post_id, "author_name": "Maya Chen", "body": "Safety, fairness, and time are usually the hidden values in our room.", "created_at": "2026-01-07T19:00:00+00:00"}] + comments
    return {"items": comments}


@api_router.post("/discussions/{post_id}/comments")
async def create_comment(post_id: str, input: CommentCreate, request: Request):
    user = await get_current_user(request)
    comment = {
        "comment_id": f"comment_{uuid.uuid4().hex[:12]}",
        "post_id": post_id,
        "author_id": user["user_id"],
        "author_name": user["name"],
        "body": input.body.strip(),
        "created_at": now_iso(),
    }
    await db.comments.insert_one(comment.copy())
    await db.discussions.update_one({"post_id": post_id}, {"$inc": {"comment_count": 1}})
    return comment


@api_router.get("/admin/overview")
async def admin_overview(request: Request):
    await admin_required(request)
    users_count = await db.users.count_documents({})
    discussions_count = await db.discussions.count_documents({})
    comments_count = await db.comments.count_documents({})
    sessions_count = await db.user_sessions.count_documents({})
    recent_users = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(5)
    return {
        "stats": {
            "members": users_count,
            "discussions": discussions_count + len(SAMPLE_POSTS),
            "comments": comments_count + 3,
            "active_sessions": sessions_count,
        },
        "recent_users": [serialize_user(doc) for doc in recent_users],
        "health": [
            {"label": "Trust signals", "value": 82},
            {"label": "Repair velocity", "value": 74},
            {"label": "Common-ground clarity", "value": 88},
        ],
    }


@api_router.post("/pairs/invite")
async def create_invite(request: Request):
    user = await get_current_user(request)
    invite_code = secrets.token_hex(4).upper()
    invite = {
        "invite_code": invite_code,
        "inviter_id": user["user_id"],
        "status": "PENDING",
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": now_iso(),
    }
    await db.invites.insert_one(invite.copy())
    return invite


@api_router.post("/pairs/join")
async def join_pair(input: InviteAccept, request: Request):
    user = await get_current_user(request)
    invite = await db.invites.find_one({"invite_code": input.invite_code.upper(), "status": "PENDING"}, {"_id": 0})
    if not invite:
        raise HTTPException(status_code=404, detail="Invite code not found or already used")
    if invite["inviter_id"] == user["user_id"]:
        raise HTTPException(status_code=400, detail="You cannot join your own invite")
    pair = {
        "pair_id": f"pair_{uuid.uuid4().hex[:12]}",
        "user1_id": invite["inviter_id"],
        "user2_id": user["user_id"],
        "status": "ACTIVE",
        "relational_state": "DORMANT",
        "created_at": now_iso(),
    }
    await db.pairs.insert_one(pair.copy())
    await db.invites.update_one({"invite_code": input.invite_code.upper()}, {"$set": {"status": "ACCEPTED", "pair_id": pair["pair_id"]}})
    return pair


@api_router.get("/pairs/me")
async def get_my_pair(request: Request):
    user = await get_current_user(request)
    pair = await db.pairs.find_one({"$or": [{"user1_id": user["user_id"]}, {"user2_id": user["user_id"]}], "status": "ACTIVE"}, {"_id": 0})
    if not pair:
        return {"pair": None}
    partner_id = pair["user2_id"] if pair["user1_id"] == user["user_id"] else pair["user1_id"]
    partner = await db.users.find_one({"user_id": partner_id}, {"_id": 0, "password_hash": 0})
    return {"pair": pair, "partner": serialize_user(partner) if partner else None}


@api_router.get("/messages")
async def list_messages(request: Request):
    user = await get_current_user(request)
    pair = await db.pairs.find_one({"$or": [{"user1_id": user["user_id"]}, {"user2_id": user["user_id"]}], "status": "ACTIVE"}, {"_id": 0})
    if not pair:
        return {"items": []}
    items = await db.messages.find({"pair_id": pair["pair_id"]}, {"_id": 0}).sort("created_at", 1).to_list(200)
    return {"items": items, "pair": pair}


@api_router.post("/messages")
async def send_message(input: MessageCreate, request: Request):
    user = await get_current_user(request)
    pair = await db.pairs.find_one({"$or": [{"user1_id": user["user_id"]}, {"user2_id": user["user_id"]}], "status": "ACTIVE"}, {"_id": 0})
    if not pair:
        raise HTTPException(status_code=400, detail="Create or join a pair before sending direct messages")
    message = {"message_id": f"msg_{uuid.uuid4().hex[:12]}", "pair_id": pair["pair_id"], "user_id": user["user_id"], "author_name": user["name"], "content": input.content.strip(), "created_at": now_iso()}
    await db.messages.insert_one(message.copy())
    return message


@api_router.post("/bently")
async def bently_prompt(input: BentlyPrompt, request: Request):
    user = await get_current_user(request)
    system = "You are Bently, CommonGround's relational communication mediator. Be direct, grounded, non-therapeutic, and under 170 words. Name the pattern, protect both sides, and offer one concrete next sentence."
    fallback = f"I hear the pressure in this: {input.message}. A cleaner opening is: ‘I want to understand this without making either of us the problem. The value I’m trying to protect is trust. Can we slow down and each name what we need before we decide?’"
    response_text = fallback
    provider = "local-guidance"
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if LlmChat and UserMessage and api_key:
        try:
            chat = LlmChat(api_key=api_key, session_id=f"bently-{user['user_id']}", system_message=system).with_model("anthropic", "claude-sonnet-4-6")
            response_text = clean_bently_text(await chat.send_message(UserMessage(text=input.message)))
            provider = "claude-sonnet-4-6"
        except Exception as exc:
            logger.warning("Bently AI fallback used: %s", exc)
    entry = {"entry_id": f"bently_{uuid.uuid4().hex[:12]}", "user_id": user["user_id"], "prompt": input.message, "response": response_text, "mode": input.mode, "provider": provider, "xp_earned": 20, "created_at": now_iso()}
    await db.bently_entries.insert_one(entry.copy())
    await db.users.update_one({"user_id": user["user_id"]}, {"$inc": {"xp": 20}})
    return entry


@api_router.get("/missions")
async def list_missions(request: Request):
    user = await get_current_user(request)
    saved = await db.missions.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(100)
    if not saved:
        docs = [{**mission, "user_id": user["user_id"], "created_at": now_iso()} for mission in DEFAULT_MISSIONS]
        await db.missions.insert_many([doc.copy() for doc in docs])
        saved = docs
    return {"items": saved}


@api_router.post("/missions/{mission_id}/toggle")
async def toggle_mission(mission_id: str, request: Request):
    user = await get_current_user(request)
    mission = await db.missions.find_one({"user_id": user["user_id"], "mission_id": mission_id}, {"_id": 0})
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    completed = not mission.get("completed", False)
    await db.missions.update_one({"user_id": user["user_id"], "mission_id": mission_id}, {"$set": {"completed": completed, "completed_at": now_iso() if completed else None}})
    if completed:
        await db.users.update_one({"user_id": user["user_id"]}, {"$inc": {"xp": mission.get("xp_reward", 0)}})
        await db.xp_events.insert_one({"event_id": f"xp_{uuid.uuid4().hex[:12]}", "user_id": user["user_id"], "source": mission["title"], "amount": mission.get("xp_reward", 0), "created_at": now_iso()})
    return {**mission, "completed": completed}


@api_router.get("/xp")
async def get_xp(request: Request):
    user = await get_current_user(request)
    doc = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "password_hash": 0})
    xp = doc.get("xp", 0)
    current = RANKS[0]
    for rank in RANKS:
        if xp >= rank["xp"]:
            current = rank
    next_rank = next((rank for rank in RANKS if rank["xp"] > xp), None)
    events = await db.xp_events.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(20)
    return {"current_xp": xp, "current_rank": current, "next_rank": next_rank, "rank_ladder": RANKS, "events": events}


@api_router.get("/journal")
async def list_journal(request: Request):
    user = await get_current_user(request)
    entries = await db.journal.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    if not entries:
        entries = [{"entry_id": "sample_journal", "user_id": user["user_id"], "title": "Reflection on a better conversation", "content": "Today I noticed that naming the value first made the rest of the conversation less defensive.", "sentiment": "hopeful", "created_at": now_iso()}]
    return {"items": entries}


@api_router.post("/journal")
async def create_journal(input: JournalCreate, request: Request):
    user = await get_current_user(request)
    entry = {"entry_id": f"journal_{uuid.uuid4().hex[:12]}", "user_id": user["user_id"], "title": input.title.strip(), "content": input.content.strip(), "sentiment": input.sentiment.strip().lower(), "created_at": now_iso()}
    await db.journal.insert_one(entry.copy())
    await db.users.update_one({"user_id": user["user_id"]}, {"$inc": {"xp": 15}})
    await db.xp_events.insert_one({"event_id": f"xp_{uuid.uuid4().hex[:12]}", "user_id": user["user_id"], "source": "Journal entry written", "amount": 15, "created_at": now_iso()})
    return entry


@api_router.get("/calendar")
async def list_calendar(request: Request):
    user = await get_current_user(request)
    events = await db.calendar_events.find({"user_id": user["user_id"]}, {"_id": 0}).sort("date", 1).to_list(100)
    if not events:
        events = [
            {"event_id": "sample_checkin", "user_id": user["user_id"], "title": "Weekly check-in", "description": "Name one thing working and one thing needing care.", "date": "2026-05-28", "event_type": "checkin"},
            {"event_id": "sample_mission", "user_id": user["user_id"], "title": "Mission: repair one rupture", "description": "Make one observable commitment.", "date": "2026-06-03", "event_type": "mission"},
        ]
    return {"items": events}


@api_router.post("/calendar")
async def create_calendar(input: CalendarCreate, request: Request):
    user = await get_current_user(request)
    event = {"event_id": f"event_{uuid.uuid4().hex[:12]}", "user_id": user["user_id"], "title": input.title.strip(), "description": input.description.strip(), "date": input.date, "event_type": input.event_type.strip().lower(), "created_at": now_iso()}
    await db.calendar_events.insert_one(event.copy())
    return event


@api_router.get("/vault")
async def list_vault(request: Request):
    user = await get_current_user(request)
    items = await db.vault_items.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"items": items, "categories": [{"title": "Memories", "count": 24}, {"title": "Milestones", "count": 8}, {"title": "Letters", "count": 5}, {"title": "Goals", "count": 3}]}


@api_router.post("/vault")
async def create_vault(input: VaultCreate, request: Request):
    user = await get_current_user(request)
    item = {"item_id": f"vault_{uuid.uuid4().hex[:12]}", "user_id": user["user_id"], "title": input.title.strip(), "category": input.category.strip(), "note": input.note.strip(), "created_at": now_iso()}
    await db.vault_items.insert_one(item.copy())
    return item


@api_router.get("/settings")
async def get_settings(request: Request):
    user = await get_current_user(request)
    settings = await db.settings.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not settings:
        settings = {"user_id": user["user_id"], "notifications_enabled": True, "email_digest": True, "language": "en"}
    return settings


@api_router.patch("/settings")
async def update_settings(input: SettingsUpdate, request: Request):
    user = await get_current_user(request)
    updates = {k: v for k, v in input.model_dump().items() if v is not None}
    updates["updated_at"] = now_iso()
    await db.settings.update_one({"user_id": user["user_id"]}, {"$set": {**updates, "user_id": user["user_id"]}}, upsert=True)
    return await db.settings.find_one({"user_id": user["user_id"]}, {"_id": 0})

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
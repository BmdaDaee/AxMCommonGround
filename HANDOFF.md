# AxM CommonGround — AI Handoff Document

**Date:** August 3, 2026
**Prepared by:** Manus (previous AI session)
**For:** Claude / ChatGPT / Gemini to continue
**Repo:** `BmdaDaee/AxMCommonGround` (GitHub, `main` branch)
**Live PWA:** https://axmcommongrd-krmyjl7h.manus.space (scaffold only — needs full UI build)
**EAS Android Build:** https://expo.dev/accounts/cursedanomaly/projects/commonground/builds/31d80a9b-9dc0-4ad8-b615-66ec616317c4

---

## 1. Project Overview

AxM CommonGround is a **relationship operating system** for intentional couples. It is a React Native / Expo monorepo with:

- **Mobile app** (Expo Router, React Native) — `packages/mobile`
- **Backend API** (tRPC + Fastify + Drizzle ORM) — `packages/server`
- **Shared types/enums** — `packages/shared`
- **Database** — Supabase (PostgreSQL), live and seeded
- **AI** — Venice (primary, for DeeplyUs), Groq (fast mediation), Claude (analysis)
- **PWA** — separate Manus WebDev project (React 19 + Tailwind 4 + Wouter), scaffold only

---

## 2. What Was Built This Session (All Committed to `main`)

### Commits in Order

| Commit | Description |
|--------|-------------|
| `0febef49` | feat(sparks): schema + tRPC router + static React Native UI |
| `fdb369fc` | feat(sparks): seed templates + execution script |
| `046099c6` | fix(bently): strip NVC therapy-speak from AI prompt |
| `aeb1147e` | fix(bently): remove "Listen lovely / Listen boo" catchphrases |
| `b5871c28` | feat(sparks): wire live tRPC data — full state machine |
| `a05c0e98` | feat(sparks): DeeplyUs gateway toggle + full visual vibe shift |
| `8c70c17a` | feat(messages): fix hardcoded pairId + Bently real-time mediation AI trigger |
| `91564b3f` | feat(dashboard): Relational Vibe Dashboard + Hero Card + Quick Actions |
| `9438a8e3` | feat(deeply-us): full DeeplyUs module — schema, router, seed data, 6 mobile screens |

---

## 3. Monorepo Structure

```
AxMCommonGround/
├── packages/
│   ├── mobile/                        # Expo React Native app
│   │   ├── app/(app)/                 # Expo Router screens (authenticated)
│   │   │   ├── dashboard.tsx          # ✅ Vibe Gauge Hero Card + Quick Actions
│   │   │   ├── messages.tsx           # ✅ Live chat + Bently mediation rendering
│   │   │   ├── sparks/index.tsx       # ✅ Sparks + DeeplyUs toggle + state machine
│   │   │   └── deeply-us/
│   │   │       ├── unlock.tsx         # ✅ Age + consent gate (mutual opt-in)
│   │   │       ├── index.tsx          # ✅ DeeplyUs feature hub
│   │   │       ├── chat.tsx           # ✅ Venice-powered Bently chat
│   │   │       ├── prompts.tsx        # ✅ Intimate sparks with blind reveal
│   │   │       ├── exercises.tsx      # ✅ Guided exercises + XP
│   │   │       └── desire-map.tsx     # ✅ Yes/No/Maybe list + partner comparison
│   │   ├── src/lib/theme.ts           # getTheme(isDeeplyUs: boolean) — already built
│   │   ├── app.json                   # Expo config (owner: cursedanomaly, projectId: 1cd26756)
│   │   └── eas.json                   # EAS build profiles (sideload = APK, preview, production)
│   ├── server/
│   │   ├── drizzle/schema.ts          # ✅ Full schema (see Section 5)
│   │   ├── src/routers/
│   │   │   ├── index.ts               # ✅ All routers registered
│   │   │   ├── sparks.ts              # ✅ getDailySparks + submitAnswer
│   │   │   ├── messages.ts            # ✅ sendMessage + Bently async mediation
│   │   │   ├── deeplyUs.ts            # ✅ Full DeeplyUs router (see Section 6)
│   │   │   ├── bently.ts              # Pre-existing — do NOT modify
│   │   │   ├── pairs.ts               # Pre-existing — getMyPair returns pair data
│   │   │   └── auth.ts                # Pre-existing — JWT auth
│   │   ├── src/services/ai/
│   │   │   ├── index.ts               # aiProviders.groq / .claude / .venice
│   │   │   ├── venice.ts              # Venice AI provider (for DeeplyUs chat)
│   │   │   ├── groq.ts                # Groq (fast, for mediation)
│   │   │   └── claude.ts              # Claude (for analysis)
│   │   ├── src/db/
│   │   │   ├── index.ts               # export const db = drizzle(...)
│   │   │   └── seeds/
│   │   │       ├── sparkTemplates.ts  # 12 CommonGround spark prompts
│   │   │       ├── runSparks.ts       # Seed execution script
│   │   │       └── deeplyUsSeed.ts    # 12 intimate prompts + 6 exercises
│   │   └── src/trpc.ts                # protectedProcedure gives ctx.userId
│   └── shared/
│       ├── enums.ts                   # All enums (see Section 7)
│       ├── types.ts                   # Shared TypeScript types
│       └── constants.ts               # XP_CONFIG and other constants
├── railway.toml                       # Railway deployment config
└── render.yaml                        # Render deployment config
```

---

## 4. Critical Patterns (Read Before Writing Any Code)

### How routers access the database
```typescript
// ✅ CORRECT — direct import (used in sparks.ts, messages.ts, deeplyUs.ts)
import { db as dbClient } from '../db/index.js';
const db = dbClient!;

// ❌ DO NOT USE ctx.db — it is NOT in the tRPC context
// (bently.ts uses ctx.db! but this is a type assertion that may fail at runtime)
```

### How routers get the current user
```typescript
// ctx.userId is available in protectedProcedure
const userId = ctx.userId!; // string (UUID)
```

### How the mobile app imports tRPC
```typescript
import { trpc } from '../../src/lib/trpc'; // from packages/mobile/src/lib/trpc.ts
// Usage:
const { data } = trpc.pairs.getMyPair.useQuery();
const pairId = data?.id;
```

### How the mobile app gets the current pair
```typescript
const { data: pair } = trpc.pairs.getMyPair.useQuery();
// pair.id = pairId
// pair.user1Id, pair.user2Id
// pair.deeplyUsUnlockedByUser1, pair.deeplyUsUnlockedByUser2
```

### Theme system
```typescript
import { getTheme } from '../../src/lib/theme';
const theme = getTheme(false); // CommonGround: Black/Gold
const theme = getTheme(true);  // DeeplyUs: #110505 bg / #B76E79 rose gold accent
```

### AI providers
```typescript
import { aiProviders } from '../services/ai/index.js';
// Available: aiProviders.groq, aiProviders.claude, aiProviders.venice
// Venice requires VENICE_API_KEY env var (not yet set in Railway)
await aiProviders.groq.complete({ messages: [...], temperature: 0.4, maxTokens: 100 });
```

---

## 5. Database Schema (Key Tables)

### `sparks` table
```sql
id          uuid PRIMARY KEY
pair_id     uuid REFERENCES pairs(id) ON DELETE CASCADE
type        spark_type ENUM ('WOULD_YOU_RATHER','FINISH_SENTENCE','RATE_DAY','TWO_TRUTHS','INTIMATE_PROMPT')
content     jsonb  -- { prompt: string, optionA?: string, optionB?: string }
status      spark_status ENUM ('UNANSWERED','WAITING_ON_PARTNER','REVEALED')
user1_id    uuid REFERENCES users(id)
user1_answer text
user2_id    uuid REFERENCES users(id)
user2_answer text
bently_synthesis text
is_deeply_us boolean DEFAULT false
created_at  timestamptz
updated_at  timestamptz
```

### `pairs` table (relevant columns added this session)
```sql
deeply_us_unlocked_by_user1  boolean DEFAULT false
deeply_us_unlocked_by_user2  boolean DEFAULT false
deeply_us_unlocked_at        timestamptz
-- Derived: both must be true for DeeplyUs to be unlocked
```

### `deeply_us_messages` table
```sql
id        uuid PRIMARY KEY
pair_id   uuid REFERENCES pairs(id) ON DELETE CASCADE
user_id   uuid REFERENCES users(id)
role      varchar(16)  -- 'user' | 'assistant'
content   text
xp_earned integer DEFAULT 0
created_at timestamptz
```

### `messages` table (pre-existing, Bently uses it)
```sql
-- senderId 'BENTLY_SYSTEM' = Bently mediation message
-- type 'BENTLY_MEDIATION' = intervention message
```

### `exercises` table (pre-existing + modified)
```sql
is_deeply_us  boolean DEFAULT false  -- ✅ Added this session
```

---

## 6. DeeplyUs Router Endpoints

All under `trpc.deeplyUs.*`:

| Endpoint | Type | Description |
|----------|------|-------------|
| `getUnlockStatus` | query | `{ pairId }` → `{ user1Unlocked, user2Unlocked, isFullyUnlocked }` |
| `confirmUnlock` | mutation | `{ pairId, ageConfirmation: true, consentConfirmation: true }` |
| `chat` | mutation | `{ pairId, message }` → Venice AI response (content-filtered) |
| `history` | query | `{ pairId, limit? }` → last 100 messages |
| `exercises.list` | query | `{ pairId }` → DeeplyUs exercises with user progress |
| `exercises.complete` | mutation | `{ exerciseId, pairId }` → marks complete, awards XP |
| `desireMap.get` | query | `{ pairId }` → both partners' Yes/No/Maybe maps |
| `desireMap.update` | mutation | `{ pairId, items: [{ itemId, response }] }` |

### Content Filter (code-level)
```typescript
// In deeplyUs.ts — RESTRICTED_TERMS array is currently EMPTY
// You (the owner) must define the restricted term list
const RESTRICTED_TERMS: string[] = [];
// Filter runs on both inbound user messages AND outbound AI responses
```

---

## 7. Shared Enums (packages/shared/enums.ts)

```typescript
RELATIONAL_STATE: ALIGNED | DORMANT | MISALIGNED | CAPACITY_BLOCKED | TRUST_FRACTURED
RANK_TIER: SPARK | FLAME | CALIBRATOR | INFERNO | SOVEREIGN
BENTLY_MODE: COMMON | DEEPLY_US | SANDBOX | BRIDGE
DEEPLY_US_CATEGORY: FANTASY | DESIRE | INSECURITY | EXPLORATION | CONNECTION | AFTERCARE
LOVE_LANGUAGE: WORDS_OF_AFFIRMATION | QUALITY_TIME | PHYSICAL_TOUCH | ACTS_OF_SERVICE | GIFTS
COMMUNICATION_STYLE: GENTLE | DIRECT | COLLABORATIVE
```

---

## 8. Bently's Voice — Canon Rules

**Bently is NOT:**
- A therapist
- A cheerleader
- A corporate HR rep
- Someone who uses "Nonviolent Communication (NVC)" frameworks
- Someone who says "Listen lovely" or "Listen boo" (these were removed)

**Bently IS:**
- Street-royal: highly empathetic, incredibly observant, straight-shooting, authentic
- A wise friend who sees everything
- Direct without being cold
- Under 25–30 words for synthesis/mediation responses
- No forced openers or catchphrases — just real talk

**Current Bently system prompt (sparks synthesis):**
```
You are BentlyAI, the relationship engine embedded in AxM CommonGround. You have a
'street-royal' vibe—highly empathetic, incredibly observant, straight-shooting, and
authentic. No clinical therapy-speak. No corny catchphrases or forced openers. Just
real talk.

Prompt: {spark.content}
Partner 1: {user1Answer}
Partner 2: {user2Answer}

Task: Write a single, insightful sentence synthesizing their answers. If they align,
validate their shared vibe. If they differ, bridge the gap with a real, grounded
perspective. Keep it under 25 words. Sound like a wise friend who sees everything,
not a therapist.
```

**Current Bently mediation prompt (chat):**
```
You are BentlyAI, the relationship engine embedded in a couple's chat. You have a
'street-royal' vibe—highly empathetic, incredibly observant, straight-shooting, and
authentic. No clinical therapy-speak. Just real talk.

Read the following recent chat history between Partner 1 and Partner 2.
Task: Analyze the vibe. Is there escalating conflict, passive-aggressiveness, or high tension?
- If they are just talking normally or playfully, respond with exactly: NO_INTERVENTION_NEEDED
- If they are fighting, spiraling, or missing each other's points, write a single, grounded
  message (under 30 words) to step into the chat and de-escalate the situation by calling
  out the core miscommunication. Speak directly to them.
```

---

## 9. Vibe Gauge — 5 States + Colors

| State | Color | Bently Commentary |
|-------|-------|-------------------|
| ALIGNED | Muted Sage `#A3B18A` | "The rhythm is good. Protect it by staying present, not coasting." |
| DORMANT | Muted Lavender `#B8C0EC` | "Silence isn't distance unless you let it become that. Reach in." |
| MISALIGNED | Muted Terracotta `#DDB8A6` | "You're both trying. The gap is in translation, not intention." |
| CAPACITY_BLOCKED | Muted Warm Gray `#C2C5BB` | "Low battery doesn't mean low love. Give the space room to breathe." |
| TRUST_FRACTURED | Muted Rose `#E07A5F` | "This is the hard part. But showing up here means you haven't quit." |

---

## 10. PWA — What Needs to Be Built

### Current State
The PWA is a **bare scaffold** — React 19 + Tailwind 4 + Wouter + shadcn/ui. The default template `Home.tsx` is still showing. Nothing has been built yet.

**Live URL:** https://axmcommongrd-krmyjl7h.manus.space
**Stack:** React 19, Tailwind CSS 4, Wouter (routing), shadcn/ui components, Framer Motion
**Project path:** `/home/ubuntu/axm-commonground-pwa/` (if using Manus)

### Design System to Implement

**Theme: Obsidian Luxe** — Art Deco meets Digital Luxury

```css
/* Color tokens to set in client/src/index.css */
--background: #080808;           /* Near-black base */
--foreground: #E8E8E8;           /* Off-white text */
--card: #1A1A1A;                 /* Elevated surfaces */
--card-foreground: #E8E8E8;
--primary: #D4AF37;              /* Burnished Gold */
--primary-foreground: #080808;
--muted: #2A2A2A;
--muted-foreground: #8A8A8A;
--border: rgba(212, 175, 55, 0.15);  /* Subtle gold border */

/* DeeplyUs mode overrides */
--deeply-us-bg: #110505;
--deeply-us-accent: #B76E79;     /* Rose Gold */
--deeply-us-border: rgba(183, 110, 121, 0.3);
```

**Typography:**
- Headers/Display: `Fraunces` (Google Fonts — optical size, italic for Bently quotes)
- Body: `Inter`
- Add to `client/index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;1,9..144,300;1,9..144,600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
```

**PWA Manifest** — add to `client/public/manifest.json`:
```json
{
  "name": "AxM CommonGround",
  "short_name": "CommonGround",
  "description": "The relationship operating system for intentional couples.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#080808",
  "theme_color": "#D4AF37",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Pages to Build

The PWA is a **demo/preview** of the app — it does NOT need to connect to the live tRPC backend. Use realistic mock data. The goal is for the owner to share a URL with testers who can experience the UI/UX before the native app is ready.

#### Route Structure
```
/                    → Landing / Login page (pair code entry)
/dashboard           → Vibe Dashboard (Hero Card + Quick Actions)
/sparks              → Daily Sparks (CommonGround mode)
/sparks?mode=deeply  → Daily Sparks (DeeplyUs mode, dark maroon bg)
/chat                → Messages screen
/deeply-us           → DeeplyUs hub (requires unlock gate)
/deeply-us/chat      → DeeplyUs Bently chat
/deeply-us/prompts   → Intimate prompts
/deeply-us/exercises → Guided exercises
/deeply-us/desire-map → Yes/No/Maybe list
```

#### Page-by-Page Specs

**`/` — Landing / Login**
- Full-screen dark background with subtle gold geometric pattern
- AxM logo (geometric monogram) centered
- Tagline: "Your vibe, unfiltered."
- Input: "Enter your pair code" (e.g., AXM001)
- CTA button: "Enter" (gold, full-width)
- Below: "Don't have a pair code? Download the app."

**`/dashboard` — Vibe Dashboard**
- Header: "CommonGround" in Fraunces + gold dot indicator
- **Vibe Gauge Hero Card** (full-width):
  - Left colored border (changes with state)
  - State name in Fraunces 28px (e.g., "Aligned")
  - Bently commentary in Fraunces italic below a divider
  - Animated pulse dot
- **Quick Actions Row** (2 cards side by side):
  - "Daily Sparks ✦" → `/sparks`
  - "Chat ◈" → `/chat`
- **Bently Deep Dive** card (full-width) → `/deeply-us/chat`
- Mock state: cycle through all 5 states for demo purposes

**`/sparks` — Daily Sparks**
- Mode toggle pill at top: "CommonGround" | "DeeplyUs"
  - CommonGround: Black bg, Gold accent
  - DeeplyUs: #110505 bg, Rose Gold (#B76E79) accent
- Spark card (pastel background cycling: Sage, Lavender, Terracotta):
  - Prompt text in Fraunces
  - State machine:
    - UNANSWERED: text input or option buttons + "Drop your answer" CTA
    - WAITING_ON_PARTNER: frosted glass overlay "Waiting on partner..."
    - REVEALED: both answers shown in bubbles + Bently synthesis in Fraunces italic
- Mock data: use the 6 seeded sparks (3 CommonGround, 3 DeeplyUs)

**`/chat` — Messages**
- Dark chat UI
- Messages from "You" (right, gold bubble) and "Partner" (left, dark surface bubble)
- Bently intervention messages: centered, rose-gold border, "BENTLY" label, italic text
- Text input at bottom with send button
- Mock data: 8–10 messages including 1 Bently intervention

**`/deeply-us` — DeeplyUs Hub**
- Unlock gate first (if not unlocked):
  - Dark maroon (#110505) background
  - "DeeplyUs" header in Fraunces, rose gold
  - Age confirmation checkbox + consent checkbox
  - "Both partners must confirm" status (show one confirmed, one pending)
  - "I'm in" CTA button
- After unlock: 4 feature cards (Chat, Prompts, Exercises, Desire Map)

**`/deeply-us/chat` — DeeplyUs Chat**
- Same as `/chat` but with rose gold accent and #110505 background
- Bently speaks as intimate guide, not mediator

**`/deeply-us/prompts` — Intimate Prompts**
- Same state machine as `/sparks` but with DeeplyUs color scheme
- Cards use dark intimate tones (#2D1B1B, etc.)

**`/deeply-us/exercises` — Guided Exercises**
- List of exercise cards with:
  - Title, category badge, difficulty (●●○), duration, XP reward
  - "Begin" CTA
  - Completed state (checkmark, XP shown)

**`/deeply-us/desire-map` — Yes/No/Maybe**
- Grid of desire items
- Each item: tap to cycle Yes (green) / No (red) / Maybe (gold)
- "See where you align" CTA reveals partner's responses side by side

### Bottom Navigation Bar
All authenticated pages should have a bottom nav with 4 tabs:
```
[Home/Dashboard] [Sparks ✦] [Chat ◈] [DeeplyUs ♡]
```
- Active tab: gold icon + gold underline
- Inactive: muted gray
- DeeplyUs tab: rose gold when DeeplyUs mode is active

---

## 11. Open Items (Require Owner Action)

| Item | Priority | What To Do |
|------|----------|-----------|
| **Database migration** | HIGH | Run `drizzle-kit push` against live Supabase — new DeeplyUs columns need to be applied |
| **`VENICE_API_KEY`** | HIGH | Set in Railway env vars — required for DeeplyUs chat |
| **Vocabulary filter** | MEDIUM | `RESTRICTED_TERMS` array in `packages/server/src/routers/deeplyUs.ts` is empty — owner defines the list |
| **GitHub Actions auto-build** | MEDIUM | Add `.github/workflows/eas-android-build.yml` + `EXPO_TOKEN` secret (see below) |
| **Bently synthesis LLM** | MEDIUM | `sparks.ts` `submitAnswer` has a placeholder synthesis — wire up actual LLM call using `buildBentlySynthesisPrompt()` |
| **Backend hosting** | HIGH | `cgo.anarchyxmayhem.com` is returning 403 (membership expired) — redeploy on Railway using `railway.toml` |

### GitHub Actions Workflow (paste into `.github/workflows/eas-android-build.yml`)
```yaml
name: EAS Android Build
on:
  push:
    branches: [main]
  workflow_dispatch:
jobs:
  build:
    name: Build Android APK
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: packages/mobile
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - name: Install dependencies
        run: cd ../.. && pnpm install
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - name: Build Android APK
        run: eas build --platform android --profile sideload --non-interactive --no-wait
```
Then add repo secret: **`EXPO_TOKEN`** = `bsZZnqqWAhZ2sr14BQIyg6LYlvZjP8c-DRGSGrzy`

---

## 12. Environment Variables Required

### Backend (Railway / server)
```
DATABASE_URL=           # Supabase PostgreSQL connection string
JWT_SECRET=             # JWT signing secret
GROQ_API_KEY=           # For Bently real-time mediation (fast, free tier available)
VENICE_API_KEY=         # For DeeplyUs chat (REQUIRED for that feature)
CLAUDE_API_KEY=         # For analysis features (optional)
```

### Mobile (Expo / EAS)
```
EXPO_PUBLIC_API_URL=    # Backend URL (e.g., https://cgo.anarchyxmayhem.com)
```

---

## 13. Seeded Test Data (Live in Supabase)

**Test Pair:** Code `AXM001`, ID `8c2e9023-2d08-4872-b1a3-c960231856c5`

**6 Live Sparks:**
| Type | Mode | Content |
|------|------|---------|
| FINISH_SENTENCE | CommonGround | "The very first thing I noticed about you when we met was..." |
| WOULD_YOU_RATHER | CommonGround | Cozy night in vs. unpredictable night out |
| RATE_DAY | CommonGround | "How aligned and connected did you feel with me today?" |
| FINISH_SENTENCE | DeeplyUs | "If we were completely alone right now, the first thing I would do is..." |
| WOULD_YOU_RATHER | DeeplyUs | Take full control vs. completely surrender control |
| FINISH_SENTENCE | DeeplyUs | "My absolute biggest weakness when it comes to you is..." |

All sparks are status `UNANSWERED`.

---

## 14. Quick Start for the Next AI

```bash
# Clone the repo
gh repo clone BmdaDaee/AxMCommonGround
cd AxMCommonGround

# Install dependencies
pnpm install

# For PWA work only — the PWA is a separate project
# If using Manus: project is already live at axmcommongrd-krmyjl7h.manus.space
# If working locally:
cd /path/to/axm-commonground-pwa
pnpm install
pnpm dev
# → http://localhost:3000

# Key files to read first:
# packages/shared/enums.ts          — all enums
# packages/server/drizzle/schema.ts — full DB schema
# packages/server/src/routers/index.ts — all registered routers
# packages/mobile/src/lib/theme.ts  — getTheme(isDeeplyUs)
# packages/mobile/src/lib/trpc.ts   — tRPC client setup
```

---

*This document was generated by Manus on August 3, 2026. All code described is committed to `main`. The PWA scaffold is live but the UI has not been built yet — that is the primary remaining task.*

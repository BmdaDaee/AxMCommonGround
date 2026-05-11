# AxMCommonGround — Architecture Overview

This monorepo consolidates five separate repos into a single full-stack application.

## Repo Structure

```
axmcommonground/
├── server/           # Express + tRPC backend (primary: cgo)
│   ├── _core/        # Auth, LLM, image gen, voice, CORS, health
│   ├── relationalEngine/  # 5-state pair relationship engine
│   ├── routers.ts    # Full tRPC appRouter (23+ endpoints)
│   ├── db.ts         # Supabase DB helpers
│   ├── supabase.ts   # Supabase client + XP + constants
│   ├── venice.ts     # Venice AI (DeeplyUs/adult mode)
│   └── storage.ts    # S3 presigned upload
├── client/           # React web app (cgo structure + Obsidian Sovereign design)
│   └── src/
│       ├── index.css # Merged design tokens (cgo OKLch + EmergentCG palette)
│       ├── App.tsx   # Routes: all feature screens
│       └── pages/    # auth/, onboarding/, app/ (17+ screens)
├── mobile/           # Expo React Native (Common-Ground)
│   ├── app/          # Expo Router screens
│   ├── components/   # Shared RN components
│   ├── lib/          # trpc, app-context, theme-provider
│   └── constants/    # theme.ts design tokens
├── shared/           # Shared types + constants
├── drizzle/          # MySQL schema + 3 migrations
└── docs/             # This file
```

## Source Repositories

| Source | Contribution |
|---|---|
| `bmdadaee/cgo` | Primary backend, web client structure, Drizzle schema, shared/ |
| `bmdadaee/CommonGroundOfficial` | Best DB schema, netlify.toml |
| `bmdadaee/EmergentCommonGround` | Standout design (Obsidian Sovereign), Radix UI, bento grid |
| `bmdadaee/Common-Ground` | Expo React Native mobile app, rewrite modal, XP badges |
| `bmdadaee/CommonGround` | Dual-theme token reference |

## Design System — Obsidian Sovereign

Foundation: cgo's OKLch color system elevated with EmergentCommonGround additions.

### Color Tokens

| Token | Value | Source |
|---|---|---|
| `--background` | `oklch(0.10 0.06 290)` / `#080808` | cgo + Common-Ground |
| `--surface` | `oklch(0.14 0.06 290 / 0.6)` / `#111111` | cgo |
| `--surface-glass` | `rgba(10,10,10,0.85)` | EmergentCG |
| `--midas-gold` | `oklch(0.78 0.16 75)` / `#D4AF37` | all repos |
| `--emerald` | `oklch(0.50 0.16 162)` / `#0B6B4F` | cgo |
| `--accent-purple` | `oklch(0.55 0.22 290)` / `#9D4EDD` | EmergentCG |
| `--highlight-red` | `oklch(0.56 0.22 24)` / `#E63946` | EmergentCG |
| `--neon-green` | `oklch(0.85 0.28 142)` / `#39FF14` | cgo + Common-Ground |
| `--border-subtle` | `#1F1F1F` | EmergentCG |

### Typography

| Role | Font | Weight | Source |
|---|---|---|---|
| Brand/Hero | Unbounded | 900 | EmergentCG |
| Display | Cinzel | 700 | cgo |
| Body | Nunito / Manrope | 300–800 | cgo + EmergentCG |

## AI Providers

| Provider | Model | Use Case |
|---|---|---|
| Anthropic Claude | `claude-sonnet-4-6` | Bently chat, journal analysis, horoscope, list suggestions |
| Venice AI | `llama-3.3-70b` / `venice-uncensored` | DeeplyUs intimate/unfiltered mode |
| Forge API | `gemini-2.5-flash` | Completions with tool-calling + extended thinking |
| Forge Image | — | AI avatar + couple portrait generation |
| Whisper | — | Voice transcription |

## Relational Engine — 5-State Machine

Measures 4 dimensions: **Availability**, **Alignment**, **Activation**, **Trust** (each: HIGH / MEDIUM / LOW).

Computes one of 5 states:
- `ALIGNED` — all dimensions healthy
- `DORMANT` — average < 2.0 but trust intact
- `MISALIGNED` — alignment LOW
- `CAPACITY_BLOCKED` — availability LOW
- `TRUST_FRACTURED` — trust LOW (highest priority)

## Required Environment Variables

```
CLAUDE_API_KEY=        # Anthropic Claude
VENICE_API_KEY=        # Venice AI (DeeplyUs)
FORGE_API_KEY=         # Forge API (Gemini + image gen)
FORGE_API_URL=         # https://forge.manus.im/v1
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=          # mysql://...
OAUTH_SERVER_URL=
JWT_SECRET=
CORS_ORIGIN=           # e.g. https://yourapp.netlify.app
PORT=3001
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=         # Avatar + couple pic storage
```

## Rank Tiers

SPARK → FLAME (500 XP) → CALIBRATOR (2000 XP) → INFERNO (5000 XP) → SOVEREIGN (15000 XP)

Themes: Pharaoh (gold) | Samurai (blue) | Celestial (purple) | Shadow (dark)

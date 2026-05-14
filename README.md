# AxMCommonGround

Relational state machine for couples: AI-powered communication, trust-building, and intimate connection.

## What is AxMCommonGround?

CommonGround is a platform for couples to:
- **Communicate better** via AI-assisted message rewriting
- **Understand each other** through relational metrics and Bently AI insights
- **Grow together** with missions, exercises, and intimate features
- **Track progress** via XP and rank system

## Architecture

**Monorepo structure (server + client):**
```
AxMCommonGround/
├── server/     # Express + tRPC API
├── client/     # React web app
├── shared/     # Types, enums, constants
└── drizzle/    # Database schema
```

**Separate repository:**
```
cgo-mobile/    # Expo React Native app
```

## Workspaces

- `server`: REST + tRPC API, relational engine, AI integrations
- `client`: React web UI, Obsidian Sovereign design system

## Getting Started

```bash
# Install dependencies
pnpm install

# Start all services
pnpm dev

# Build all workspaces
pnpm build
```

## Tech Stack

- **Backend:** Express, tRPC, Drizzle ORM, Supabase
- **Frontend:** React, Vite, Radix UI, Tailwind CSS
- **Mobile:** Expo, React Native
- **AI:** Claude Sonnet, Venice AI, Forge API
- **Database:** PostgreSQL (via Supabase)

## Design System

**Obsidian Sovereign** — dark, editorial, typographically rich:
- Primary: `#D4AF37` (Midas gold)
- Accent: `#9D4EDD` (purple)
- Highlight: `#E63946` (red)
- Background: `#080808` (deep black)

## Status

**Phase 1:** ✅ Shared types, enums, constants  
**Phase 2:** 🔄 Server API (in progress)  
**Phase 3:** 🔄 Client web (in progress)  
**Phase 4:** ⏳ Mobile app (planned)

## License

Private (AxM internal)

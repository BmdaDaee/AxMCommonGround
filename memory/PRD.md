# AxM CommonGround PRD

## Original Problem Statement
Build `BmdaDaee/AxMCommonGround` directly from the repository. User clarified the prior custom adaptation was wrong and requested the app follow the existing repo.

## Architecture Decisions
- Frontend: React app aligned to the repo client routes and visual language: `/login`, `/signup`, `/invite`, `/join`, `/dashboard`, `/messages`, `/bently`, `/deeplyus`, `/journal`, `/calendar`, `/xp`, `/missions`, `/settings`.
- Backend: FastAPI/Mongo service kept for this workspace runtime, with REST endpoints mapped to the repo feature set.
- Auth: Email/password plus Emergent-managed Google OAuth callback handling.
- AI: Bently uses Claude Sonnet through Emergent universal LLM key with local fallback if the AI call fails.

## Implemented
- Repo-style CommonGround shell: sidebar, “A third presence” layout, invite/join onboarding, dashboard pair state, Bently mediator, direct messages, missions, XP/rank, journal, DeeplyUs vault, calendar, settings.
- Backend persistence for users, sessions, pairs/invites, messages, Bently entries, missions, XP events, journal entries, calendar events, vault items, settings.
- Verified login, dashboard, invite code generation, Bently response, missions, journal, calendar, DeeplyUs, XP, and settings in browser.

## Prioritized Backlog
### P0
- Replace REST compatibility layer with actual repo tRPC/Express server if the target runtime supports the repo monorepo directly.
- Add real pair acceptance test with two accounts.

### P1
- Add relational state history and signal collector logic from server engine.
- Add message pagination/cursors matching repo router behavior.

### P2
- Add mobile Expo package support and native-specific flows.
- Add media upload storage for DeeplyUs vault.

## Next Tasks
- Validate with a second test account for invite/join and partner messaging.
- Bring over additional relational engine internals from `/packages/server/src/engine`.

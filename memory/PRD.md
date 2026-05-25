# CommonGround PRD

## Original problem statement
The app is basiccaly at bmdadaee/axmcommonground and i need you to build everything from the repo into a mwa and mobile app

## User choices
- Source repo: `bmdadaee/axmcommonground`
- Mobile goal: responsive web app + installable PWA, plus a separate native-style mobile app
- Scope: recreate core repo experience closely, with redesigned and modernized UI/UX
- Backend/data: preserve existing logic where possible
- Branding: full redesign allowed

## Architecture decisions
- Built a new Emergent-compatible stack with `frontend/` (React + Vite + PWA) and `backend/` (FastAPI)
- Recreated the repo's product structure around auth, pairing, dashboard, messaging, journal, missions, calendar, settings, DeeplyUs/Vault, and Bently AI mediation
- Used MongoDB on local container (`MONGO_URL`, `DB_NAME`) for persistence and JWT auth for sessions
- Wired Bently through `emergentintegrations` with a low-cost model (`gpt-4.1-nano`) so the feature remains usable within key budget
- Updated the existing Expo mobile source adapter in `packages/mobile/` so its screens can call the new REST backend instead of the old tRPC backend

## What's implemented
- Responsive editorial web app with login/signup, installable PWA manifest, immersive onboarding, premium dashboard, messages, Bently, journal, missions, calendar, vault, and settings pages
- FastAPI backend endpoints for auth, invite creation, pair joining, dashboard state, messaging, unread notification summaries, partner presence, AI coaching, journal entries, mission completion, calendar events, vault data/media uploads, and user settings
- Persistent relational-state engine that derives relationship weather from activity, balance, reflection, ritual completion, unread messages, and recent presence
- Vault memories now support multipart media uploads stored locally and served back through `/api/media/*`; the web app renders uploaded media in the shared vault
- Expo mobile UI was redesigned to visually align with the new web experience, with a new shared mobile shell, refreshed auth/onboarding, upgraded dashboard/messages/Bently screens, plus new mobile vault and settings screens
- Verified flows: auth, invite generation, join flow, dashboard, unread notifications, partner presence, messages, Bently, vault media upload, journal, missions, calendar, and settings
- Added backend regression coverage for notifications + vault media in `/app/backend/tests/test_notifications_vault_media.py`

## Prioritized backlog
### P0
- Add true device-side mobile media picking/upload so Expo can attach local photos/audio directly into Vault memories
- Add pagination / lazy loading for long message and journal histories
- Add richer mobile screen coverage for journal, missions, and calendar to reach full web/mobile parity

### P1
- Add push notification delivery and background refresh for unread/presence on mobile/web
- Add more nuanced relational analytics and trends across weeks/months
- Add editable missions, recurring rituals, and milestone generation

### P2
- Add richer Bently conversation memory controls and conversation export
- Add theme selection parity across web and mobile visuals
- Add dynamic code-splitting for frontend bundle optimization

## Next tasks
1. Add device-native media picking/upload inside Expo so mobile can attach local photos/audio directly
2. Build mobile parity screens for journal, missions, and calendar
3. Add push delivery for unread/presence notifications and richer notification preferences


## Code review hardening (latest pass)
- Replaced browser localStorage token/session handling with httpOnly cookie auth for the web app; added `/api/auth/logout` and preserved token responses for mobile compatibility.
- Refactored `ensure_pair_extras`, `compute_relational_state`, and `generate_bently_response` into smaller helper-driven flows.
- Refactored AppShell, Dashboard, Connect, Vault, and Bently pages into smaller sections/helpers and removed stale hook dependency risks.
- Added backend regression coverage for cookie auth in `/app/backend/tests/test_auth_cookie_and_regressions.py`.

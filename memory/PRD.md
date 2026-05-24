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
- FastAPI backend endpoints for auth, invite creation, pair joining, dashboard state, messaging, AI coaching, journal entries, mission completion, calendar events, vault data, and user settings
- Persistent relational-state engine that derives relationship weather from activity, balance, reflection, and ritual completion
- Verified flows: auth, invite generation, join flow, dashboard, messages, Bently, journal, missions, calendar, and settings
- Mobile source integration path updated so Expo app code targets the new REST backend contract

## Prioritized backlog
### P0
- Add richer mobile UI modernization across all Expo screens to match the new web design language
- Add upload/media support for the Vault so shared memories can include images and audio
- Add pagination / lazy loading for long message and journal histories

### P1
- Add pair notifications, unread states, and background refresh for mobile/web
- Add more nuanced relational analytics and trends across weeks/months
- Add editable missions, recurring rituals, and milestone generation

### P2
- Add richer Bently conversation memory controls and conversation export
- Add theme selection parity across web and mobile visuals
- Add dynamic code-splitting for frontend bundle optimization

## Next tasks
1. Modernize the Expo UI layer screen-by-screen to visually match the new PWA
2. Add media-rich shared memory uploads for DeeplyUs/Vault
3. Add partner presence, unread states, and notification preferences

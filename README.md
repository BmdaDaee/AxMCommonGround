# AxMCommonGround

**Relational state machine for couples.** AI-assisted communication infrastructure built on AxM's architectural DNA: duality, responsibility, emotional honesty, power without moral certainty.

## What is CommonGround?

A platform for couples to:
- **Communicate better** via AI-assisted message rewriting (Keystone) and dual-current guidance (Bently)
- **Understand each other** through relational state tracking and emotional metrics
- **Grow together** with missions, exercises, journal prompts
- **Track progress** via XP and rank system (Advocate → Sovereign)
- **Preserve memories** in DeeplyUs vault (encrypted, partner-only)

## Monorepo Structure (Hybrid Deployment)

```
AxMCommonGround/
├── packages/
│   ├── client/                  # React 18 + TypeScript web UI (Vercel/Netlify)
│   │   ├── src/
│   │   ├── package.json         # @axm/cg-client
│   │   └── README.md
│   │
│   ├── server/                  # Express + tRPC + Drizzle API (Railway/Heroku)
│   │   ├── src/
│   │   ├── package.json         # @axm/cg-server
│   │   └── README.md
│   │
│   └── shared/                  # TypeScript types & enums (shared by both)
│       ├── types/
│       ├── enums/
│       └── package.json         # @axm/cg-shared
│
├── package.json                 # Root workspace (pnpm)
├── pnpm-workspace.yaml
├── HYBRID_ARCHITECTURE.md       # Architecture docs
├── DEPLOY_CLIENT.md             # Client deployment guide
├── DEPLOY_SERVER.md             # Server deployment guide
└── README.md                    # This file
```

### Why Hybrid?

**Monorepo** (development):
- Shared types between client & server
- Single dependency tree
- Atomic commits
- Easier refactoring

**Hybrid Deployment** (production):
- Client deploys independently (Vercel, Netlify, etc.)
- Server deploys independently (Railway, Heroku, Docker, etc.)
- Each scales separately
- No deployment coupling

## Tech Stack

### Client
- **React 18** + **TypeScript** (strict mode)
- **Vite** – Lightning-fast builds
- **Tailwind CSS** – Utility-first styling
- **Obsidian Sovereign** – Dark theme design system
- **tRPC** – Type-safe API communication
- **React Router v6** – Auth-protected routing
- **React Query** – Data fetching & caching
- **Radix UI** – Accessible component primitives

### Server
- **Express.js** – HTTP server
- **tRPC** – Type-safe RPC layer
- **Drizzle ORM** – Type-safe SQL queries
- **PostgreSQL** – Relational database
- **AI Integrations:**
  - Anthropic Claude (Bently dual-current guidance)
  - Keystone (message rewriting)

### Shared
- **TypeScript types** – Relational state, user, message schemas
- **Enums** – States (ALIGNED, STALE, TENSION, ONE_SIDED_STRESS), roles, XP tiers
- **Constants** – Configuration, defaults, text

## Design System: Obsidian Sovereign

A dark, editorial aesthetic anchored in duality:

- **Gold (#D4AF37)** – Sovereignty, truth, primary actions
- **Purple (#9D4EDD)** – Introspection, secondary actions
- **Red (#E63946)** – Rupture, breakthrough, alerts
- **Deep Black (#080808)** – Canvas foundation
- **Off-White (#F5F5F5)** – Primary text
- **Status Colors** – Aligned (green), stress (amber), tension (red), stale (gray)

**Philosophy:** Stripped of ornament. Hierarchy through restraint. Typography as structure. Color as signal.

## Routes & Pages

| Route | Component | Purpose |
|-------|-----------|---------|
| `/login` | LoginPage | User authentication |
| `/signup` | SignupPage | Account creation |
| `/dashboard` | DashboardPage | Relational state overview + activity |
| `/messages` | MessagesPage | Partner messaging interface |
| `/bently` | BentlyPage | Dual-current AI guidance chat |
| `/xp` | XpPage | Progression, ranks, XP history |
| `/missions` | MissionsPage | Relational tasks & challenges |
| `/journal` | JournalPage | Private reflections with sentiment |
| `/deeplyus` | DeeplyUsPage | Shared memory vault |
| `/calendar` | CalendarPage | Shared events & milestones |
| `/settings` | SettingsPage | Preferences, account, privacy |

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (or npm/yarn)
- PostgreSQL (for server development)

### Installation

```bash
# Install all workspaces
pnpm install

# Or specific workspace
pnpm --filter=@axm/cg-client install
pnpm --filter=@axm/cg-server install
```

### Development

```bash
# Start all services (client :5173, server :3000)
pnpm dev

# Or individual services
pnpm --filter=@axm/cg-client dev
pnpm --filter=@axm/cg-server dev
```

### Build

```bash
# Build all
pnpm build

# Or individual
pnpm --filter=@axm/cg-client build
pnpm --filter=@axm/cg-server build
```

## Relational State Machine

CommonGround tracks relational state as its core concept:

- **ALIGNED** – Healthy communication, moving forward together
- **STALE** – Disconnected, needs attention
- **ONE_SIDED_STRESS** – One partner stressed, other unaware
- **TENSION** – Active conflict or rupture

State drives UI color coding, notifications, mission recommendations, Bently guidance tone.

## Bently AI

Dual-current engine surfacing both **stabilizing** and **destabilizing** perspectives:

- **Stabilizing:** "This is working. Build on it."
- **Destabilizing:** "Something's shifting. Pay attention."

Modeled on Shantell (investigative directness, protective loyalty, warm humor, escalating intervention).

## XP & Rank System

Users earn XP by:
- Daily check-ins (25 XP)
- Completing missions (25–100 XP based on difficulty)
- Journal entries (15 XP)
- Difficult conversations (50 XP)
- Milestones reached (variable)

Rank progression:
- **Level 5:** Advocate
- **Level 6:** Navigator
- **Level 7:** Keeper
- **Level 8:** Sentinel
- **Level 9:** Sovereign

Ranks unlock features and Bently guidance modes.

## DeeplyUs Vault

Shared, encrypted memory system:
- **Photos & Videos** – Trip moments, intimate captures
- **Letters** – Handwritten, voice-recorded messages
- **Milestones** – Anniversaries, relationship events
- **Goals** – Shared dreams and aspirations
- **Memories** – Tagged moments with context

Partner-only access, end-to-end encrypted.

## Development Workflow

### Branch Strategy
- `main` – Production-ready code
- `develop` – Active development baseline
- `feature/*` – Feature branches
- `bugfix/*` – Bug fix branches

### Commit Convention
```
feat: Add new feature
fix: Fix a bug
docs: Documentation
refactor: Code restructuring
test: Add/update tests
chore: Build, deps, config
```

### Code Standards
- TypeScript strict mode (every file, every prop typed)
- Semantic HTML + accessibility (WCAG AA)
- Keyboard navigation for all interactions
- Mobile-first responsive design (tested 375px+)
- No console errors or warnings

## Project Status

### ✅ Complete
- [x] Client: All 11 routes implemented
- [x] Design system: Obsidian Sovereign tokens + CSS
- [x] Server scaffold: Express + tRPC + Drizzle
- [x] Shared types: Core schemas defined
- [x] Auth routing (client-side protection)

### 🔄 In Progress
- [ ] Server: tRPC routes (auth, messages, dashboard, missions)
- [ ] Relational state derivation engine
- [ ] Bently AI integration (Claude API)
- [ ] Database schema & migrations
- [ ] Real-time messaging (WebSockets)

### ⏳ Planned
- [ ] File upload (vault images, voice)
- [ ] Email notifications
- [ ] Push notifications
- [ ] PWA (offline mode)
- [ ] Analytics
- [ ] Localization (Spanish, French)
- [ ] Mobile app (React Native, separate repo)

## Architecture Decisions

### Monorepo (pnpm workspaces)
- **Single source of truth** for types & constants
- **Parallel development** (client ↔ server independent)
- **Easy deployment** – Each workspace can deploy separately

### tRPC for API
- **Type safety** – Shared TypeScript between client & server
- **Zero API docs needed** – Types are the contract
- **Minimal bundle impact** – Client-side tRPC ~5KB
- **Real-time ready** – Can extend with WebSockets

### Drizzle ORM
- **Type-safe queries** – SQL generated from TypeScript
- **Migrations as code** – Versioning, rollback built-in
- **Raw SQL escape hatch** – No artificial abstraction limits

### React Query + tRPC
- **Smart caching** – Stale-while-revalidate pattern
- **Optimistic updates** – Better perceived performance
- **Background sync** – Always-fresh data
- **DevTools integration** – Debugging & inspection

## Environment Configuration

### Client (.env.local)
```
VITE_TRPC_URL=http://localhost:3000
```

### Server (.env.local)
```
DATABASE_URL=postgresql://user:password@localhost:5432/commonground
NODE_ENV=development
ANTHROPIC_API_KEY=sk-...
JWT_SECRET=your-secret-key
```

## Security Considerations

- [ ] Rate limiting (auth endpoints)
- [ ] CSRF protection
- [ ] CORS whitelist
- [ ] SQL injection prevention (Drizzle)
- [ ] XSS protection (React escapes)
- [ ] Password hashing (bcrypt/Argon2)
- [ ] JWT token rotation
- [ ] End-to-end encryption (vault)
- [ ] Audit logging

## Performance Targets

- **Client bundle:** <150KB gzipped
- **Time to Interactive:** <3s
- **Lighthouse:** 95+ (all categories)
- **API responses:** <100ms (95th percentile)
- **Database queries:** <50ms (95th percentile)
- **Core Web Vitals:** All green

## Troubleshooting

### Port in Use
```bash
# Kill :5173 (client)
lsof -i :5173 | grep -v PID | awk '{print $2}' | xargs kill -9

# Kill :3000 (server)
lsof -i :3000 | grep -v PID | awk '{print $2}' | xargs kill -9
```

### pnpm Issues
```bash
# Clean reinstall
rm -rf node_modules **/node_modules pnpm-lock.yaml
pnpm install
```

### Database
```bash
# Check PostgreSQL
psql -U postgres -h localhost -c "SELECT version();"

# Verify DATABASE_URL
# postgresql://user:password@host:port/database
```

## Documentation

- **[Client README](./client/README.md)** – React UI setup, routes, styling
- **[Server README](./server/README.md)** – tRPC API, database, integrations
- **[Shared README](./shared/README.md)** – Types, enums, constants

## Contributing

1. Clone: `git clone https://github.com/BmdaDaee/AxMCommonGround.git`
2. Install: `pnpm install`
3. Branch: `git checkout -b feature/feature-name`
4. Develop: `pnpm dev`
5. Commit: Follow convention above
6. Push & create PR

### Code Review Checklist
- [ ] TypeScript strict mode passes
- [ ] Tests pass (if applicable)
- [ ] Responsive design (375px+)
- [ ] Accessibility (keyboard, ARIA labels)
- [ ] No console errors/warnings
- [ ] Commit messages follow convention

## License

**PROPRIETARY** – ©️ AnarchyXMayhem LLC

Unauthorized copying, modification, or distribution prohibited.

## Contact

**Project Lead:** Daee (Davon Washington)  
**Organization:** AnarchyXMayhem LLC  
**Location:** Cleveland, Ohio  
**Email:** daee@anarchyxmayhem.com  
**GitHub:** https://github.com/BmdaDaee

---

**CommonGround is infrastructure for people operating at the edges of relationships, resources, and emotional capacity.**

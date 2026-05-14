# CommonGround – Hybrid Architecture

## Structure

```
AxMCommonGround/
├── packages/
│   ├── client/              # React SPA (deployable to Vercel/Netlify)
│   │   ├── src/
│   │   ├── package.json     # "name": "@axm/cg-client"
│   │   ├── vite.config.ts
│   │   └── README.md
│   │
│   ├── server/              # Express API (deployable to Heroku/Railway)
│   │   ├── src/
│   │   ├── package.json     # "name": "@axm/cg-server"
│   │   ├── Dockerfile
│   │   └── README.md
│   │
│   └── shared/              # Shared types & constants (imported by both)
│       ├── types/
│       ├── enums/
│       ├── package.json     # "name": "@axm/cg-shared"
│       └── README.md
│
├── package.json             # Root workspace (pnpm)
├── pnpm-workspace.yaml
├── README.md                # Main documentation
├── DEPLOY_CLIENT.md         # Client deployment guide
├── DEPLOY_SERVER.md         # Server deployment guide
└── .gitignore
```

## Why Hybrid?

**Monorepo benefits:**
- Shared types across client & server
- Atomic commits for related changes
- Single dependency graph
- Easier refactoring

**Hybrid deployment:**
- Client deploys independently (Vercel)
- Server deploys independently (Railway)
- Each can scale separately
- No coupling at deployment time

## Development

### Install Everything
```bash
pnpm install
```

### Start All Services
```bash
pnpm dev
# Client on :5173, Server on :3000
```

### Start Individual Services
```bash
pnpm dev:client     # React app only
pnpm dev:server     # Express API only
```

## Building

### Build Everything
```bash
pnpm build
```

### Build Individual Packages
```bash
pnpm build:client   # Outputs to packages/client/dist
pnpm build:server   # Outputs to packages/server/dist
```

## Shared Package

**@axm/cg-shared** contains:
- TypeScript types (User, Message, RelationalState, etc.)
- Enums (States, Roles, XP tiers)
- Constants (defaults, config)

**Usage in client:**
```typescript
import { RelationalState, XpTier } from '@axm/cg-shared';
```

**Usage in server:**
```typescript
import { User, Message } from '@axm/cg-shared';
```

## Deployment Targets

### Client
- **Platform:** Vercel or Netlify
- **Build:** `pnpm build` in `packages/client/`
- **Output:** Static files in `dist/`
- **Environment:** `VITE_TRPC_URL`
- **See:** `DEPLOY_CLIENT.md`

### Server
- **Platform:** Railway, Heroku, or Docker
- **Build:** `pnpm build` in `packages/server/`
- **Output:** JavaScript in `dist/`
- **Environment:** `DATABASE_URL`, `ANTHROPIC_API_KEY`
- **See:** `DEPLOY_SERVER.md`

### Database
- **Type:** PostgreSQL
- **Hosting:** Railway, Heroku Postgres, AWS RDS
- **Migrations:** Drizzle ORM (code-first)

## Development Workflow

```bash
# 1. Start services
pnpm dev

# 2. Make changes
vim packages/client/src/pages/NewPage.tsx
vim packages/server/src/routes/messages.ts
vim packages/shared/types.ts

# 3. Test locally
# Client: http://localhost:5173
# Server: http://localhost:3000

# 4. Commit
git add .
git commit -m "feat: Add feature"

# 5. Push
git push origin main

# 6. Deploy
# Client auto-deploys from Vercel/Netlify
# Server auto-deploys from Railway/Heroku
```

## Monorepo Commands

### Install
```bash
# Install everything
pnpm install

# Install specific package
pnpm --filter @axm/cg-client install
```

### Development
```bash
# All services
pnpm dev

# Specific service
pnpm --filter @axm/cg-client dev
pnpm --filter @axm/cg-server dev
```

### Building
```bash
# All packages
pnpm build

# Specific package
pnpm --filter @axm/cg-client build
pnpm --filter @axm/cg-server build
```

### Testing
```bash
# All packages
pnpm test

# Specific package
pnpm --filter @axm/cg-client test
```

### Linting
```bash
# All packages
pnpm lint

# Specific package
pnpm --filter @axm/cg-server lint
```

## CI/CD Setup (GitHub Actions)

### Client Deploy (.github/workflows/deploy-client.yml)
```yaml
name: Deploy Client

on:
  push:
    branches: [main]
    paths:
      - 'packages/client/**'
      - 'packages/shared/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: vercel deploy --prod --token ${{ secrets.VERCEL_TOKEN }}
```

### Server Deploy (.github/workflows/deploy-server.yml)
```yaml
name: Deploy Server

on:
  push:
    branches: [main]
    paths:
      - 'packages/server/**'
      - 'packages/shared/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: railway deploy --token ${{ secrets.RAILWAY_TOKEN }}
```

## Troubleshooting

### `pnpm install` fails
```bash
rm -rf node_modules packages/*/node_modules
pnpm install
```

### Port conflict (5173 or 3000 in use)
```bash
# Kill process
lsof -i :5173 | grep -v PID | awk '{print $2}' | xargs kill -9
```

### Shared package changes not reflected
```bash
# Rebuild shared
pnpm --filter @axm/cg-shared build

# Reinstall dependents
pnpm install
```

## Key Files

- `package.json` – Root workspace config
- `pnpm-workspace.yaml` – Workspace definition
- `packages/client/package.json` – Client manifest
- `packages/server/package.json` – Server manifest
- `packages/shared/package.json` – Shared manifest
- `DEPLOY_CLIENT.md` – Client deployment docs
- `DEPLOY_SERVER.md` – Server deployment docs

## Next Steps

1. **Push this refactored repo to GitHub** (with your token)
2. **Set up client deployment** (Vercel/Netlify)
3. **Set up server deployment** (Railway/Heroku)
4. **Configure CI/CD** (GitHub Actions)
5. **Wire tRPC routes** and start backend integration

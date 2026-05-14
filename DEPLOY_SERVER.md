# Server Deployment Configuration

## Railway Deployment

### railway.json
```json
{
  "build": {
    "builder": "nixpacks",
    "buildCommand": "cd packages/server && pnpm build"
  },
  "start": "cd packages/server && pnpm start"
}
```

### Environment Variables
```
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/commonground
ANTHROPIC_API_KEY=sk-...
JWT_SECRET=your-secret
```

## Heroku Deployment

### Procfile
```
web: cd packages/server && pnpm start
release: cd packages/server && pnpm migrate
```

### Environment Variables
Set via Heroku Dashboard or CLI:
```bash
heroku config:set DATABASE_URL=postgresql://...
heroku config:set ANTHROPIC_API_KEY=sk-...
heroku config:set JWT_SECRET=...
```

## Docker Deployment

### Dockerfile (Root)
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/server ./packages/server
COPY packages/shared ./packages/shared

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build
WORKDIR /app/packages/server
RUN pnpm build

# Start
EXPOSE 3000
CMD ["pnpm", "start"]
```

## Deployment Steps

### Railway
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
railway up
```

### Heroku
```bash
# Install Heroku CLI
npm i -g heroku

# Login
heroku login

# Create app
heroku create commonground-api

# Deploy
git push heroku main
```

### Docker
```bash
# Build
docker build -t commonground-api .

# Run
docker run -p 3000:3000 \
  -e DATABASE_URL=... \
  -e ANTHROPIC_API_KEY=... \
  commonground-api
```

## Database Migrations

### Before First Deployment
```bash
cd packages/server
pnpm migrate
```

### Ongoing
```bash
# Create migration
pnpm drizzle:generate

# Run migration
pnpm drizzle:migrate
```

## Health Check

### Verify Deployment
```bash
curl https://api.commonground.app/health
# Should return: { "status": "ok" }
```

## Notes
- Server is independently deployable
- Requires PostgreSQL instance
- Environment variables must be set before start
- Use managed database (Heroku Postgres, Railway Postgres, AWS RDS)
- Monitor logs: `railway logs` or `heroku logs --tail`

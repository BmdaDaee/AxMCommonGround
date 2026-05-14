# Vercel / Netlify Deployment Config for CommonGround Client

## Vercel Configuration

### vercel.json
```json
{
  "buildCommand": "cd packages/client && pnpm build",
  "outputDirectory": "packages/client/dist",
  "env": {
    "VITE_TRPC_URL": "@trpc-url"
  },
  "regions": ["sfo1"]
}
```

### Environment Variables
```
VITE_TRPC_URL=https://api.commonground.app
```

## Netlify Configuration

### netlify.toml
```toml
[build]
  command = "cd packages/client && pnpm build"
  publish = "packages/client/dist"
  functions = "packages/client/functions"

[build.environment]
  VITE_TRPC_URL = "https://api.commonground.app"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Deployment Steps

### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (from repo root)
vercel
```

### Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy (from repo root)
netlify deploy --prod --dir packages/client/dist
```

## Notes
- Client is independently deployable
- Requires VITE_TRPC_URL pointing to backend API
- Static SPA (pre-render friendly)
- No server-side code in client package

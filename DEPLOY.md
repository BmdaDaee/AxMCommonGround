# Deploying CommonGround Server

## Railway (recommended — free tier, 5 min setup)

### Steps
1. Go to https://railway.app and sign in with GitHub
2. Click **New Project** → **Deploy from GitHub repo**
3. Select `BmdaDaee/AxMCommonGround`
4. Railway detects `railway.toml` automatically
5. Go to your service → **Variables** tab → add these:

```
DATABASE_URL        = postgresql://postgres:<your-db-password>@db.dskmguzvjnmzvcjemkqz.supabase.co:5432/postgres
ANTHROPIC_API_KEY   = <your-anthropic-key>
ANTHROPIC_MODEL     = claude-sonnet-4-20250514
NODE_ENV            = production
PORT                = 3000
```

6. Railway gives you a public URL like `https://axmcommonground-production.up.railway.app`
7. Copy that URL

### Wire it to the mobile app
In `packages/mobile/app.json`, update the `extra` field:
```json
"extra": {
  "apiUrl": "https://your-railway-url.up.railway.app"
}
```

Or set it as an EAS secret:
```bash
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value https://your-url.up.railway.app
```

---

## Render (alternative free tier)

1. Go to https://render.com → New → Web Service
2. Connect GitHub → select `BmdaDaee/AxMCommonGround`
3. Build command: `pnpm --filter @axmcommonground/server install && pnpm --filter @axmcommonground/server build`
4. Start command: `node packages/server/dist/index.js`
5. Add same env vars as above
6. Copy the public URL, wire to mobile app same way

---

## Notes
- Free tiers on Railway and Render spin down after inactivity — first request after sleep takes ~30s
- Upgrade to paid ($5-10/mo) when you have real users to avoid cold starts
- Supabase database is already live — no DB deployment needed

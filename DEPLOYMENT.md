# CommonGround Deployment Guide

## Immediate Next Steps (48 hours)

### 1. Build & Test Backend Compilation
```bash
cd packages/server
pnpm install
pnpm build

# Test locally
pnpm start
# Should see: ✅ Server running on port 3000
# Test: curl http://localhost:3000/health
```

**What to expect:**
- TypeScript compiles to `dist/` folder
- Railway picks it up automatically
- tRPC routes at `/trpc/*`

### 2. Build & Test Mobile App
```bash
cd packages/mobile
pnpm install

# Test on iOS simulator
pnpm ios

# Test on Android emulator
pnpm android
```

**What to test:**
1. **Auth flow**: Signup → get JWT → stored in SecureStore
2. **Pair creation**: Invite → accept code → see dashboard
3. **Messaging**: Send message → appears in history
4. **Bently**: Message Bently → get Groq response
5. **Navigation**: All screen transitions work

### 3. Verify API Connectivity

From mobile app, verify the tRPC client is communicating:
- Check SecureStore has auth token
- Check API_URL env var is set
- Verify Authorization header is sent

## Environment Setup

**Backend requires:**
- DATABASE_URL (Supabase PostgreSQL)
- JWT_SECRET (any random string)
- GROQ_API_KEY (from groq.com)
- NODE_ENV=production
- PORT=3000

**Mobile requires:**
- EXPO_PUBLIC_API_URL pointing to backend

All are configured in Railway env vars and app.json already.

## Weekly Checklist (First Month)

- [ ] Day 1: Backend compiles, health check works
- [ ] Day 2: Mobile app builds without errors
- [ ] Day 3: Auth flow works end-to-end
- [ ] Day 4: Can create/join pairs
- [ ] Day 5: Messages send and appear
- [ ] Day 6: Bently responds with AI
- [ ] Day 7: One successful pair conversation

## Production Distribution

### Play Store (Android)
```bash
cd packages/mobile
eas build --platform android --release
```
- Requires Google Play Developer Account ($25 one-time)
- 2-4 hours review time

### App Store (iOS)
```bash
cd packages/mobile
eas build --platform ios
```
- Requires Apple Developer Account ($99/year)
- 24-48 hours review time

### Immediate Testing (Free)
- AltStore (iOS sideload)
- F-Droid (Android open-source store)
- Direct APK distribution (Android)

## Monitoring

### Backend
- Railway logs at https://railway.app
- Supabase dashboard at https://app.supabase.com
- tRPC error rates in production

### Mobile
- Crash logs (integrate Sentry later)
- Analytics on signup/pair creation
- API latency

## Common Issues

### "Cannot POST /trpc/..."
- Server running in fallback mode
- Check Railway logs for build errors
- Run `pnpm build` locally to verify TypeScript

### "JWT token invalid"
- Token expired (30 days)
- Re-login to get fresh token

### "Pair not found"
- Complete onboarding first
- Check pair was created in Supabase dashboard

### "Groq rate limited"
- Wait a minute or switch provider
- Groq free tier is sufficient for MVP

## Git Workflow

```bash
git clone https://github.com/BmdaDaee/AxMCommonGround.git
cd AxMCommonGround
pnpm install

# Test changes locally
cd packages/server && pnpm build && pnpm start
cd packages/mobile && pnpm ios

# Push changes
git push origin your-branch
```

## Key URLs

- **API**: https://axmcommonground-production.up.railway.app
- **GitHub**: https://github.com/BmdaDaee/AxMCommonGround
- **Supabase Console**: https://app.supabase.com
- **Railway Dashboard**: https://railway.app

## What's Ready to Test

✅ Backend with 13 tRPC endpoints
✅ Mobile app with 7 screens
✅ Database schema (users, pairs, invites, messages)
✅ Auth flow (JWT + SecureStore)
✅ Pair management (create, join, list)
✅ Messaging system
✅ Bently AI integration (Groq ready)
✅ Dark editorial design system
✅ Deployment infrastructure

Next: Build to device and test the flows.

# CommonGround

A relational state-first communication platform for couples, powered by Bently—the AI relationship mediator.

## Core Architecture

```
Mobile App (Expo React Native)
    ↓
tRPC Client (SecureStore JWT + httpBatchLink)
    ↓
Express + tRPC Backend (Railway)
    ↓
Supabase PostgreSQL + Groq AI
```

## Project Structure

```
packages/
├── server/          # Express + tRPC backend
│   ├── src/
│   │   ├── routers/     # auth, pairs, messages, bently
│   │   ├── services/    # AI providers (groq, claude, venice)
│   │   ├── db/          # Drizzle ORM + schema
│   │   ├── app.ts       # Express setup
│   │   └── trpc.ts      # tRPC context & procedures
│   └── dist/            # Compiled output
│
├── mobile/          # Expo React Native app
│   ├── app/
│   │   ├── (auth)/              # Login, Signup
│   │   ├── (onboarding)/        # Invite, Join
│   │   ├── (app)/               # Dashboard, Bently, Messages
│   │   ├── index.tsx            # Auth routing
│   │   └── _layout.tsx          # Root layout
│   ├── src/lib/
│   │   ├── trpc.ts              # tRPC client setup
│   │   └── auth.ts              # Auth utilities
│   └── app.json                 # Expo config
│
└── client/          # (unused, included for compatibility)
```

## Screens

### Auth
- **Login** - Email/password login
- **Signup** - Create new account

### Onboarding
- **Invite** - Create invite code (clipboard + share)
- **Join** - Accept invite code

### App
- **Dashboard** - View pair status, relational state
- **Bently** - Chat with AI mediator (coachSolo mode)
- **Messages** - Text directly with partner

## Features Implemented

✅ **Backend**
- Express + tRPC server with proper error handling
- JWT auth with SecureStore on mobile
- Pair creation & management (invites, dissolution)
- Message routing between partners
- Bently integration (single & dual mode ready)
- Groq AI provider (llama-3.3-70b-versatile)

✅ **Mobile**
- Expo Router file-based navigation
- Dark editorial design (#080808 + #D4AF37)
- Secure token storage (expo-secure-store)
- tRPC integration with auth headers
- All core screens with proper styling

✅ **Database**
- Supabase PostgreSQL with Drizzle ORM
- Schema: users, pairs, invites, messages, relational_state_history
- Migrations applied

✅ **Deployment**
- Railway: https://axmcommonground-production.up.railway.app
- Groq API: Free tier
- Supabase: Free tier
- Cost: $0/month

## Quick Start (Local Development)

### Backend
```bash
cd packages/server
pnpm install
pnpm dev
# http://localhost:3000
```

### Mobile
```bash
cd packages/mobile
pnpm install
pnpm ios  # or pnpm android
```

### Environment Variables

**Backend** (`.env`):
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
GROQ_API_KEY=gsk_...
ANTHROPIC_API_KEY=sk-ant-...  (optional)
VENICE_API_KEY=...  (optional)
NODE_ENV=production
PORT=3000
```

**Mobile** (`app.json`):
```json
"env": {
  "EXPO_PUBLIC_API_URL": "https://axmcommonground-production.up.railway.app"
}
```

## API Endpoints

### Auth
- `auth.signup` - Create account
- `auth.login` - Login
- `auth.verifyToken` - Check token validity

### Pairs
- `pairs.createInvite` - Generate invite code
- `pairs.acceptInvite` - Join pair with code
- `pairs.getMyPair` - Get current pair
- `pairs.getInviteStatus` - Check invite status
- `pairs.dissolvePair` - End relationship

### Messages
- `messages.sendMessage` - Send message in pair
- `messages.getMessages` - Get message history

### Bently
- `bently.coach` - Chat with AI (pair mode)
- `bently.coachSolo` - Chat with AI (solo mode)

## Design System

- **Background**: #080808 (dark editorial)
- **Accent**: #D4AF37 (gold)
- **Font**: SpaceMono (monospace)
- **Borders**: #222, #333 (subtle)
- **State Colors**:
  - ALIGNED: #4CAF50 (green)
  - DORMANT: #FFC107 (amber)
  - MISALIGNED: #FF9800 (orange)
  - CAPACITY_BLOCKED: #F44336 (red)
  - TRUST_FRACTURED: #9C27B0 (purple)

## Authentication Flow

1. User signs up/logs in on mobile
2. Backend returns JWT token
3. Mobile stores token in SecureStore
4. All tRPC calls include `Authorization: Bearer <token>`
5. Backend validates token in protectedProcedure

## Deployment Checklist

- [x] Backend deployed to Railway
- [x] Database connected (Supabase)
- [x] Auth routers working
- [x] Pairs management working
- [x] Messages routers working
- [x] Bently integration ready
- [x] Mobile app screens built
- [x] Mobile tRPC client configured
- [ ] Build & test mobile app on device
- [ ] Enable Play Store distribution
- [ ] Enable App Store distribution
- [ ] AltStore/Sideloadly setup (iOS)
- [ ] F-Droid/APK setup (Android)

## What's Next

1. **Test end-to-end**: Build mobile app, test auth flow
2. **Verify tRPC routes**: Check all endpoints work
3. **Mobile distribution**: Build APK, setup stores
4. **Bently refinement**: Test AI responses on device
5. **Signal collection**: Wire relational engine to messages
6. **DeeplyUs integration**: Activate sexual communication layer

## Key Principles

- **Bently is infrastructure, not a character layer** — Users never interact with Keystone directly
- **No firebase, no MongoDB** — Supabase PostgreSQL is definitive
- **State-first design** — Relational engine drives all intervention
- **Duality protected** — Both partners see Bently, never taken sides
- **Dark editorial aesthetic** — Locked in, no deviation

## Support

For issues, check the [GitHub repo](https://github.com/BmdaDaee/AxMCommonGround).

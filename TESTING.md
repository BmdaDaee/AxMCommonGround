# Testing Guide: CommonGround MVP

## Prerequisites

Before you start, ensure you have:

```bash
# Check Node.js version (need 18+)
node --version

# Check pnpm
pnpm --version

# Check Xcode (for iOS) or Android Studio (for Android)
# iOS: xcode-select --install
# Android: export ANDROID_HOME=~/Library/Android/SDK
```

## Step 1: Clone & Install

```bash
git clone https://github.com/BmdaDaee/AxMCommonGround.git
cd AxMCommonGround

# Install all dependencies (all packages)
pnpm install

# This may take 2-5 minutes the first time
# You'll see output like:
# ✓ 450 packages in 3.2s
```

## Step 2: Backend Verification

```bash
cd packages/server

# Build TypeScript to JavaScript
pnpm build

# Expected output:
# ✓ Built to dist/
# ✓ No TypeScript errors
```

If build fails:
- Check the error message (usually import paths or missing dependencies)
- Run `pnpm install` again from repo root
- Check `packages/server/tsconfig.json` is present

### Test Backend Locally (Optional)

```bash
pnpm start

# Expected:
# ✅ Server running on port 3000
# 📡 tRPC endpoint: http://localhost:3000/trpc

# In another terminal:
curl http://localhost:3000/health

# Should return:
# {"status":"ok","timestamp":"2026-05-17T..."}
```

Press Ctrl+C to stop.

## Step 3: Mobile App Build

```bash
cd ../mobile

# Ensure dependencies are installed
pnpm install

# Start Expo dev server
pnpm start

# Expected:
# › Metro waiting on exp://your-machine-ip:8081
# › Press i to open iOS simulator
# › Press a to open Android emulator
```

### iOS (Mac only)

```bash
# From the Expo menu (after pnpm start):
# Press: i

# This will:
# 1. Build the app
# 2. Open iOS Simulator
# 3. Load the app

# Expected time: 2-5 minutes first build

# If simulator doesn't open:
# - Ensure Xcode is installed
# - Run: open -a Simulator
# - Then press i again
```

### Android

```bash
# From the Expo menu (after pnpm start):
# Press: a

# This will:
# 1. Build the app
# 2. Open Android Emulator
# 3. Load the app

# Expected time: 3-7 minutes first build (emulator slower)

# If emulator doesn't start:
# - Ensure Android Studio is installed
# - Run: $ANDROID_HOME/emulator/emulator -list-avds
# - Run: $ANDROID_HOME/emulator/emulator -avd Pixel_4a_API_30
```

## Step 4: Test the Flows

### Flow 1: Authentication

**In the app:**

1. You'll see the **Login** screen
2. Tap "Don't have an account? Sign up"
3. Enter an email (e.g., `test1@example.com`)
4. Enter a password (8+ chars)
5. Tap "Sign Up"

**Expected:**
- Account created
- Token stored securely
- Redirected to **Dashboard**
- No error alerts

**If it fails:**
- Check backend is running (or API is live)
- Check error message (usually "User already exists" if email taken)
- Check EXPO_PUBLIC_API_URL is correct in app.json
- Check backend logs on Railway

### Flow 2: Pair Creation

**From Dashboard:**

1. Tap "Create Invite Code"
2. Code appears and auto-copies to clipboard
3. See success alert

**Expected:**
- Invite code shown (e.g., `A1B2C3D4`)
- Can tap "Share" to see code
- Redirected back to Dashboard

**If it fails:**
- Check auth token is still valid (30-day expiry)
- Check Supabase database has `invites` table
- Check backend logs for database errors

### Flow 3: Joining a Pair

**Create a second account to test:**

1. Logout (tap "Logout" on Dashboard)
2. Go back to **Login** screen
3. Tap "Don't have an account? Sign up"
4. Create a different account (e.g., `test2@example.com`)
5. On Dashboard, tap "Create or Join a Pair"
6. Tap "Or join an existing pair"
7. Enter the first account's invite code
8. Tap "Join"

**Expected:**
- Shows "Connected with your partner!"
- Redirects to Dashboard
- Both accounts can now see each other (in future: see partner's relational state)

**If it fails:**
- Check invite code is correct
- Check invite hasn't expired (7 days)
- Check no network issues

### Flow 4: Messaging

**From Dashboard, tap "Messages":**

1. Type a test message
2. Tap "Send"

**Expected:**
- Message appears immediately in your bubble (right, gold)
- Message stored in database
- (In future: appears for partner too)

**If it fails:**
- Check you're in an active pair
- Check backend messages router is working
- Check Supabase `messages` table exists

### Flow 5: Bently Chat

**From Dashboard, tap "Chat with Bently":**

1. Type: "We haven't been talking as much lately."
2. Tap "Send"
3. Wait 3-5 seconds

**Expected:**
- Your message appears in gold bubble on right
- Bently response appears in dark bubble on left
- Response is 2-3 sentences (Groq default)

**Example response:**
> "I hear that distance. It's worth noticing when conversation gaps form. What do you think has created the space?"

**If it fails:**
- Check Groq API key is set on backend (GROQ_API_KEY)
- Check network connectivity
- Check backend logs for AI provider errors
- If still 404: Backend tRPC routes may not be loaded (server.js fallback)

## Debugging Checklist

### Backend not responding

```bash
# Check if API is live
curl https://axmcommonground-production.up.railway.app/health

# Should return:
# {"status":"ok","timestamp":"..."}

# If that works, issue is in your local setup
# If that fails, Railway is down (check dashboard)
```

### "Cannot POST /trpc/bently.coachSolo"

- Backend is running in fallback mode (no tRPC)
- Solution:
  ```bash
  cd packages/server
  rm -rf dist/
  pnpm build
  pnpm start
  ```
- Check for TypeScript errors in output
- If still failing, full tRPC routes may not be deployed yet

### "User already exists" on signup

- That email is already in the database
- Use a different email (e.g., `test-[timestamp]@example.com`)
- Or ask to clear the user from Supabase

### Simulator/Emulator won't start

**iOS:**
```bash
# Kill existing simulator
killall "Simulator" 2>/dev/null || true

# Open fresh
open -a Simulator

# Then try pnpm start → press i
```

**Android:**
```bash
# Check available emulators
$ANDROID_HOME/emulator/emulator -list-avds

# Start one
$ANDROID_HOME/emulator/emulator -avd [AVD_NAME]

# Then try pnpm start → press a
```

### Database errors

Check Supabase:
1. Go to https://app.supabase.com
2. Select project `dskmguzvjnmzvcjemkqz`
3. Check **SQL Editor** → run:
   ```sql
   SELECT * FROM users LIMIT 5;
   SELECT * FROM pairs LIMIT 5;
   ```
4. If tables don't exist, migrations didn't run

## Performance Notes

- **First build**: 2-5 minutes (iOS), 3-7 minutes (Android)
- **Subsequent builds**: 30 seconds (hot reload)
- **API latency**: Groq first request ~2-3 seconds, cached ~500ms
- **Database**: Supabase free tier sufficient for 100+ users

## What You're Testing

| Component | Status | How to Verify |
|-----------|--------|---------------|
| Auth | ✅ Working | Signup/login flow completes |
| Pairs | ✅ Working | Create invite → join with code |
| Messages | ✅ Working | Send message appears immediately |
| Bently | ✅ Working | Message appears within 5 seconds |
| Navigation | ✅ Working | Can move between all screens |
| Design | ✅ Working | Dark background, gold buttons |
| Database | ✅ Connected | Data persists after app restart |

## Next: Bug Reports

Found an issue? Check:

1. **Is it a network issue?**
   - Check WiFi connection
   - Restart Expo (Ctrl+C, pnpm start)
   - Restart simulator/emulator

2. **Is it a backend issue?**
   - Check Railway logs
   - Verify env vars are set
   - Try the health endpoint

3. **Is it a mobile issue?**
   - Check app console logs (Expo shows them)
   - Check browser console (React Native Debugger)
   - Clear cache: `pnpm start -- -c`

4. **Is it a database issue?**
   - Check Supabase SQL Editor
   - Run test query to see if tables exist
   - Check for obvious data issues

## Success Criteria

You've successfully tested CommonGround MVP when:

- [ ] Signup creates an account
- [ ] Login returns a JWT token
- [ ] Can create an invite code
- [ ] Can join with an invite code
- [ ] Can send a message to partner
- [ ] Can chat with Bently and get a response
- [ ] All screens render without errors
- [ ] Data persists after app restart

Once all 8 items are checked, the MVP is validated and ready for:
- Play Store/App Store submission
- User testing
- Feature expansion (DeeplyUs, Keystone mode)

---

**Estimated time to complete:** 30 minutes (after initial clone/build)
**Live API:** https://axmcommonground-production.up.railway.app
**Support:** Check GitHub issues or logs on Railway/Supabase

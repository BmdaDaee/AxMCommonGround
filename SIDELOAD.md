# Sideloading CommonGround

## iOS — AltStore (no jailbreak, no developer account)

### Build the IPA
```bash
cd packages/mobile
pnpm install
eas build --platform ios --profile sideload
```
EAS builds in the cloud and gives you a download link for the `.ipa`.

### Install via AltStore
1. Install AltStore on your Mac/PC: https://altstore.io
2. Install AltStore on your iPhone via AltServer
3. Open AltStore on iPhone → tap + → select the `.ipa`
4. Re-sign every 7 days (free Apple ID limit) or use AltStore PAL if in EU

### Alternative: Sideloadly
1. Download Sideloadly: https://sideloadly.io
2. Connect iPhone via USB
3. Drag `.ipa` into Sideloadly → sign with Apple ID → install

---

## Android — Direct APK or F-Droid

### Build the APK
```bash
cd packages/mobile
pnpm install
eas build --platform android --profile fdroid
```
EAS gives you a download link for the `.apk`.

### Option A: Direct install (simplest)
1. Transfer `.apk` to Android device
2. Settings → Install unknown apps → allow your file manager
3. Tap the `.apk` to install

### Option B: Self-hosted F-Droid repo
1. Install fdroidserver: `pip install fdroidserver`
2. Init your repo: `fdroid init`
3. Place the `.apk` in `repo/`
4. Place `fdroid/metadata/com.axm.commonground.yml` in `metadata/`
5. Run `fdroid update && fdroid deploy`
6. Host on GitHub Pages, Netlify, or Cloudflare Pages
7. On device: F-Droid → Settings → Repos → add your URL

---

## Backend deployment

Both apps need `EXPO_PUBLIC_API_URL` pointing at a live server.
Cheapest options: Railway, Render, Fly.io (all have free tiers).
Connect the GitHub repo and set env vars in the platform dashboard.

Required server env vars — set in your deployment platform, never in the repo:
- DATABASE_URL
- ANTHROPIC_API_KEY
- ANTHROPIC_MODEL=claude-sonnet-4-20250514
- PORT=3000
- NODE_ENV=production

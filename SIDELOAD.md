# CommonGround — Sideload Installation Guide

> **CommonGround** is a relational communication platform for couples.
> **Bently** is the third presence — a mediator, not a coach or chatbot.
> This guide is for installing pre-release builds on your personal device.

---

## Why Sideloading?

CommonGround is in active development and not yet on the App Store or Play Store. Sideloading lets you install the app directly from a build artifact, bypassing app store review. This is for testers, contributors, and early users only.

⚠️ **Sideload builds are not production releases.** They may contain bugs, incomplete features, or unstable behavior. Do not use them as your primary relational tool until v1.0 ships.

---

## Getting the Build

1. Go to [Actions](https://github.com/BmdaDaee/AxMCommonGround/actions)
2. Click the most recent successful **"Build iOS IPA & Android APK for Sideloading"** run
3. Scroll to the bottom → **Artifacts** section
4. Download the artifact matching your platform:
   - **Android**: artifact contains `CommonGround-YYYYMMDD-HHMMSS.apk`
   - **iOS**: artifact contains `CommonGround-YYYYMMDD-HHMMSS.ipa`
5. Unzip the artifact — the APK or IPA file is inside

---

## Android Installation

### Option A — Sideloadly (recommended for non-technical users)
1. Install [Sideloadly](https://sideloadly.io/) on your computer
2. Connect your Android phone via USB with **USB Debugging** enabled
   - Enable on phone: Settings → About phone → tap "Build number" 7 times → back → Developer options → enable USB debugging
3. Drag the `.apk` file into Sideloadly
4. Click **Start** — installs in ~30 seconds

### Option B — ADB (for developers)
```bash
adb install CommonGround-YYYYMMDD-HHMMSS.apk
```
If you get "INSTALL_FAILED_UPDATE_INCOMPATIBLE", uninstall the previous version first:
```bash
adb uninstall com.axm.commonground
adb install CommonGround-YYYYMMDD-HHMMSS.apk
```

### Option C — Direct Install (no computer needed)
1. Transfer the APK to your phone (email, Google Drive, USB)
2. Tap the APK file in your file manager
3. Allow "Install from unknown sources" when prompted
4. Tap **Install**

---

## iOS Installation

iOS is stricter than Android — you need a tool to bypass Apple's signing requirements.

### Option A — AltStore (recommended, free)
1. Install [AltStore](https://altstore.io/) on your computer (Mac or Windows)
2. Install **AltServer** and the **AltStore app** on your iPhone
3. Open AltStore on your iPhone
4. Tap **+** in the top-left
5. Select the `.ipa` file (transfer it via AirDrop or iCloud first)
6. Sign in with your Apple ID when prompted (free Apple ID works)
7. AltStore installs the app — refresh every 7 days to keep it signed

### Option B — Sideloadly (free, simpler setup)
1. Install [Sideloadly](https://sideloadly.io/) on your computer
2. Connect your iPhone via USB
3. Drag the `.ipa` into Sideloadly
4. Enter your Apple ID and password (free Apple ID works)
5. Click **Start** — installs in ~2 minutes
6. On first launch: Settings → General → VPN & Device Management → trust the developer profile

### Option C — Xcode (for developers with paid Apple Developer account)
1. Open Xcode → Window → **Devices and Simulators**
2. Select your connected iPhone
3. Drag the `.ipa` into the **Installed Apps** section
4. Installs immediately with your dev signing

### iOS Refresh Notes
- **Free Apple ID**: Signed builds expire every **7 days**. Re-sign with AltStore/Sideloadly.
- **Paid Apple Developer ($99/year)**: Builds last **1 year** without re-signing.

---

## Troubleshooting

### Android: "App not installed"
- Uninstall any previous version of CommonGround first
- Check storage space (need ~150 MB free)
- Try ADB with verbose output: `adb install -r -d CommonGround.apk`

### iOS: "Untrusted Developer"
- Settings → General → VPN & Device Management → tap the developer profile → **Trust**

### iOS: "Unable to install" / signing errors
- Free Apple IDs are limited to **3 sideloaded apps at a time** — uninstall something else
- Make sure your computer and phone are on the same Wi-Fi (for AltStore)
- Try restarting both devices

### Build won't open / immediately crashes
- This is a sideload build — it may have unstable code
- Check the **commit hash** in the artifact name and report the issue with that hash
- File an issue at https://github.com/BmdaDaee/AxMCommonGround/issues

---

## Connecting to the Backend

Sideload builds connect to the live Railway backend by default:
- **Backend URL**: `https://axmcommonground-production.up.railway.app`
- **AI inference**: Groq (free tier)

You'll need an **invite code** to register a couple pair. The platform uses delayed activation — both partners must register before the relational engine activates.

---

## Reporting Issues

When reporting bugs from sideload builds, please include:
- **Build artifact name** (e.g. `sideload-build-29-20260520-001234-a1b2c3d`)
- **Platform & OS version** (e.g. iPhone 14 / iOS 17.5)
- **Steps to reproduce**
- **What you expected vs. what happened**

File issues at: https://github.com/BmdaDaee/AxMCommonGround/issues

---

## Updating to New Builds

When a new sideload build is available:
- **Android**: Just install the new APK on top — your data persists
- **iOS (AltStore/Sideloadly)**: Delete the old version first, then sideload the new one (free Apple ID limitation)
- **iOS (paid dev account)**: Install new version on top — data persists

---

## What's Inside a Sideload Build

Each artifact contains:
- `CommonGround-{timestamp}.apk` or `.ipa` — the app binary
- `BUILD_INFO.txt` — build #, commit hash, timestamp, attempt
- Installation instructions (this guide, abbreviated)

Builds are signed with debug certificates only — they are not for App Store distribution.

---

## Privacy & Data

Sideload builds connect to the same production backend as future store releases. Your data is real and persistent. If you want to test without persistence, ask in the issues for a dev backend invite code.

---

**You're holding a pre-release build of something we're building together. Treat it like an early draft — the structure is solid, the polish is coming.**

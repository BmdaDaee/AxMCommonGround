# Amazon Appstore Distribution

## Why Amazon
- Free developer account (no $25 fee)
- Available on Android devices via the Amazon Appstore app
- Also available on Fire tablets and Fire TV
- Users can sideload the Amazon Appstore on any Android device

## Setup (one time)
1. Create a free Amazon Developer account: https://developer.amazon.com
2. Go to the Appstore console: https://developer.amazon.com/apps-and-games
3. Click **Add a New App** → Android
4. Fill in app details — use info from app.json

## Build the APK
```bash
cd packages/mobile
eas build --platform android --profile amazon
```

## Submit
1. Download the `.apk` from the EAS build link
2. In Amazon Developer Console → your app → **Binary File(s)**
3. Upload the APK
4. Fill in store listing (description, screenshots, icon)
5. Submit for review — Amazon reviews take 1-3 days

## For beta testing before submission
Use the **Live App Testing** feature in Amazon Developer Console:
- Invite testers by email
- They get access before the app is publicly listed
- No review required for this stage

## Notes
- Amazon Appstore APK is the same build as F-Droid/sideload
- Users who don't have Amazon Appstore installed can enable
  "Install unknown apps" and sideload the APK directly from a link
- Good distribution strategy: Amazon Appstore for discoverability,
  direct APK link + F-Droid repo for users who prefer it

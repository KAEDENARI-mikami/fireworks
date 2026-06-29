# Fireworks Ads / Store Setup

## Current State

- Web remains the canonical game surface.
- Capacitor wraps the same `web/` assets for Android and iOS.
- Rewarded ads grant `+5 黒色火薬` on completion.
- 黒色火薬 is the shop currency layer: free/ad-earned for now, with room for a paid currency model later if needed.
- Localhost and `file:` use a mock rewarded ad so the reward flow can be checked without native SDKs.
- Android is synced with `@capacitor-community/admob`.
- iOS native dependency install is blocked until Xcode and CocoaPods are available.

## Production AdMob IDs

Create an Android app and rewarded ad unit in AdMob, then provide the IDs when building:

```bash
export FIREWORKS_ADMOB_APP_ID="ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy"
export FIREWORKS_ADMOB_REWARDED_ANDROID_ID="ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy"
export FIREWORKS_ADMOB_PUBLISHER_ID="pub-xxxxxxxxxxxxxxxx"
export FIREWORKS_ADS_TESTING=false
```

The native Android app ID is injected into `@string/admob_app_id` during the Gradle build. The rewarded ad unit ID is written into `web/fireworks.config.js` during `npm run sync:web`.

For iOS later, also set:

```bash
export FIREWORKS_ADMOB_REWARDED_IOS_ID="ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy"
```

Current source defaults are Google test IDs and are not suitable for production.

If AdMob prompts for app-ads.txt, generate it after setting `FIREWORKS_ADMOB_PUBLISHER_ID`:

```bash
npm run admob:app-ads
```

The generated `app-ads.txt` must be published at the developer website root.

## Commands

```bash
npm run sync:web
npx cap sync android
npx cap open android
```

For iOS, install Xcode and CocoaPods first:

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
sudo gem install cocoapods
npx cap sync ios
npx cap open ios
```

## Store Release Checklist

See also: `docs/GOOGLE_PLAY_RELEASE.md` for Android AAB signing and Play Console steps.

- Replace AdMob test app IDs and rewarded ad unit ID.
- Confirm ATT prompt copy on iOS.
- Add privacy policy URL for location, ads, and local persistence.
- Run `npm run play:preflight` before uploading an Android AAB.
- Verify rewarded ad completion grants exactly `+5 黒色火薬` per completed ad.
- Verify rewarded ad cancellation grants no reward.
- Verify shop purchases consume 黒色火薬, not SPARK.
- Verify Web PWA still works without native ad SDK.
- Capture Android and iOS screenshots for store listing.
- Prepare store copy that explains location usage as gameplay, not background tracking.

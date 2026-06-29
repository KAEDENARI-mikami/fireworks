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

Edit `fireworks.config.js` before production release:

```js
window.FireworksAdsConfig = {
  rewardedAdId: "ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy",
  testing: false,
  npa: false,
};
```

The native App IDs also need production values:

- Android: `android/app/src/main/AndroidManifest.xml`
- iOS: `ios/App/App/Info.plist`

Current values are Google test IDs.

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
- Verify rewarded ad completion grants exactly `+5 黒色火薬` per completed ad.
- Verify rewarded ad cancellation grants no reward.
- Verify shop purchases consume 黒色火薬, not SPARK.
- Verify Web PWA still works without native ad SDK.
- Capture Android and iOS screenshots for store listing.
- Prepare store copy that explains location usage as gameplay, not background tracking.

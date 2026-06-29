# Google Play Release Checklist

This project ships the web game through Capacitor as an Android app.

## Current Android identity

- App name: `Fireworks`
- Package name / applicationId: `com.mikamiatsushiya.fireworks`
- Minimum SDK: 23
- Target SDK: 35
- Release AAB command: `npm run android:bundle:release`
- Release AAB output: `android/app/build/outputs/bundle/release/app-release.aab`

Do not change the package name after the first Play Console upload unless you are intentionally creating a separate app.

## Build commands

```bash
npm ci
npm run cap:sync:android
npm run android:assemble:debug
npm run android:bundle:release
```

`cap:sync:android` copies `index.html`, `manifest.webmanifest`, `sw.js`, `icon.svg`, and `fireworks.config.js` into `web/`, then syncs them into the Android project.

## Upload-key signing

Generate an upload key outside the repository:

```bash
keytool -genkeypair \
  -v \
  -keystore "$HOME/.fireworks-play/fireworks-upload.jks" \
  -alias fireworks-upload \
  -keyalg RSA \
  -keysize 4096 \
  -validity 10000
```

Before building the Play upload AAB, provide signing secrets through environment variables or local Gradle properties. Do not commit the keystore or passwords.

```bash
export FIREWORKS_RELEASE_STORE_FILE="$HOME/.fireworks-play/fireworks-upload.jks"
export FIREWORKS_RELEASE_STORE_PASSWORD="..."
export FIREWORKS_RELEASE_KEY_ALIAS="fireworks-upload"
export FIREWORKS_RELEASE_KEY_PASSWORD="..."
export FIREWORKS_VERSION_CODE=1
export FIREWORKS_VERSION_NAME=1.0

npm run android:bundle:release
```

If signing variables are missing, the build warns and is not suitable for Google Play upload.

## Production IDs and store declarations

Replace test ad IDs before production release:

- Android AdMob app ID: `android/app/src/main/AndroidManifest.xml`
- Rewarded ad unit ID: `fireworks.config.js`

Current Android permissions that must be reflected in Play Console:

- `INTERNET`: map tiles, ads, and WebView network access.
- `ACCESS_COARSE_LOCATION` and `ACCESS_FINE_LOCATION`: foreground GPS gameplay on the exploration map.
- `com.google.android.gms.permission.AD_ID`: rewarded ads / AdMob.

The Play Console Data safety form and privacy policy must cover:

- Location usage for gameplay and map display.
- Advertising ID usage for ads.
- Local save data in `localStorage`.
- Any third-party SDKs or map tile providers used in the shipped build.

## Before first production submission

- Confirm app name and package name.
- Replace all Google test AdMob IDs with production IDs.
- Create and publish a privacy policy URL.
- Complete Play Console Data safety and Ads declarations.
- Enable Play App Signing in Play Console.
- Upload a signed `app-release.aab`.
- Increment `FIREWORKS_VERSION_CODE` for every later upload.
- Capture required phone/tablet screenshots from the Android build.

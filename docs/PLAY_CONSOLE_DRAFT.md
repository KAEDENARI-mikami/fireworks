# Play Console Draft

## Store listing

Short description:

> 現実の位置情報を探索フィールドに変換して、資源を集め、塔を強化し、waveを突破する位置情報タワーディフェンス。

Full description draft:

> Fireworksは、現在地周辺の探索、資源密度、スイートスポット、タワー強化を組み合わせた位置情報タワーディフェンスです。
>
> 探索マップで補給スポットや高密度地点を見つけ、黒色火薬や改装素材を集めます。集めた素材でスキル、研究、タワー改装を強化し、より高いwaveを目指します。
>
> 位置情報はゲーム内の現在地表示、移動距離の計算、周辺スポットの生成に使用されます。バックグラウンド位置情報は使用しません。

Privacy policy URL:

> https://kaedenari-mikami.github.io/fireworks/privacy-policy.html

## Data safety notes

Use these notes when filling the Play Console Data safety form. Review the final shipped SDK list before submission.

- Location
  - Collected/used: Yes, approximate and precise foreground location.
  - Purpose: App functionality / gameplay map / movement distance.
  - Shared by developer backend: No developer backend storage.
  - Background location: No.
- Device or other IDs
  - Collected/used: Yes, Advertising ID through Google Mobile Ads when ads are enabled.
  - Purpose: Advertising, analytics/fraud prevention by ad provider.
- App activity / interactions
  - Ad provider may process ad interaction data.
  - Local game progress is stored on device in localStorage.
- Personal info
  - The app itself does not request account registration, name, email, phone number, or address.

## Ads declaration

- Contains ads: Yes.
- Ad network: Google AdMob.
- Rewarded ads: Yes, used to grant black powder after completed viewing.
- Current test IDs must be replaced before production upload.

## AdMob IDs needed

Create these in AdMob:

- Android app ID: format `ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy`
- Android rewarded ad unit ID: format `ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy`

Set them before production build:

```bash
export FIREWORKS_ADMOB_APP_ID="ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy"
export FIREWORKS_ADMOB_REWARDED_ANDROID_ID="ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy"
export FIREWORKS_ADS_TESTING="false"
```

## Internal testing checklist

- App starts from the installed Android build.
- Exploration screen asks for location only while in use.
- Denying location does not crash the app.
- Rewarded ad can be loaded with production/test mode appropriate for the release track.
- Rewarded ad cancellation grants no black powder.
- Completed rewarded ad grants exactly `+5 黒色火薬`.
- `privacy-policy.html` is reachable over HTTPS.
- Store listing screenshots match the current UI.

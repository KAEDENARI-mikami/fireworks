# Fireworks: Sparking Defense

現実の場所を資源フィールドに変える、位置情報 × 放置タワーディフェンス。

- **Web版**: https://kaedenari-mikami.github.io/fireworks/
- **iPhone / iPad版**: https://apps.apple.com/jp/app/fireworks-sparking-defense/id6789903323

## 遊び方

1. 地図で補給施設やスイートスポットを探す
2. フィールドを選んで打ち上げ台を出撃させる
3. 自動攻撃、採掘機、スキルでWAVEを突破する
4. 持ち帰った資源で塔・スキル・研究・改装を強化する

進行状況は端末内に保存され、離れていた時間の戦闘は再開時に追いつき計算されます。正確な位置情報やアカウントを開発者のサーバーへ保存する仕組みはありません。

## 技術構成

Web本体は単一HTMLのPWAとして動作し、CapacitorでiOS / Androidへパッケージしています。地図表示にはLeaflet、MapLibre、OpenFreeMapを利用しています。

## ライセンス

個人開発・配布用リポジトリです。コードやアセットの利用条件は、各ファイルと配布サービスの規約を確認してください。

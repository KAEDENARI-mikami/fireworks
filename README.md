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

## GitLabでの管理・公開

GitLabへの移行用に、`.gitlab-ci.yml`を用意しています。デフォルトブランチへの更新時に`node scripts/sync-web.mjs`でWeb版を生成し、必要なファイルとJavaScript構文を検証して、`web/`だけをGitLab Pagesへ公開します。Web公開ジョブではnpm依存関係やネイティブSDKのインストールは不要です。

ローカルでWeb版を生成する場合は`npm run sync:web`を実行してください。公開URLはGitLabプロジェクトの **Deploy > Pages** で確認します。GitLab 17.10以降のCI構文を使用しています。

公開URLが変わると、Web版の端末内セーブは新サイトに自動では引き継がれません。旧サイトの「セーブデータ」から暗号化バックアップを書き出し、新サイトで復元してください。移行前の案内、コード・履歴の移送、公開URL・広告・ストア情報の切り替え手順は[GitLab移行手順](docs/GITLAB_MIGRATION.md)に記録しています。

## ライセンス

個人開発・配布用リポジトリです。コードやアセットの利用条件は、各ファイルと配布サービスの規約を確認してください。

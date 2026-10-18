# Small Forest / Smafore

ESP32の温湿度センサーからデータを収集し、Next.jsで現在値と履歴を表示するサービスです。

- 本番: https://smafore.hurin.work
- ホスティング: Vercel（プロジェクト `astify/small-forest`、Root Directory `front`）
- データ保存: AWS DynamoDB（`ap-northeast-1`）
- 共有キャッシュ: Upstash Redis（任意設定）

## ディレクトリ

- `front/`: Next.jsの画面とAPI。Vercelにデプロイします。
- `saturn/`: ESP32ファームウェア。約5分間隔で温湿度をAPIへ送信します。
- `manaru/`: 週次レポート用のLambda・S3・EventBridgeを定義するCDKコード。
  Webアプリのデプロイとは独立しており、現在の稼働状況は未確認です。

## 開発

```bash
cd front
pnpm install --frozen-lockfile
pnpm dev
```

APIでDynamoDBを利用する場合は、`front/.env.local`に`AWS_ACCESS_APP_KEY`と
`AWS_SECRET_APP_KEY`を設定します。認証情報はコミットしないでください。

```bash
pnpm api:build
pnpm test
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

## Vercelでの運用

VercelプロジェクトのRoot Directoryは`front`、Framework PresetはNext.js、Node.jsは22.xです。
本番の画面と`/api/v1/*`はVercelで実行されます。
環境変数はVercelの対象環境に設定してください。

期間指定のUI、API仕様、DB負荷の上限、Upstash設定は[front/README.md](front/README.md#conditions-の期間指定)を参照してください。

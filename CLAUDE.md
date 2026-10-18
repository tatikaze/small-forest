# CLAUDE.md

このファイルはリポジトリで作業する際の構成と開発手順を説明します。

## プロジェクト概要

ESP32の温湿度センサーからデータを収集し、Next.jsで可視化するサービスです。
本番のWebアプリとAPIはVercelで稼働しています。

## アーキテクチャ

- **front/**: Next.js 16 / React 19 / Chakra UI 3
  - App Router、API Routes (`/api/v1/*`)、SWR、Chart.jsを使用
  - DynamoDBに温湿度を保存し、日単位のキャッシュを使って履歴を取得
  - Upstash Redis設定時はインスタンス間でキャッシュを共有
  - Aspidaで型付きAPIクライアントを生成
  - Vercelプロジェクト: `astify/small-forest`、Root Directory: `front`、Node.js: 22.x
  - 本番URL: https://smafore.hurin.work
- **saturn/**: ESP32ファームウェア。約5分間隔で温湿度を送信
- **manaru/**: 週次レポート用のLambda / S3 / EventBridgeのCDKコード
  - Webアプリとは独立した構成。稼働状況は未確認

## 開発コマンド

### フロントエンド (`front/`)

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm api:build
pnpm test
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

API型定義を変更した場合は`pnpm api:build`で`src/api/$api.ts`を再生成してください。
詳細な期間指定仕様、キャッシュTTL、読み取り上限は`front/README.md`を参照してください。

### Arduino / ESP32 (`saturn/`)

```bash
./compile.sh
./upload.sh
```

## データフロー

1. ESP32が温湿度を測定
2. `POST /api/v1/conditions`でVercelのAPIへ送信
3. APIがDynamoDBへ保存
4. SWRが履歴APIを取得し、Chart.jsで表示

## 環境変数とデプロイ

- DynamoDB: `AWS_ACCESS_APP_KEY`、`AWS_SECRET_APP_KEY`。リージョンは`ap-northeast-1`
- Upstash（任意）: `UPSTASH_REDIS_REST_URL`、`UPSTASH_REDIS_REST_TOKEN`
- ローカルは`front/.env.local`、本番はVercelの対象環境に設定
- 認証情報をコミットしたり、`NEXT_PUBLIC_`でブラウザーへ公開しないこと
- Vercelではプロセス内キャッシュの永続性・インスタンス間共有を前提にしないこと

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

IoTデバイス(Arduino/ESP32)から環境データを収集し、Next.jsフロントエンドで可視化するシステム。AWS ECS上で動作。

## アーキテクチャ

- **front/**: Next.js 15 + Chakra UI フロントエンド
  - App Router構造を使用
  - API Routes (`/api/v1/*`) で DynamoDB とやり取り
  - Aspida による型安全なAPIクライアント生成
  - pnpm パッケージマネージャー使用 (Volta で管理)

- **cdk-deploy/**: AWS CDK v2 インフラストラクチャコード
  - ECS Fargate + ALB + Route53 + ACM による本番環境デプロイ
  - VPC endpoints経由でプライベートサブネット内のECSからECR/CloudWatchアクセス
  - DynamoDBアクセス権限をタスクロールに付与

- **manaru/**: 旧AWS CDKスタック（現在は使用していない可能性あり）

- **saturn/**: Arduino/ESP32 ファームウェア
  - 温湿度センサー(DHT)からデータ収集
  - HTTPSでフロントエンドのAPIエンドポイントへPOST

## 開発コマンド

### フロントエンド (front/)
```bash
pnpm dev              # 開発サーバー起動 (Turbopack使用)
pnpm build            # プロダクションビルド
pnpm start            # プロダクションサーバー起動
pnpm lint             # ESLint実行
pnpm api:build        # Aspida型定義生成
```

### CDK (cdk-deploy/)
```bash
npm run build         # TypeScriptコンパイル
npm run watch         # Watch mode
npm test              # Jestテスト実行
npx cdk deploy        # AWSへデプロイ
npx cdk diff          # 変更差分確認
npx cdk synth         # CloudFormationテンプレート生成
```

### Arduino (saturn/)
```bash
./compile.sh          # ファームウェアコンパイル
./upload.sh           # デバイスへアップロード
```

## Docker/ECS デプロイフロー

1. ECRログイン:
   ```bash
   aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin 392453725290.dkr.ecr.ap-northeast-1.amazonaws.com
   ```
   必要に応じて`--profile`オプションでプロファイル指定

2. イメージビルド&プッシュ:
   ```bash
   docker compose -f docker-compose-build.yml build
   docker compose push
   ```
   **注意**: M1/M2 Macでビルドするとアーキテクチャの違いでECS実行時にエラーが発生する可能性あり

3. ECSへデプロイ (オプション):
   ```bash
   docker context create ecs {context-name}
   docker context use {context-name}
   docker compose up
   ```

## 重要な技術スタック

- **フロントエンド**: Next.js 15 (App Router), React 19, Chakra UI v2, Aspida, SWR, Chart.js, DynamoDB SDK
- **インフラ**: AWS CDK v2, ECS Fargate, ALB, Route53, ACM, VPC, DynamoDB
- **IoT**: ESP32, DHT温湿度センサー, WiFi, HTTPS通信
- **パッケージマネージャー**: pnpm (front), npm/yarn (cdk-deploy, manaru)
- **Node.js**: v22.12.0 (Voltaで管理)

## データフロー

1. ESP32 (saturn/) が温湿度データを測定
2. HTTPSで `POST /api/v1/conditions` へデータ送信
3. Next.js API Routes が DynamoDB へ保存
4. フロントエンドが SWR で定期的にデータ取得
5. Chart.js でグラフ表示

## 注意点

- Aspida使用時はAPI型定義変更後に`pnpm api:build`を実行して型を再生成
- CDKデプロイ時は`cdk.json`のコンテキスト変数 (`zone_name`, `hosted_zone_id`, `domain_name`, `application_image_name`) を適切に設定
- ECSタスクはプライベートサブネット内で実行され、VPCエンドポイント経由で外部サービスにアクセス

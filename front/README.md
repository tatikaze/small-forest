This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## conditions の期間指定

`/conditions` は直近2時間・24時間・7日・31日と、開始／終了日時による指定に対応します。
入力と表示は日本時間（JST）。日時入力中には取得せず、表示ボタンで確定します。
直近表示は5分ごとに期間を進めて更新し、固定期間は自動更新しません。
1回の指定は最大31日ですが、保存済みデータであれば過去の任意の月を指定できます。

### API

```text
GET /api/v1/reid/conditions
  ?start_date=2026-01-01T00:00:00Z
  &end_date=2026-02-01T00:00:00Z
  &include_now=false
```

- 日時はISO 8601（`Z`またはオフセット付き）を推奨します。`+09:00`の`+`はURLエンコードしてください。
  既存クライアントのオフセットなし日時はJSTと解釈します。
- 開始・終了は両端を含みます。開始 < 終了、期間 <= 31日、終了 <= サーバー現在時刻が必要です。
- `include_now`の既定値は`true`で既存の最新値取得を維持します。
  履歴画面は`false`にして最新値のQueryを省きます。この場合`now`は`null`です。
- レスポンスは`{ conditions, now, range }`。
  `range`はUTCの`start_date`・`end_date`、`interval_minutes`、`aggregation`（`raw`または`mean`）を返します。
- 6時間以下は計測値、24時間以下は5分平均、7日以下は30分平均、それ以上は120分平均です。
  集約バケットはUTC基準で揃え、指定期間内の観測値だけを平均します。
  各点の時刻はバケット内の最初の実測時刻です。欠測バケットは生成しません。
  平均値なので瞬間的な最大値・最小値は表示しません。
- 不正な日時・期間は400、取得件数上限は422、DB障害・同時取得制限は503（`Retry-After: 5`）。
  途中までのデータを成功として返しません。ブラウザーの無制限な自動リトライも行いません。
- 旧`GET /api/v1/:device`も同じ処理を使います。

### DB負荷とキャッシュ

既存の`device_name`パーティションキーと`created_unix`ソートキーによるQueryのみを使用します。
Scan・テーブル変更・バックフィルは不要です。
DynamoDBの1 MB境界は`LastEvaluatedKey`でページングします。

キャッシュキーは`conditions:v1:<device>:day:<UTC日開始ミリ秒>`です。
任意の日時をキーにせず、重複する表示期間でも同じ日を再利用します。
初回は指定範囲が含まれるUTC日全体を読み、結果を指定期間に絞ります。
このため短期間の初回表示は必要な時刻より広く読みますが、次の期間指定に再利用できます。
5分間隔なら1日約288件、31日指定は最大32日・約9,216件で、通常は1日1 Queryです。
平均への集約は転送量と描画量を減らす処理であり、初回の読み取り容量自体は減らしません。

| 対象 | TTL |
| --- | --- |
| 当日および終了から48時間以内の日 | 5分 |
| 終了から48時間より古い日 | 24時間 |
| 最新値 | 60秒 |

空の結果もキャッシュします。新着データの反映は最大約5分遅れます。
古いデータの修正・追加は最大24時間遅れるため、バックフィル時は対象キャッシュを削除し、
各プロセスのキャッシュ期限（または再起動）も考慮してください。

- プロセス内LRUは最大64エントリー。同一キーの並行取得は1回にまとめます。
- プロセス内の異なるキャッシュ補充は同時2件まで。超過時は503でDBへの集中を抑えます。
- Upstash設定時は共有キャッシュと45秒の分散ロックを利用し、他インスタンスによる同日の重複取得を抑えます。
- Redis通信は1.5秒で打ち切り、障害後60秒はプロセス内キャッシュに切り替えます。
  Redis未設定でも動作しますが、その場合インスタンス間の共有・分散ロックはありません。
- リクエスト当たり最大40ページ／10,000件のDB読み取り、1日当たり最大2,000件、
  返却最大2,000点、履歴取得の期限30秒、1 Queryの期限8秒を設けます。
  各QueryのLimitは最大500です。最新値の取得は別途最大1 Queryです。
- この制限は全アクセス合計のレート制限ではありません。公開APIへの大量アクセスには
  ALB/WAF等でのレート制限が別途必要です。

### Upstashの有効化

サーバー実行環境に次を設定してください（クライアント向けの`NEXT_PUBLIC_`は付けません）。

```text
UPSTASH_REDIS_REST_URL=https://<database>.upstash.io
UPSTASH_REDIS_REST_TOKEN=<server-side-token>
```

REST APIでGET・SET（NX/EX）・EVALを使用します。追加パッケージは不要です。
本サービスのデプロイ先はVercelです。上記の値を対象のVercel環境に設定してください。
プロセス内キャッシュはインスタンス間で共有されず、再起動で失われるため、
本番で継続的にDBアクセスを抑える共有キャッシュとしてUpstashを利用します。
未設定でも動作しますが、プロセス内キャッシュのみの効果は実行インスタンスの寿命に依存します。
この変更ではシークレットの設定・外部リソースの作成・デプロイは行っていません。

31日を超える連続表示や高頻度データには、読み取り時の全件集約を拡張するより、
書き込み時／非同期ジョブで時間別・日別の集計テーブルを作る方針とします。
運用ではDynamoDBのConsumedReadCapacityUnits・ThrottledRequests・APIの503件数を確認してください。

### 検証

```bash
pnpm api:build
pnpm test
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

テストは実DB・実Redisに接続せず、ページング、期間境界、重複期間のキャッシュ再利用、
最大31日、取得上限、キャッシュの並行取得・期限・共有・障害時フォールバックを検証します。

仕様参考: [DynamoDB Queryのページング](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.Pagination.html)、
[Queryの読み取り容量](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.Other.html)、
[Upstash REST API](https://upstash.com/docs/redis/features/restapi)。

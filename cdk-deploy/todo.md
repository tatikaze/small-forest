## ECS CDK

### 詰まった点

リッスンしたいポートと違うポートを見ていたため503がalb上で出ていた
TargetGroupのProtocolPortを変更して治したかったが見つからなかったので一旦イメージ側のポートを変更した

### 目標

- target group のprotocol Portの変更
- DynamoDBに接続できていないのでTaskRoleを作成アタッチ
- ACMでSSL化したい

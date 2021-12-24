# ECS deployまで

# build

ECRにログインしてDockerが認識できるようにする
`aws ecr get-login-password --region region | docker login --username AWS --password-stdin aws_account_id.dkr.ecr.region.amazonaws.com`
必要であれば`--profile`をつけてAWSのプロファイルを指定


Dockerイメージを生成してECRにpushする
`docker compose -f docker-compose-build.yml build`
`docker compose push`
M1Macでビルドするとアーキテクチャの違いにより実行ができないので注意


# deploy

DockerのコンテキストがECSに向くようにしてからいつものようにコンテナをあげるとECSにデプロイされる

`docker context create ecs {context-name}`
`docker context use {context-name}`
`docker compose up`

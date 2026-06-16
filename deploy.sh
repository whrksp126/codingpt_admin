#!/bin/bash
# 사용법: ./deploy.sh [dev|stg|prod]
# codingpt_admin (Vite 어드민) — 독립 배포. 백엔드와는 공개 HTTPS로만 통신.
ENV=$1
SSH_KEY="$HOME/.ssh/ghmate_server"
REMOTE_DIR="/srv/projects/codingpt_admin"

case $ENV in
  dev)
    COMPOSE_FILE="docker-compose.dev.yml"
    PROJECT_NAME="codingpt_admin_dev"
    ;;
  stg)
    COMPOSE_FILE="docker-compose.stg.yml"
    PROJECT_NAME="codingpt_admin_stg"
    ;;
  prod)
    COMPOSE_FILE="docker-compose.prod.yml"
    PROJECT_NAME="codingpt_admin_prod"
    ;;
  *)
    echo "사용법: ./deploy.sh [dev|stg|prod]"
    exit 1
    ;;
esac

echo ">>> [admin/$ENV] 배포 시작..."

ssh -i "$SSH_KEY" -p 222 ghmate@ghmate.iptime.org "
  set -e
  cd $REMOTE_DIR
  echo '>>> git pull...'
  git pull
  echo '>>> docker build & up...'
  docker compose -p $PROJECT_NAME -f $COMPOSE_FILE up --build -d admin
  echo '>>> nginx reload...'
  docker exec nginx_proxy nginx -s reload
"

if [ $? -eq 0 ]; then
  echo ">>> [admin/$ENV] 배포 완료!"
else
  echo ">>> [에러] 배포 실패. SSH 접속 및 서버 상태를 확인하세요."
  exit 1
fi

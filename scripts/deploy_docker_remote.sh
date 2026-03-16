#!/usr/bin/env bash
set -Eeuo pipefail

RELEASE_ID="${1:-}"
BACKEND_IMAGE="${2:-}"
FRONTEND_IMAGE="${3:-}"

if [ -z "$RELEASE_ID" ] || [ -z "$BACKEND_IMAGE" ] || [ -z "$FRONTEND_IMAGE" ]; then
  echo "Usage: deploy_docker_remote.sh <release_id> <backend_image> <frontend_image>"
  exit 1
fi

APP_ROOT="/opt/bioscope"
STATE_DIR="$APP_ROOT/state"
CFG_DIR="$APP_ROOT/config"
NGINX_DIR="$APP_ROOT/nginx"

mkdir -p "$STATE_DIR" "$CFG_DIR" "$NGINX_DIR"

if [ ! -w "$APP_ROOT" ]; then
  echo "No write permission on $APP_ROOT for user $(whoami)."
  exit 1
fi

CURRENT_BACKEND_PORT="$(cat "$STATE_DIR/backend_port" 2>/dev/null || echo 5001)"
CURRENT_FRONTEND_PORT="$(cat "$STATE_DIR/frontend_port" 2>/dev/null || echo 8081)"
CURRENT_BACKEND_CONTAINER="$(cat "$STATE_DIR/backend_container" 2>/dev/null || true)"
CURRENT_FRONTEND_CONTAINER="$(cat "$STATE_DIR/frontend_container" 2>/dev/null || true)"

if [ "$CURRENT_BACKEND_PORT" = "5001" ]; then
  NEXT_BACKEND_PORT="5002"
else
  NEXT_BACKEND_PORT="5001"
fi

if [ "$CURRENT_FRONTEND_PORT" = "8081" ]; then
  NEXT_FRONTEND_PORT="8082"
else
  NEXT_FRONTEND_PORT="8081"
fi

NEXT_BACKEND_CONTAINER="bioscope-api-${RELEASE_ID}"
NEXT_FRONTEND_CONTAINER="bioscope-web-${RELEASE_ID}"

rollback() {
  echo "Deployment failed, cleaning up candidate containers..."
  docker rm -f "$NEXT_BACKEND_CONTAINER" >/dev/null 2>&1 || true
  docker rm -f "$NEXT_FRONTEND_CONTAINER" >/dev/null 2>&1 || true
}

trap rollback ERR

echo "Logging in to GHCR..."
echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin

echo "Pulling images..."
docker pull "$BACKEND_IMAGE"
docker pull "$FRONTEND_IMAGE"

echo "Writing backend runtime env file..."
cat > "$CFG_DIR/backend.env" <<EOF
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
PORT=5000
NODE_ENV=production
FRONTEND_URL=${FRONTEND_URL}
EOF

docker rm -f "$NEXT_BACKEND_CONTAINER" >/dev/null 2>&1 || true
docker rm -f "$NEXT_FRONTEND_CONTAINER" >/dev/null 2>&1 || true

echo "Starting backend candidate container on 127.0.0.1:${NEXT_BACKEND_PORT}..."
docker run -d \
  --name "$NEXT_BACKEND_CONTAINER" \
  --restart unless-stopped \
  --env-file "$CFG_DIR/backend.env" \
  -p "127.0.0.1:${NEXT_BACKEND_PORT}:5000" \
  "$BACKEND_IMAGE"

echo "Starting frontend candidate container on 127.0.0.1:${NEXT_FRONTEND_PORT}..."
docker run -d \
  --name "$NEXT_FRONTEND_CONTAINER" \
  --restart unless-stopped \
  -p "127.0.0.1:${NEXT_FRONTEND_PORT}:80" \
  "$FRONTEND_IMAGE"

echo "Waiting for backend health check..."
for i in {1..30}; do
  if curl -fsS "http://127.0.0.1:${NEXT_BACKEND_PORT}/health" >/dev/null; then
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "Backend health check failed."
    exit 1
  fi
  sleep 2
done

echo "Waiting for frontend health check..."
for i in {1..20}; do
  if curl -fsS "http://127.0.0.1:${NEXT_FRONTEND_PORT}/" >/dev/null; then
    break
  fi
  if [ "$i" -eq 20 ]; then
    echo "Frontend health check failed."
    exit 1
  fi
  sleep 1
done

echo "Switching nginx upstreams atomically..."
cat > "$NGINX_DIR/backend_upstream.conf" <<EOF
server 127.0.0.1:${NEXT_BACKEND_PORT};
EOF

cat > "$NGINX_DIR/frontend_upstream.conf" <<EOF
server 127.0.0.1:${NEXT_FRONTEND_PORT};
EOF

sudo -n nginx -t
sudo -n systemctl reload nginx

echo "$NEXT_BACKEND_PORT" > "$STATE_DIR/backend_port"
echo "$NEXT_FRONTEND_PORT" > "$STATE_DIR/frontend_port"
echo "$NEXT_BACKEND_CONTAINER" > "$STATE_DIR/backend_container"
echo "$NEXT_FRONTEND_CONTAINER" > "$STATE_DIR/frontend_container"

if [ -n "$CURRENT_BACKEND_CONTAINER" ] && [ "$CURRENT_BACKEND_CONTAINER" != "$NEXT_BACKEND_CONTAINER" ]; then
  docker rm -f "$CURRENT_BACKEND_CONTAINER" >/dev/null 2>&1 || true
fi
if [ -n "$CURRENT_FRONTEND_CONTAINER" ] && [ "$CURRENT_FRONTEND_CONTAINER" != "$NEXT_FRONTEND_CONTAINER" ]; then
  docker rm -f "$CURRENT_FRONTEND_CONTAINER" >/dev/null 2>&1 || true
fi

echo "Pruning old images..."
docker image prune -f >/dev/null 2>&1 || true

echo "Docker blue-green deployment completed: $RELEASE_ID"

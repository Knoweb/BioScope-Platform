#!/usr/bin/env bash
set -Eeuo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: bootstrap_do_server.sh <domain>"
  exit 1
fi

DOMAIN="$1"
APP_USER="$(whoami)"

if [[ "$DOMAIN" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then
  SERVER_NAMES="$DOMAIN"
else
  SERVER_NAMES="$DOMAIN www.$DOMAIN"
fi

echo "Updating apt packages..."
sudo apt update
sudo apt upgrade -y

echo "Installing base packages..."
sudo apt install -y nginx curl rsync ca-certificates gnupg lsb-release

if ! command -v docker >/dev/null 2>&1; then
  echo "Installing Docker..."
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
  sudo apt update
  sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

sudo usermod -aG docker "$APP_USER"
sudo systemctl enable docker
sudo systemctl start docker

echo "Creating deployment directories..."
sudo mkdir -p /opt/bioscope/state /opt/bioscope/config /opt/bioscope/nginx
sudo chown -R "$APP_USER":"$APP_USER" /opt/bioscope

if [ ! -f /opt/bioscope/nginx/backend_upstream.conf ]; then
  echo "server 127.0.0.1:5001;" | sudo tee /opt/bioscope/nginx/backend_upstream.conf >/dev/null
fi
if [ ! -f /opt/bioscope/nginx/frontend_upstream.conf ]; then
  echo "server 127.0.0.1:8081;" | sudo tee /opt/bioscope/nginx/frontend_upstream.conf >/dev/null
fi

echo "5001" | sudo tee /opt/bioscope/state/backend_port >/dev/null
echo "8081" | sudo tee /opt/bioscope/state/frontend_port >/dev/null
sudo chown -R "$APP_USER":"$APP_USER" /opt/bioscope

echo "Writing nginx site config..."
sudo tee /etc/nginx/sites-available/bioscope >/dev/null <<EOF
upstream bioscope_backend {
    include /opt/bioscope/nginx/backend_upstream.conf;
}

upstream bioscope_frontend {
    include /opt/bioscope/nginx/frontend_upstream.conf;
}

server {
    listen 80;
    listen [::]:80;
  server_name ${SERVER_NAMES};

    location /api/ {
        proxy_pass http://bioscope_backend/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /health {
    proxy_pass http://bioscope_backend/health;
    }

    location / {
    proxy_pass http://bioscope_frontend;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

sudo ln -sfn /etc/nginx/sites-available/bioscope /etc/nginx/sites-enabled/bioscope
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

echo "Adding passwordless nginx reload rights for deploy user..."
echo "${APP_USER} ALL=(root) NOPASSWD: /usr/sbin/nginx -t, /bin/systemctl reload nginx" | \
  sudo tee /etc/sudoers.d/bioscope-deploy >/dev/null
sudo chmod 440 /etc/sudoers.d/bioscope-deploy

echo "Bootstrap complete."
echo "Log out and log in again so docker group membership is applied."
echo "Next: add GitHub secrets and push to main to trigger deployment."

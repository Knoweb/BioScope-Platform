# DigitalOcean CI/CD Deployment Guide

This guide configures automatic production deployments from GitHub Actions to your DigitalOcean droplet using Docker blue-green deployment.

## What This Setup Provides

- Automatic deploy on every push to `main`
- Backend and frontend Docker images built in GitHub Actions
- Images pushed to GHCR (GitHub Container Registry)
- Blue-green container switching on droplet
- Rollback on failed health check
- Near-zero downtime deployments

## 1. One-Time Droplet Setup

SSH to your droplet as your deploy user and run:

```bash
chmod +x scripts/bootstrap_do_server.sh
./scripts/bootstrap_do_server.sh your-domain.com
```

If your code is not on droplet yet, clone first:

```bash
git clone https://github.com/Knoweb/BioScope-Platform.git
cd BioScope-Platform
```

## 2. GitHub Secrets (Repository Settings)

Go to GitHub repository settings and add these Actions secrets:

- `DO_HOST` = droplet public IP or hostname
- `DO_USER` = deploy user (recommended: `bioscope`)
- `DO_PORT` = `22`
- `DO_SSH_PRIVATE_KEY` = private key content from local machine
- `GHCR_USERNAME` = GitHub username that can pull GHCR images
- `GHCR_TOKEN` = GitHub PAT with at least `read:packages` scope
- `SUPABASE_URL` = Supabase project URL
- `SUPABASE_ANON_KEY` = Supabase anon key
- `SUPABASE_SERVICE_KEY` = Supabase service key
- `FRONTEND_URL` = public site URL for CORS, for example `https://your-domain.com`
	- You can include multiple origins separated by comma, for example `https://your-domain.com,https://www.your-domain.com`
- `APP_PORT` = `5000`

## 3. Workflow File

The production workflow is located at:

- `.github/workflows/deploy-production.yml`

Trigger:

- push to `main`
- manual run from GitHub Actions

## 4. Deployment Flow

1. GitHub Actions checks out code.
2. Backend and frontend Docker images are built.
3. Images are pushed to GHCR with the commit SHA tag.
4. Deploy script is copied to droplet and executed via SSH.
5. Droplet pulls new images.
6. New backend and frontend candidate containers start on alternate ports.
7. Health checks validate candidates.
8. Nginx upstream switches to new ports and reloads.
9. Old containers are removed.

## 5. Zero-Downtime Strategy

- Backend: current container stays alive while candidate container starts and passes health checks.
- Frontend: current container stays alive while candidate container starts and passes checks.
- Switch: Nginx upstream file updates are atomic and only reloaded after validation.
- Rollback: if candidate fails checks, switch does not happen and old containers continue serving traffic.

## 6. SSL

After DNS is pointed to droplet, enable TLS:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## 7. Verify Deployment

- GitHub Actions run is green.
- `https://your-domain.com` loads frontend.
- `https://your-domain.com/health` returns backend health JSON.
- On droplet:

```bash
docker ps
curl -I http://127.0.0.1:8081 || true
curl -I http://127.0.0.1:8082 || true
```

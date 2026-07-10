# OpenSprint VPS Deployment

OpenSprint is deployed on an OVHcloud VPS with Docker Compose, PostgreSQL and the existing Traefik reverse proxy.

## Production URL

- Application: `https://opensprint.51.255.165.107.nip.io`
- Server: Ubuntu 24.04 VPS
- Reverse proxy: Traefik on ports 80 and 443
- Database: private PostgreSQL 17 Docker container

## Files

- `Dockerfile`: builds the Next.js application image.
- `compose.prod.yaml`: starts the application, PostgreSQL and Traefik routing labels.
- `.github/workflows/deploy-vps.yml`: deploys after the `CI` workflow succeeds on `main`, or manually through `workflow_dispatch`.

## Server Environment

Production secrets are stored only on the VPS in `/opt/apps/opensprint/.env.production`.

Expected keys:

```dotenv
APP_HOST=opensprint.51.255.165.107.nip.io
APP_URL=https://opensprint.51.255.165.107.nip.io
POSTGRES_USER=opensprint
POSTGRES_PASSWORD=...
POSTGRES_DB=opensprint
BETTER_AUTH_SECRET=...
```

## GitHub Secrets

The deployment workflow expects:

- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`
- `VPS_APP_DIR`

## Current Verification

- HTTPS returns `HTTP/2 200`.
- HTTP redirects to HTTPS with `308 Permanent Redirect`.
- PostgreSQL container is healthy.
- Drizzle migrations apply successfully during app startup.
- The OpenSprint home page renders from the public URL.

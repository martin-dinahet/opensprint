# OpenSprint VPS Deployment

OpenSprint is deployed as a GHCR image on the VPS. GitHub Actions builds and pushes the image; the VPS only pulls it and runs Docker Compose.

## Production Files

- `Dockerfile`: builds the Next.js application image.
- `compose.prod.yml`: app-owned runtime Compose file for `/opt/stacks/opensprint/compose.yml`.
- `.github/workflows/deploy-vps.yml`: verifies the app, publishes `ghcr.io/martin-dinahet/opensprint:latest`, uploads Compose, then restarts the VPS stack.

The production Compose file contains only OpenSprint's app service. It does not define PostgreSQL, Traefik, Caddy or VPS infrastructure services.

## GitHub Configuration

Required repository secrets:

```text
VPS_HOST
VPS_USER
VPS_SSH_KEY
```

Required repository variable or secret:

```text
NEXT_PUBLIC_APP_URL=https://opensprint.51.255.165.107.nip.io
```

`NEXT_PUBLIC_APP_URL` is used while building the Docker image because it is included in the browser bundle. Keep runtime secrets on the VPS, not in GitHub.

## PostgreSQL Setup On The VPS

Create the app database and user through the infra repo:

```bash
cd /opt/infra
./scripts/create-postgres-app.lua opensprint opensprint opensprint
sudo cat /opt/secrets/opensprint_postgres_password
```

Create `/opt/secrets/opensprint.env`:

```dotenv
DATABASE_URL=postgresql://opensprint:<password>@postgres:5432/opensprint
BETTER_AUTH_SECRET=<generate-a-long-random-secret>
BETTER_AUTH_URL=https://opensprint.51.255.165.107.nip.io
NEXT_PUBLIC_APP_URL=https://opensprint.51.255.165.107.nip.io
PORT=3000
```

Secure the file:

```bash
sudo chown root:docker /opt/secrets/opensprint.env
sudo chmod 640 /opt/secrets/opensprint.env
```

## Caddy Route On The VPS

Add the route directly to the VPS Caddy configuration:

```caddyfile
opensprint.51.255.165.107.nip.io {
	reverse_proxy opensprint:3000
}
```

Reload Caddy:

```bash
cd /opt/stacks/caddy
docker compose up -d
```

## Manual Deploy Commands

GitHub Actions performs these commands automatically after publishing the image:

```bash
sudo mkdir -p /opt/stacks/opensprint
cd /opt/stacks/opensprint
docker compose pull
docker compose up -d --remove-orphans
docker image prune -f
```

If the GHCR package is private, log in on the VPS with a read-only package token before the first pull:

```bash
echo '<github-token-with-read-packages>' | sudo docker login ghcr.io -u '<github-user>' --password-stdin
```

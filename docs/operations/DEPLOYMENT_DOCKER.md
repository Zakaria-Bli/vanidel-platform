# Production deployment (Docker)

Production (`vanidel.com`) runs entirely in Docker containers on a VPS hosted in Algeria (ARCHITECTURE §17), as two compose projects:

- **`/opt/traefik`**: Traefik, the VPS-wide reverse proxy. It listens on ports 80 and 443, redirects HTTP to HTTPS, gets Let's Encrypt certificates on its own, and routes to any container on the shared `traefik-public` network that asks for it with `traefik.*` labels. Source: [`deploy/traefik/`](../../deploy/traefik/).
- **`/opt/vanidel`**: a checkout of this repository. Its [`docker-compose.yml`](../../docker-compose.yml) builds the app from the [`Dockerfile`](../../Dockerfile) and runs it with PostgreSQL 17 and SeaweedFS (S3 API). The app's labels route `vanidel.com` to it.

The testing environment keeps its systemd setup, described in [DEPLOYMENT.md](DEPLOYMENT.md). Never copy its database, buckets or secrets to production.

This guide assumes production has a VPS of its own. The testing environment's Traefik (`/opt/vanidel/services`) also binds ports 80 and 443, so the two cannot run on the same server as they are.

## Constraints

The constraints in [DEPLOYMENT.md](DEPLOYMENT.md#constraints) apply here too. In this setup:

- **One app container.** Never scale the `app` service (`--scale`, `deploy.replicas`): the participation rate limit is kept in memory.
- **`X-Forwarded-For`.** Traefik replaces any client-sent value with the connecting address, as long as no `forwardedHeaders` option is set on its entry points (none is). Docker preserves the client address on published ports, so keep `userland-proxy` and iptables at Docker's defaults, and keep the DNS record unproxied (no Cloudflare orange cloud).
- **Only Traefik is public.** PostgreSQL, SeaweedFS and the app publish no ports. The app is reachable only through Traefik; the database and storage only from the app's compose network.
- **Migrations run on start**, on the first request after the app container starts.

## 1. Server preparation

On Ubuntu 24.04, as root:

```sh
apt update && apt upgrade -y
apt install -y git ufw ca-certificates curl
curl -fsSL https://get.docker.com | sh

ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable

adduser vanidel            # if it does not exist yet
usermod -aG docker vanidel
mkdir -p /opt/traefik /opt/vanidel && chown vanidel:vanidel /opt/traefik /opt/vanidel

# Shared network for Traefik and every project it routes to, created once.
docker network create traefik-public
```

Docker writes its own firewall rules for published ports, around ufw. Only Traefik publishes ports, so only 80 and 443 are open either way.

The image build lets Node use up to 4 GB. On a 4 GB server, add 4 GB of swap first, as in [DEPLOYMENT.md §1 Swap](DEPLOYMENT.md#swap).

Point the `A` record of `vanidel.com` at the server before starting Traefik, or the first certificate request fails.

## 2. Traefik

As `vanidel`, copy [`deploy/traefik/`](../../deploy/traefik/) to `/opt/traefik` (from a checkout, or with `scp -r deploy/traefik/. vanidel-prod:/opt/traefik/`), then follow its [README](../../deploy/traefik/README.md):

```sh
cd /opt/traefik
cp .env.example .env && chmod 600 .env   # set ACME_EMAIL
docker compose up -d
```

## 3. The app

The server pulls from GitHub with a read-only deploy key, set up as in [DEPLOYMENT.md §3](DEPLOYMENT.md#3-the-app). Then, as `vanidel`:

```sh
git clone git@github.com:Zakaria-Bli/vanidel-platform.git /opt/vanidel
cd /opt/vanidel
cp .env.production.example .env && chmod 600 .env
```

Fill in `.env` (template: [`.env.production.example`](../../.env.production.example)), generating every secret on this server:

| Variable               | Value                                                                      |
| ---------------------- | -------------------------------------------------------------------------- |
| `APP_DOMAIN`           | `vanidel.com`. Traefik routes it to the app; `SITE_URL` is derived from it |
| `POSTGRES_PASSWORD`    | `openssl rand -hex 24` (hex only: it goes into the database URL as is)     |
| `PAYLOAD_SECRET`       | `openssl rand -base64 32`                                                  |
| `S3_ACCESS_KEY_ID`     | `vanidel-app`                                                              |
| `S3_SECRET_ACCESS_KEY` | `openssl rand -hex 24`                                                     |

The compose file sets the rest (`NODE_ENV`, `DATABASE_URL`, `S3_ENDPOINT`, bucket names). The SeaweedFS identity is written from the two `S3_*` values, and the `seaweedfs-buckets` service creates `vanidel-public` and `vanidel-private` before the app starts.

```sh
docker compose up -d --build
docker compose ps        # app "healthy", seaweedfs-buckets "Exited (0)"
docker compose logs -f app
```

Open `https://vanidel.com/admin`: the first request runs the migrations, and the admin offers to create the first user. Use a strong password.

## 4. Deploying an update

```sh
cd /opt/vanidel
git pull --ff-only origin main      # retry if the provider's link drops the connection
docker compose up -d --build
```

The image is built while the running container keeps serving, then the app container is replaced: the site is down only for the few seconds the new container takes to start. Remove old images now and then with `docker image prune -f`.

If GitHub stays unreachable, push to a bare repository on the server instead, as in [DEPLOYMENT.md §3](DEPLOYMENT.md#3-the-app).

## 5. Backups

Data lives in two named volumes, `vanidel_postgres-data` and `vanidel_seaweedfs-data`, not in the checkout. Nightly, from root's crontab (`mkdir -p /var/backups/vanidel && chmod 700 /var/backups/vanidel` first):

```cron
# Database dump, 14 days kept
30 2 * * * cd /opt/vanidel && docker compose exec -T postgres pg_dump -U vanidel -Fc vanidel > /var/backups/vanidel/db-$(date +\%F).dump && find /var/backups/vanidel -name 'db-*.dump' -mtime +14 -delete
# File storage (receipt photos and media), 7 days kept
45 2 * * * docker run --rm -v vanidel_seaweedfs-data:/data:ro -v /var/backups/vanidel:/backup alpine:3.22 tar -czf /backup/files-$(date +\%F).tar.gz -C /data . && find /var/backups/vanidel -name 'files-*.tar.gz' -mtime +7 -delete
```

Also keep a copy of `/opt/vanidel/.env` and `/opt/traefik/.env` somewhere safe: without `PAYLOAD_SECRET` and the S3 credentials, the backups cannot be used with a new server's configuration. Before launch, copy `/var/backups/vanidel` nightly to a second location **in Algeria** (ARCHITECTURE §18).

Restore: `docker compose exec -T postgres pg_restore -U vanidel -d vanidel --clean < db-….dump`, and for files, stop `seaweedfs`, untar the archive into the volume with a throwaway container, and start it again.

## 6. Staging check and launch

Run the staging check from [DEPLOYMENT.md §7](DEPLOYMENT.md#7-staging-check) with fake data, with `docker compose up -d --build` in place of `deploy.sh`. Then wipe the test data:

```sh
cd /opt/vanidel
docker compose down
docker volume rm vanidel_postgres-data vanidel_seaweedfs-data
docker run --rm -v /var/backups/vanidel:/b alpine:3.22 sh -c 'rm -f /b/*'
docker compose up -d
```

The buckets are recreated on start. Next.js's page cache lives in the app container, so the new container no longer serves pages listing the test contest (the reason for the rebuild in DEPLOYMENT.md §8). Open `/admin` to create the admin user again, and check that `/fr/concours` and `/ar/concours` list no contests.

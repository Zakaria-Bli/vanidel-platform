# Production deployment (Docker)

Production (`vanidel.com`) runs entirely in Docker containers, on the same VPS in Algeria as the testing environment (ARCHITECTURE §17). Three parts share the server:

- **`/opt/traefik`**: Traefik, the VPS-wide reverse proxy, in front of both environments. It listens on ports 80 and 443, redirects HTTP to HTTPS, gets Let's Encrypt certificates on its own, and routes to containers on the shared `traefik-public` network that ask for it with `traefik.*` labels, and to the testing app through a file route. Source: [`deploy/traefik/`](../../deploy/traefik/).
- **`/opt/vanidel-prod`**: production, a checkout of this repository. Its [`docker-compose.yml`](../../docker-compose.yml) (compose project `vanidel-prod`) builds the app from the [`Dockerfile`](../../Dockerfile) and runs it with its own PostgreSQL 17 and SeaweedFS (S3 API). The app's labels route `vanidel.com` to it.
- **`/opt/vanidel`**: the testing environment (`vanidel.izakcodes.com`), still under systemd, described in [DEPLOYMENT.md](DEPLOYMENT.md).

The two environments share nothing but Traefik: separate databases, storage, secrets and backups. Never copy the testing database, buckets or secrets to production.

## Constraints

The constraints in [DEPLOYMENT.md](DEPLOYMENT.md#constraints) apply here too. In this setup:

- **One app container.** Never scale the `app` service (`--scale`, `deploy.replicas`): the participation rate limit is kept in memory.
- **`X-Forwarded-For`.** Traefik runs on the host network, sees the client's address directly, and replaces any client-sent value with it, as long as no `forwardedHeaders` option is set on its entry points (none is). Keep the DNS record unproxied (no Cloudflare orange cloud).
- **Only Traefik is public.** Production's PostgreSQL, SeaweedFS and app publish no ports, so they don't collide with the testing services on `127.0.0.1:3000`, `5432` and `8333`. The app is reachable only through Traefik; the database and storage only from the app's compose network.
- **Memory.** One 4 GB server now runs two apps, two databases and two storage servers, and builds images. Keep the 4 GB swap from [DEPLOYMENT.md §1](DEPLOYMENT.md#swap), and build outside participation peaks. If `free -h` shows swap in use outside builds, the server needs more memory.
- **Migrations run on start**, on the first request after the app container starts.

## 1. Traefik

If the testing environment still runs its own Traefik (a `traefik` service in `/opt/vanidel/services/compose.yaml`), switch it to `/opt/traefik` first: [DEPLOYMENT.md §4](DEPLOYMENT.md#moving-from-the-testing-environments-own-traefik). Otherwise set up `/opt/traefik` from its [README](../../deploy/traefik/README.md).

Then point the `A` record of `vanidel.com` at the server (`102.206.41.58`).

### Certificate for vanidel.com

The provider's network drops some of Let's Encrypt's HTTP validation traffic, which is why the testing domain uses the DNS challenge ([DEPLOYMENT.md §4](DEPLOYMENT.md#4-traefik-and-https)). `vanidel.com` uses it too, through the same `letsencrypt-dns` resolver, although its DNS is at Octenium and not on that cPanel account: its challenge record is delegated with a CNAME.

Once, in Octenium's DNS management for `vanidel.com`, add:

| Name                          | Type  | Value                                       |
| ----------------------------- | ----- | ------------------------------------------- |
| `_acme-challenge.vanidel.com` | CNAME | `_acme-challenge.vanidel-com.izakcodes.com` |

Traefik follows the CNAME and publishes the challenge's TXT record at the target, in the `izakcodes.com` zone it already manages through the cPanel API; Let's Encrypt follows the same CNAME when it checks. No Octenium credentials are needed, and the record stays in place for every renewal. Check it from any machine with `dig +short CNAME _acme-challenge.vanidel.com` before starting the app.

This is the default (`TLS_CERT_RESOLVER=letsencrypt-dns` in production's `.env`). It shares the testing certificate's [known issue](DEPLOYMENT.md#4-traefik-and-https): the cPanel API is reachable only intermittently, which the daily renewal retries absorb, and leftover TXT records (now also `_acme-challenge.vanidel-com`) can be deleted in cPanel's **Zone Editor**. `letsencrypt` (HTTP challenge) remains available if the network issue goes away.

## 2. The app

As root, once:

```sh
mkdir -p /opt/vanidel-prod && chown vanidel:vanidel /opt/vanidel-prod
docker network create traefik-public   # "already exists" is fine
```

As `vanidel`, who already pulls from GitHub with the read-only deploy key ([DEPLOYMENT.md §3](DEPLOYMENT.md#3-the-app)):

```sh
git clone git@github.com:Zakaria-Bli/vanidel-platform.git /opt/vanidel-prod
cd /opt/vanidel-prod
cp .env.production.example .env && chmod 600 .env
```

Fill in `.env` (template: [`.env.production.example`](../../.env.production.example)). Generate every secret anew: never reuse the testing environment's.

| Variable               | Value                                                                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `APP_DOMAIN`           | `vanidel.com`. Traefik routes it to the app; `SITE_URL` is derived from it                                                                         |
| `TLS_CERT_RESOLVER`    | `letsencrypt-dns` ([above](#certificate-for-vanidelcom))                                                                                           |
| `ALPINE_MIRROR`        | `https://mirrors.edge.kernel.org/alpine`: the VPS cannot reach the default `dl-cdn.alpinelinux.org`, so the image build uses another Alpine mirror |
| `POSTGRES_PASSWORD`    | `openssl rand -hex 24` (hex only: it goes into the database URL as is)                                                                             |
| `PAYLOAD_SECRET`       | `openssl rand -base64 32`                                                                                                                          |
| `S3_ACCESS_KEY_ID`     | `vanidel-app`                                                                                                                                      |
| `S3_SECRET_ACCESS_KEY` | `openssl rand -hex 24`                                                                                                                             |

The compose file sets the rest (`NODE_ENV`, `DATABASE_URL`, `S3_ENDPOINT`, bucket names). The SeaweedFS identity is written from the two `S3_*` values, and the `seaweedfs-buckets` service creates `vanidel-public` and `vanidel-private` before the app starts.

```sh
docker compose up -d --build
docker compose ps        # app "healthy", seaweedfs-buckets "Exited (0)"
docker compose logs -f app
```

Open `https://vanidel.com/admin`: the first request runs the migrations, and the admin offers to create the first user. Use a strong password.

## 3. Deploying an update

```sh
cd /opt/vanidel-prod
git pull --ff-only origin main      # retry if the provider's link drops the connection
docker compose up -d --build
```

The image is built while the running container keeps serving, then the app container is replaced: the site is down only for the few seconds the new container takes to start. Remove old images now and then with `docker image prune -f`.

If GitHub stays unreachable, push to the server's bare repository (`/opt/vanidel/repo.git`, [DEPLOYMENT.md §3](DEPLOYMENT.md#3-the-app)) and pull from it: `git pull --ff-only /opt/vanidel/repo.git main`.

## 4. Backups

Data lives in two named volumes, `vanidel-prod_postgres-data` and `vanidel-prod_seaweedfs-data`, not in the checkout. Nightly, from root's crontab (`mkdir -p /var/backups/vanidel-prod && chmod 700 /var/backups/vanidel-prod` first), next to the testing environment's jobs:

```cron
# Production database dump, 14 days kept
40 2 * * * cd /opt/vanidel-prod && docker compose exec -T postgres pg_dump -U vanidel -Fc vanidel > /var/backups/vanidel-prod/db-$(date +\%F).dump && find /var/backups/vanidel-prod -name 'db-*.dump' -mtime +14 -delete
# Production file storage (receipt photos and media), 7 days kept
55 2 * * * docker run --rm -v vanidel-prod_seaweedfs-data:/data:ro -v /var/backups/vanidel-prod:/backup alpine:3.22 tar -czf /backup/files-$(date +\%F).tar.gz -C /data . && find /var/backups/vanidel-prod -name 'files-*.tar.gz' -mtime +7 -delete
```

`backup-config.sh` ([DEPLOYMENT.md §6](DEPLOYMENT.md#6-backups)) archives `/opt/vanidel-prod/.env` and `/opt/traefik` with the testing configuration: without `PAYLOAD_SECRET` and the S3 credentials, the backups cannot be used on a rebuilt server. Before launch, copy `/var/backups/vanidel-prod` nightly to a second location **in Algeria** (ARCHITECTURE §18).

Restore: `docker compose exec -T postgres pg_restore -U vanidel -d vanidel --clean < db-….dump`, and for files, stop `seaweedfs`, untar the archive into the volume with a throwaway container, and start it again.

## 5. Staging check and launch

Run the staging check from [DEPLOYMENT.md §7](DEPLOYMENT.md#7-staging-check) on `vanidel.com` with fake data, with `docker compose up -d --build` in place of `deploy.sh`. Then wipe the test data, production only:

```sh
cd /opt/vanidel-prod
docker compose down
docker volume rm vanidel-prod_postgres-data vanidel-prod_seaweedfs-data
docker run --rm -v /var/backups/vanidel-prod:/b alpine:3.22 sh -c 'rm -f /b/*'
docker compose up -d
```

The buckets are recreated on start. Next.js's page cache lives in the app container, so the new container no longer serves pages listing the test contest (the reason for the rebuild in DEPLOYMENT.md §8). Open `/admin` to create the admin user again, and check that `/fr/concours` and `/ar/concours` list no contests.

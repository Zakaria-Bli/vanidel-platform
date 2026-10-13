# Deployment

Vanidel runs on one VPS hosted in Algeria (ARCHITECTURE §17): the app as a single Node.js process under systemd, PostgreSQL 17 and a single-node SeaweedFS (S3 API) in Docker containers, and Traefik in front (also in Docker) for HTTPS. Real participant data and receipt photos stay on this server (Law 18-07, and the commitment to Algerian hosting).

The repository has no Docker files: the Compose file for PostgreSQL, SeaweedFS and Traefik lives on the server, and is given in full below.

Names used below:

- `vanidel.izakcodes.com`: the public address. Its DNS `A` record points at the VPS (`102.206.41.58`).
- `/opt/vanidel`: everything Vanidel owns on the server, owned and run by the `vanidel` user.

## Constraints

- **One app process.** The participation rate limit (10 attempts per IP per 10 minutes, `src/lib/rateLimit.ts`) is kept in memory. A second process or a Node cluster would keep its own count.
- **The proxy must set `X-Forwarded-For` to the client address.** The rate limit reads the first address in that header. Traefik does this as long as it does not trust incoming forwarded headers, its default: never set `forwardedHeaders.insecure` or `trustedIPs` on the entry points, or a client could pick its own IP. A proxying CDN in front (Cloudflare orange cloud) would make every visitor share the CDN's IP: keep the DNS record unproxied.
- **Uploads up to 11 MB.** A receipt photo the browser cannot shrink (HEIC outside Safari) is sent as is, up to 10 MB plus multipart overhead (`next.config.ts`).
- **Migrations run on start.** With `NODE_ENV=production`, Payload applies pending migrations from `src/migrations` when it initializes, on the first request after a restart.
- **The seed refuses to run in production.** Create the first admin user and contests in the admin interface.
- **Only Traefik is public.** The app, PostgreSQL and SeaweedFS listen on `127.0.0.1`. Files are downloaded through Payload (`/api/media/file/*`, `/api/tickets/file/*`), so receipt photos are only served to logged-in staff.
- **The printed QR code's address is permanent.** Whatever domain is printed must keep answering (or redirecting) for as long as the material is in circulation.

## 1. Server preparation

On Ubuntu 24.04, as root:

```sh
apt update && apt upgrade -y
apt install -y git ufw ca-certificates curl

# Docker Engine with the Compose plugin
curl -fsSL https://get.docker.com | sh

# Node.js 24 and pnpm (version pinned by package.json through Corepack)
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs
corepack enable

# Only SSH and HTTP(S) are reachable from outside
# (Traefik uses the host network, so these rules apply to it.)
ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable

# The vanidel user (create it with `adduser vanidel` if it does not exist yet)
usermod -aG docker vanidel
mkdir -p /opt/vanidel && chown vanidel:vanidel /opt/vanidel
```

### Swap

`pnpm build` lets Node use up to 4 GB (`--max-old-space-size=4096`), and it runs while the app, PostgreSQL and SeaweedFS are already using memory. On a 4 GB server, give it 4 GB of swap so a build never gets killed for lack of memory. Ubuntu images often ship a small `/swapfile` (check with `swapon --show`); this replaces it:

```sh
swapoff /swapfile 2>/dev/null; rm -f /swapfile
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Use swap only under memory pressure (builds), not for the running app.
echo 'vm.swappiness=10' > /etc/sysctl.d/99-vanidel-swap.conf
sysctl --system
```

Check with `free -h`: `Swap` shows `4.0Gi`. During a build, `free -h` may show swap in use; it drops again once the build ends. If a build still fails with `JavaScript heap out of memory` or `Killed`, run it while traffic is low, or build on another machine and copy `.next` over.

## 2. PostgreSQL, SeaweedFS and Traefik

As `vanidel`, in `/opt/vanidel/services`:

`.env` (mode `600`; generate each secret with `openssl rand -hex 24`):

```sh
POSTGRES_PASSWORD=...
S3_ACCESS_KEY_ID=vanidel-app
S3_SECRET_ACCESS_KEY=...
```

`s3.json`, the only S3 identity (no anonymous access), with the same two values:

```json
{
  "identities": [
    {
      "name": "vanidel",
      "credentials": [{ "accessKey": "vanidel-app", "secretKey": "..." }],
      "actions": ["Admin", "Read", "List", "Tagging", "Write"]
    }
  ]
}
```

`compose.yaml`:

```yaml
services:
  postgres:
    image: postgres:17-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: vanidel
      POSTGRES_USER: vanidel
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    ports:
      - '127.0.0.1:5432:5432'

  seaweedfs:
    image: chrislusf/seaweedfs:4.23
    restart: unless-stopped
    command: server -dir=/data -s3 -s3.config=/etc/seaweedfs/s3.json
    volumes:
      - ./data/seaweedfs:/data
      - ./s3.json:/etc/seaweedfs/s3.json:ro
    ports:
      - '127.0.0.1:8333:8333'

  # HTTPS entry point (section 4). On the host network so it reaches the app on 127.0.0.1:3000
  # and sees the real client address.
  traefik:
    image: traefik:v3.7.14
    restart: unless-stopped
    network_mode: host
    volumes:
      - ./traefik:/etc/traefik:ro
      - ./data/letsencrypt:/letsencrypt
```

Start the database and storage (Traefik comes in section 4), then create the two buckets once:

```sh
docker compose up -d postgres seaweedfs
# Wait for the S3 gateway (docker compose logs -f seaweedfs), then:
for bucket in vanidel-public vanidel-private; do
  docker compose exec seaweedfs sh -c "echo 's3.bucket.create -name $bucket' | weed shell"
done
```

The `vanidel` user needs to be in the `docker` group (`usermod -aG docker vanidel`), or run these as root.

## 3. The app

As `vanidel`:

```sh
git clone https://github.com/Zakaria-Bli/vanidel-platform.git /opt/vanidel/app
```

The repository is private: add a read-only deploy key (`ssh-keygen -t ed25519`, then the public key under the repository's **Settings → Deploy keys**) and clone with the SSH URL instead.

Environment, in `/opt/vanidel/app.env` (mode `600`, outside the checkout):

```sh
NODE_ENV=production
DATABASE_URL=postgresql://vanidel:<POSTGRES_PASSWORD>@127.0.0.1:5432/vanidel
# Unique to this server: openssl rand -base64 32
PAYLOAD_SECRET=...
SITE_URL=https://vanidel.izakcodes.com
S3_ENDPOINT=http://127.0.0.1:8333
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=vanidel-app
S3_SECRET_ACCESS_KEY=...
S3_BUCKET_PUBLIC=vanidel-public
S3_BUCKET_PRIVATE=vanidel-private
```

All six `S3_*` values are required in production; the app refuses to start without them (`src/lib/env.ts`).

Build once:

```sh
cd /opt/vanidel/app
set -a && . /opt/vanidel/app.env && set +a
pnpm install --frozen-lockfile
pnpm build
```

systemd unit, `/etc/systemd/system/vanidel.service` (as root):

```ini
[Unit]
Description=Vanidel
After=network-online.target docker.service
Wants=network-online.target

[Service]
User=vanidel
WorkingDirectory=/opt/vanidel/app
EnvironmentFile=/opt/vanidel/app.env
ExecStart=/usr/bin/pnpm start --hostname 127.0.0.1 --port 3000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```sh
systemctl daemon-reload && systemctl enable --now vanidel
journalctl -u vanidel -f
```

## 4. Traefik and HTTPS

Traefik terminates HTTPS, gets and renews the Let's Encrypt certificate, and forwards to the app on `127.0.0.1:3000`. It reads two files from `/opt/vanidel/services/traefik`; it does not watch Docker, so it needs no access to the Docker socket.

`traefik.yml` (static configuration):

```yaml
entryPoints:
  web:
    address: ':80'
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
  websecure:
    address: ':443'
    # Receipt photos (up to 11 MB) can be slow to upload on a mobile connection; the default
    # read timeout is 60 s. Traefik sets no request body limit by default.
    transport:
      respondingTimeouts:
        readTimeout: 300s
    http:
      tls:
        certResolver: letsencrypt
    # No forwardedHeaders settings: Traefik then replaces any client-sent X-Forwarded-For with
    # the real client address, which the rate limit relies on.

providers:
  file:
    filename: /etc/traefik/dynamic.yml
    watch: true

certificatesResolvers:
  letsencrypt:
    acme:
      storage: /letsencrypt/acme.json
      httpChallenge:
        entryPoint: web

log:
  level: INFO
accessLog: {}
```

`dynamic.yml` (routing):

```yaml
http:
  routers:
    vanidel:
      rule: Host(`vanidel.izakcodes.com`)
      entryPoints: [websecure]
      service: vanidel
      middlewares: [hsts]

  middlewares:
    hsts:
      headers:
        stsSeconds: 31536000

  services:
    vanidel:
      loadBalancer:
        servers:
          - url: http://127.0.0.1:3000
```

```sh
mkdir -p data/letsencrypt
docker compose up -d traefik
docker compose logs -f traefik
```

The certificate is requested on the first start, once the DNS record points at the server and ports 80 and 443 are open. Open `https://vanidel.izakcodes.com/admin`: the first request runs the migrations, and the admin offers to create the first user. Use a strong password.

## 5. Deploying an update

`/opt/vanidel/deploy.sh` (as `vanidel`; allow it to restart the service with a sudoers line `vanidel ALL=NOPASSWD: /usr/bin/systemctl restart vanidel`):

```sh
#!/usr/bin/env bash
set -euo pipefail
cd /opt/vanidel/app
set -a && . /opt/vanidel/app.env && set +a
git fetch origin main
git reset --hard origin/main
pnpm install --frozen-lockfile
pnpm build
sudo systemctl restart vanidel
```

The build replaces `.next` while the old process still runs, so pages can fail for the minute it takes: deploy outside participation peaks.

## 6. Backups

Nightly, from root's crontab (`crontab -e`):

```cron
# Database dump, 14 days kept
30 2 * * * cd /opt/vanidel/services && docker compose exec -T postgres pg_dump -U vanidel -Fc vanidel > /var/backups/vanidel/db-$(date +\%F).dump && find /var/backups/vanidel -name 'db-*.dump' -mtime +14 -delete
# File storage (receipt photos and media), 7 days kept
45 2 * * * tar -czf /var/backups/vanidel/files-$(date +\%F).tar.gz -C /opt/vanidel/services/data seaweedfs && find /var/backups/vanidel -name 'files-*.tar.gz' -mtime +7 -delete
```

(`mkdir -p /var/backups/vanidel && chmod 700 /var/backups/vanidel` first.)

These stay on the same disk. Before launch, copy `/var/backups/vanidel` nightly to a second location **in Algeria** (ARCHITECTURE §18), for example `rsync` to another Algerian server. Restore test: `pg_restore -U vanidel -d vanidel --clean` from a dump into the container, and untar the storage archive with SeaweedFS stopped.

## 7. Staging check

On the production server, with fake data, before the first real contest:

1. In the admin, create a test contest (placeholder title, regulation PDF and visuals) and publish it. Generate the QR code from its participation URL with its UTM parameters, and print it.
2. Scan it with a real iPhone (Safari) and a real Android phone (Chrome). On each, submit an entry with a photo taken by the camera.
3. In **Participations**, check both entries appear with their receipt thumbnail, the right wilaya and the UTM source.
4. Open a receipt photo from the admin. Sign out and request the same `/api/tickets/file/…` URL: it must be refused.
5. Export the CSV and check both rows.
6. Submit 11 entries from one phone within 10 minutes: the 11th must be refused. Then submit from the other phone: it must still be accepted (the rate limit sees separate client IPs).
7. Run `deploy.sh` and check the entries and photos are still there.

## 8. Wiping test data before launch

Test entries must not mix with real ones. Once the staging check passes:

```sh
systemctl stop vanidel
cd /opt/vanidel/services
docker compose down
rm -rf data/postgres data/seaweedfs
docker compose up -d
# Recreate the two buckets (step 2), then:
systemctl start vanidel
```

Open `/admin` again to recreate the admin user, then set up the real contest. Delete any backups taken during testing.

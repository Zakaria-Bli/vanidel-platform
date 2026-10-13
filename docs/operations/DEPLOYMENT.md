# Deployment

Vanidel runs on one VPS hosted in Algeria (ARCHITECTURE §17): the app as a single Node.js process under systemd, PostgreSQL 17 and a single-node SeaweedFS (S3 API) in Docker containers, and Nginx in front. Real participant data and receipt photos stay on this server (Law 18-07, and the commitment to Algerian hosting).

The repository has no Docker files: the Compose file for PostgreSQL and SeaweedFS lives on the server, and is given in full below.

Placeholders used below:

- `vanidel.example.com`: the public (sub)domain. Its DNS `A` record points at the VPS.
- `/opt/vanidel`: everything Vanidel owns on the server, run by the `vanidel` system user.

## Constraints

- **One app process.** The participation rate limit (10 attempts per IP per 10 minutes, `src/lib/rateLimit.ts`) is kept in memory. A second process or a Node cluster would keep its own count.
- **Nginx must overwrite `X-Forwarded-For` with the client address.** The rate limit reads the first address in that header. Appending (`$proxy_add_x_forwarded_for`) would let a client pick its own IP. A proxying CDN in front (Cloudflare orange cloud) would make every visitor share the CDN's IP: keep the DNS record unproxied.
- **Uploads up to 11 MB.** A receipt photo the browser cannot shrink (HEIC outside Safari) is sent as is, up to 10 MB plus multipart overhead (`next.config.ts`).
- **Migrations run on start.** With `NODE_ENV=production`, Payload applies pending migrations from `src/migrations` when it initializes, on the first request after a restart.
- **The seed refuses to run in production.** Create the first admin user and contests in the admin interface.
- **Only Nginx is public.** The app, PostgreSQL and SeaweedFS listen on `127.0.0.1`. Files are downloaded through Payload (`/api/media/file/*`, `/api/tickets/file/*`), so receipt photos are only served to logged-in staff.
- **The printed QR code's address is permanent.** Whatever domain is printed must keep answering (or redirecting) for as long as the material is in circulation.

## 1. Server preparation

On Ubuntu 24.04, as root:

```sh
apt update && apt upgrade -y
apt install -y git nginx certbot python3-certbot-nginx ufw ca-certificates curl

# Docker Engine with the Compose plugin
curl -fsSL https://get.docker.com | sh

# Node.js 24 and pnpm (version pinned by package.json through Corepack)
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs
corepack enable

# Only SSH and HTTP(S) are reachable from outside
ufw allow OpenSSH && ufw allow 'Nginx Full' && ufw --force enable

useradd --system --create-home --home-dir /opt/vanidel --shell /bin/bash vanidel
```

The build needs about 4 GB of memory (`pnpm build` sets `--max-old-space-size=4096`). On a smaller server, add swap (`fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile`, plus an `/etc/fstab` line).

## 2. PostgreSQL and SeaweedFS

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
```

Start them, then create the two buckets once:

```sh
docker compose up -d
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
SITE_URL=https://vanidel.example.com
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

## 4. Nginx and HTTPS

`/etc/nginx/sites-available/vanidel`:

```nginx
server {
    listen 80;
    server_name vanidel.example.com;

    client_max_body_size 11m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        # Overwrite, never append: the rate limit trusts the first address.
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
```

```sh
ln -s /etc/nginx/sites-available/vanidel /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
certbot --nginx -d vanidel.example.com --redirect
```

Certbot adds the HTTPS server block and renews the certificate on its own.

Open `https://vanidel.example.com/admin`: the first request runs the migrations, and the admin offers to create the first user. Use a strong password.

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

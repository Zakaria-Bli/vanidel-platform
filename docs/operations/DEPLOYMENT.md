# Deployment

Vanidel runs as one Node.js process (`pnpm build`, then `pnpm start`) next to PostgreSQL 17 and a single-node SeaweedFS that provides the S3 API (ARCHITECTURE §9, §17). The repository has no Dockerfile: on Dokploy the image is built by Nixpacks, and on the production VPS the app runs directly under Node.

Two targets:

- **Test server (Dokploy)**: the team's own VPS. **Fake test entries only.** Real participant data and receipt photos must stay in Algeria (Law 18-07, and the commitment to Algerian hosting), so the test server never receives a real participation, and its domain is never printed on campaign material.
- **Production (Algerian VPS)**: see [Production on the Algerian VPS](#production-on-the-algerian-vps).

## Constraints that apply to every target

- **One app instance.** The participation rate limit (10 attempts per IP per 10 minutes, `src/lib/rateLimit.ts`) is kept in memory. Two replicas or a Node cluster would each keep their own count.
- **The reverse proxy must set `X-Forwarded-For` to the client address.** The rate limit reads the first address in that header. A proxy that passes a client-supplied header through lets anyone pick their own IP; a CDN in front of the proxy makes every visitor share the CDN's IP.
- **Uploads up to 11 MB.** A receipt photo the browser cannot shrink (HEIC outside Safari) is sent as is, up to 10 MB plus multipart overhead (`next.config.ts`).
- **Migrations run on start.** With `NODE_ENV=production`, Payload applies pending migrations from `src/migrations` when it initializes, on the first request after a deploy. No separate migrate step.
- **The seed refuses to run in production.** Create the first admin user and contests in the admin interface.
- **SeaweedFS is never exposed publicly.** Only the app talks to it. Files are downloaded through Payload (`/api/media/file/*`, `/api/tickets/file/*`), so receipt photos are only served to logged-in staff.

## Environment variables

| Variable               | Value                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------- |
| `NODE_ENV`             | `production`                                                                       |
| `DATABASE_URL`         | `postgresql://user:password@host:5432/vanidel`                                     |
| `PAYLOAD_SECRET`       | 32+ random characters: `openssl rand -base64 32`. Unique per server; never reused. |
| `SITE_URL`             | Public origin, e.g. `https://vanidel-test.example.com` (no trailing slash)         |
| `S3_ENDPOINT`          | SeaweedFS S3 gateway on the private network, e.g. `http://vanidel-seaweedfs:8333`  |
| `S3_REGION`            | `us-east-1` (SeaweedFS ignores it, the S3 client needs one)                        |
| `S3_ACCESS_KEY_ID`     | The app's SeaweedFS identity                                                       |
| `S3_SECRET_ACCESS_KEY` | Its secret                                                                         |
| `S3_BUCKET_PUBLIC`     | `vanidel-public` (campaign media)                                                  |
| `S3_BUCKET_PRIVATE`    | `vanidel-private` (receipt photos)                                                 |

All six `S3_*` values are required in production; the app refuses to start without them (`src/lib/env.ts`). `SEED_*` variables are not used outside development.

## Test server on Dokploy

Create one Dokploy project, `vanidel-test`, holding the three services below. Do them in this order: database, storage, app.

### 1. PostgreSQL

1. **Create Service → Database → PostgreSQL.** Name `vanidel-db`, database `vanidel`, image `postgres:17-alpine`. Let Dokploy generate the password.
2. Leave **External Port** empty, so the database is reachable only on Dokploy's internal network.
3. Deploy, then copy the **Internal Connection URL** from the service page. It becomes `DATABASE_URL`.
4. **Backups:** add an S3 destination under **Settings → S3 Destinations** (any bucket off this server), then on the database's **Backups** tab schedule a daily backup (`0 3 * * *`) keeping 7. On the test server this is practice for production; production needs it for real (ARCHITECTURE §18).

### 2. SeaweedFS (S3 storage)

1. **Create Service → Compose.** Name `vanidel-storage`, source **Raw**, and paste:

   ```yaml
   services:
     seaweedfs:
       image: chrislusf/seaweedfs:4.23
       restart: unless-stopped
       environment:
         S3_ACCESS_KEY_ID: ${S3_ACCESS_KEY_ID}
         S3_SECRET_ACCESS_KEY: ${S3_SECRET_ACCESS_KEY}
       # Writes the S3 identity file from the environment, then starts master, volume, filer and
       # the S3 gateway in one process. Only the app's identity exists, so no anonymous access.
       entrypoint: ['/bin/sh', '-c']
       command:
         - |
           cat > /etc/s3.json <<EOF
           {"identities":[{"name":"vanidel","credentials":[{"accessKey":"$${S3_ACCESS_KEY_ID}","secretKey":"$${S3_SECRET_ACCESS_KEY}"}],"actions":["Admin","Read","List","Tagging","Write"]}]}
           EOF
           exec weed server -dir=/data -s3 -s3.config=/etc/s3.json
       volumes:
         - seaweedfs-data:/data
       networks:
         dokploy-network:
           aliases: [vanidel-seaweedfs]

   volumes:
     seaweedfs-data:

   networks:
     dokploy-network:
       external: true
   ```

   There is no `ports:` section on purpose: nothing is published on the host.

2. On the **Environment** tab, set `S3_ACCESS_KEY_ID` (e.g. `vanidel-app`) and `S3_SECRET_ACCESS_KEY` (`openssl rand -hex 24`). The app uses the same two values.
3. Deploy. Wait for the log line saying the S3 gateway is listening on 8333.
4. Create the two buckets once, from the service's **Terminal** tab (or `docker exec` on the server):

   ```sh
   for bucket in vanidel-public vanidel-private; do
     echo "s3.bucket.create -name $bucket" | weed shell
   done
   ```

The app reaches it at `http://vanidel-seaweedfs:8333`.

### 3. The app

1. **Create Service → Application.** Name `vanidel-app`.
2. **Source:** the GitHub repository, branch `main`. Turn on **Autodeploy** if every push to `main` should redeploy the test server.
3. **Build Type:** Nixpacks. It reads `packageManager` (pnpm 11.15.0) and `engines.node` (24) from `package.json`, installs with the lockfile, runs `pnpm build` and starts with `pnpm start`.
   - Check the first build log for the Node and pnpm versions. If it picks another Node, add `NIXPACKS_NODE_VERSION=24` to the environment. If Nixpacks cannot provide Node 24 or pnpm 11, switch the build type to Railpack, which installs the versions pinned in `package.json`.
4. **Environment:** the variables from [Environment variables](#environment-variables), with `DATABASE_URL` from step 1, the S3 credentials from step 2, and `SITE_URL=https://<subdomain>`.
5. **Advanced → Cluster settings:** **Replicas: 1** (see [Constraints](#constraints-that-apply-to-every-target)).
6. **Domains:** add `<subdomain>`, container port `3000`, HTTPS on, certificate **Let's Encrypt**. Point the subdomain's DNS `A` record at the VPS first. If the DNS is on Cloudflare, keep the record **DNS only** (grey cloud): through Cloudflare's proxy, every visitor would reach Traefik from a Cloudflare IP and share one rate-limit counter.
7. Deploy. Then open `https://<subdomain>/admin`: the first request runs the migrations, and the admin offers to create the first user. Create an admin account with a strong password.

Traefik (Dokploy's proxy) sets `X-Forwarded-For` to the connecting client and drops a client-supplied value, and has no request body limit by default, so the upload and rate-limit constraints hold without extra configuration.

### 4. Test contest

The seed does not run in production. In the admin, create a contest with placeholder content (any title, dates covering the test, a placeholder regulation PDF and visuals uploaded to **Media**), and publish it. Its public page gives the participation URL; generate the QR code from that URL with its UTM parameters.

### 5. Staging check

With fake data only:

1. Print the QR code. Scan it with a real iPhone (Safari) and a real Android phone (Chrome).
2. On each phone, submit an entry with a photo taken by the camera (on the iPhone this is HEIC, converted in the browser).
3. In the admin, check both entries appear in **Participations** with their receipt thumbnail, the right wilaya and the UTM source.
4. Open a receipt photo from the admin. Sign out and request the same `/api/tickets/file/…` URL: it must be refused.
5. Export the CSV and check both rows.
6. Submit 11 entries from one phone within 10 minutes: the 11th must be refused. Then submit from the other phone: it must still be accepted (proves the rate limit sees separate client IPs).
7. Redeploy the app and check the entries and photos are still there (data lives in PostgreSQL and SeaweedFS, not in the app container).

## Production on the Algerian VPS

Same three parts, on the Algerian provider, with real data.

- **App:** Node 24 with Corepack (`corepack enable`), then `pnpm install --frozen-lockfile`, `pnpm build`, and `pnpm start` under a process manager (systemd), as **one** process. Environment from the table above, `SITE_URL` the public domain.
- **PostgreSQL 17** listening on localhost only, with automated daily dumps copied off the server to a second location in Algeria (ARCHITECTURE §18).
- **SeaweedFS** with the same identity file and buckets as above, its ports bound to `127.0.0.1`. Its data directory is backed up together with the database dumps.
- **Nginx** in front, TLS on, and:

  ```nginx
  client_max_body_size 11m;

  location / {
      proxy_pass http://127.0.0.1:3000;
      proxy_http_version 1.1;
      proxy_set_header Host $host;
      # Overwrite, never append: the rate limit trusts the first address.
      proxy_set_header X-Forwarded-For $remote_addr;
      proxy_set_header X-Forwarded-Proto $scheme;
  }
  ```

  Use `$remote_addr`, not `$proxy_add_x_forwarded_for`, which would keep an address the client sent.

- Never copy the test server's database or buckets to production: production starts empty, with its own `PAYLOAD_SECRET` and S3 credentials.

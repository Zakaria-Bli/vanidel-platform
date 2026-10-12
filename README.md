# Vanidel

Vanidel is a Next.js and Payload CMS application backed by PostgreSQL. Architecture and product decisions live in [`docs/README.md`](docs/README.md).

## Requirements

- Node.js `24.15.0` (see `.node-version`)
- pnpm `11.15.0` (via Corepack)
- Docker for a throwaway PostgreSQL 17 container

```sh
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env
```

Set a unique `PAYLOAD_SECRET` (at least 32 characters) in `.env`; generate one with `openssl rand -base64 32`. Start PostgreSQL with the credentials from `.env.example`:

```sh
docker run -d --rm --name vanidel-postgres -p 127.0.0.1:5432:5432 \
  -e POSTGRES_USER=payload -e POSTGRES_PASSWORD=payload-local -e POSTGRES_DB=vanidel \
  postgres:17-alpine
docker exec vanidel-postgres pg_isready -U payload -d vanidel
# Wait for readiness before creating the separate test database.
docker exec vanidel-postgres createdb -U payload vanidel_test
```

The container's data is disposable. Stop and remove it with `docker stop vanidel-postgres`; this deletes its databases. Run the setup commands again to start fresh. Do not run these commands against shared or production infrastructure.

## Development

```sh
pnpm dev
```

The app is available at <http://localhost:3000>; Payload admin is at <http://localhost:3000/admin>. In development, Payload pushes schema changes to the database directly.

Run supporting services in throwaway Docker containers instead of installing them or adding Docker files to this repository.

### Seed data

```sh
pnpm seed
```

Creates `admin@vanidel.local` and `commercial@vanidel.local` (passwords from `SEED_ADMIN_PASSWORD` and `SEED_COMMERCIAL_PASSWORD` in `.env`) and a published French/Arabic contest at `/concours/concours-demo`, open for four weeks, with placeholder images. It is safe to re-run: existing users, images and the contest are left as they are. It refuses to run with `NODE_ENV=production`. Like `pnpm dev`, it pushes schema changes to the development database; to seed a database managed by migrations instead, run `pnpm migrate` first and seed with `PAYLOAD_MIGRATING=true pnpm seed`.

### Upload storage

Without S3 settings, uploads stay on local disk: campaign media in `media/` and receipt photos in `tickets/` (both git-ignored). Production stores them in SeaweedFS through its S3 API (see `docs/architecture/ARCHITECTURE.md` §9). To try that locally, start a throwaway SeaweedFS with its S3 port bound to `127.0.0.1` and create the two buckets:

```sh
docker run -d --rm --name vanidel-seaweedfs -p 127.0.0.1:8333:8333 \
  chrislusf/seaweedfs:4.23 server -dir=/data -s3
# Wait a few seconds for the S3 gateway, then:
for bucket in vanidel-public vanidel-private; do
  docker exec vanidel-seaweedfs sh -c "echo 's3.bucket.create -name $bucket' | weed shell"
done
```

Then set the `S3_*` variables in `.env` (`S3_ENDPOINT=http://127.0.0.1:8333`, the bucket names above, and any access key and secret: this local gateway has no identities configured, so it accepts any credentials and allows anonymous access). Production must configure SeaweedFS S3 identities so that only the application's credentials can read the private bucket. Either way, files are downloaded through Payload (`/api/media/file/…`, `/api/tickets/file/…`), so collection access control applies: receipt photos are only served to logged-in staff.

## Payload schema changes

After changing collections or fields, regenerate the generated files and create a migration:

```sh
pnpm generate:types
pnpm generate:importmap
pnpm migrate:create <name>
```

Commit the files in `src/migrations/`. CI fails when the schema changes without a migration or when generated files are stale. Generated files should not be edited by hand.

With `NODE_ENV=production`, pending migrations run automatically when Payload initializes. `pnpm migrate` and `pnpm migrate:status` run or inspect them manually.

## Checks and tests

```sh
pnpm lint            # fails on any warning
pnpm format:check
pnpm type-check      # regenerates Next.js route types, then runs TypeScript
pnpm audit:dependencies
```

Type checking clears only `.next/types` and `.next/dev/types` before running `next typegen`; the build and caches are preserved. This repairs stale route references after a branch switch without running the application. Avoid running it alongside `pnpm dev` or `pnpm build`, which also write route types. Use `pnpm devsafe` when the full Next.js cache needs resetting.

pnpm 11 can install dependencies automatically before running scripts when it detects an outdated installation. Install from the lockfile first. For checks against an already installed dependency tree without automatic installation (for example an offline or read-only audit), use `pnpm --config.verify-deps-before-run=ignore <script>`. This option does not verify that the installed dependencies match the lockfile.

Tests require an isolated PostgreSQL database initialized through committed migrations. Never point `DATABASE_URL` in `.env.test` at development, shared, or production data.

```sh
cp .env.test.example .env.test
pnpm test           # applies committed migrations with schema push disabled, then tests Payload
pnpm test:coverage  # integration-test coverage
```

The test setup loads `.env.test` explicitly, requires a local database whose name ends in `_test`, and fails if the file is missing. `DOTENV_CONFIG_PATH` can select another test-only environment file. Tests apply pending migrations, check that a second migration run is a no-op, exercise access control and persistence, and close the Payload instance. Run test files serially (`fileParallelism: false`): they share one database. Unit tests for `src/lib` and `src/modules` sit next to the code as `*.spec.ts`. CI starts with an empty database.

If an old test database was initialized by schema push, tests refuse it without deleting data. Recreate only your disposable `vanidel_test` database:

```sh
docker exec vanidel-postgres dropdb -U payload vanidel_test
docker exec vanidel-postgres createdb -U payload vanidel_test
```

Dependency exceptions, override rationale, ownership, and review dates are documented in [`docs/operations/DEPENDENCIES.md`](docs/operations/DEPENDENCIES.md).

## Build

```sh
pnpm build
pnpm start
```

`/api/health` is a liveness check only; it does not probe PostgreSQL or media storage. Deployment (reverse proxy, process management, storage, backups) is not set up yet; see `docs/README.md` for the documents planned before production.

## Project documentation

- [`docs/product/`](docs/product/) — scope, specification, and user flows
- [`docs/architecture/`](docs/architecture/) — system architecture, domain model, and ADRs

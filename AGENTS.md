# Agent instructions

Vanidel is a Payload CMS 3 + Next.js 16 + PostgreSQL contest platform. Read `docs/README.md` before changing behavior; `docs/product/SPECIFICATION.md` is the functional source of truth.

- Contest business logic lives in explicit services under `src/modules/`, not in Payload hooks (see `docs/architecture/ARCHITECTURE.md`).
- Use the globally installed `payload` skill for Payload CMS work (collections, fields, hooks, access control, Local API, migrations) before relying on memory.
- Payload collections live in `src/payload/collections/`.
- When local work needs a supporting service (PostgreSQL, SeaweedFS/S3 storage, etc.), run it in a throwaway Docker container rather than adding Docker files to the repo; the app itself runs with `pnpm dev`.
- After schema changes, run `pnpm generate:types`, `pnpm generate:importmap` and `pnpm migrate:create <name>`, and commit the results.
- Before finishing, run `pnpm lint`, `pnpm format:check`, `pnpm type-check` and `pnpm test`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

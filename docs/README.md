# Vanidel Documentation

## Product

- [`product/SPECIFICATION.md`](product/SPECIFICATION.md) — product and functional source of truth for Phase 1.
- [`product/SCOPE.md`](product/SCOPE.md) — included/excluded scope and staged delivery boundary.
- [`product/USER_FLOWS.md`](product/USER_FLOWS.md) — participant, participation review, draw, publication, and administration flows.

## User Manual & Quality Assurance

- [`user-manual/README.md`](user-manual/README.md) — complete user manual with step-by-step walkthroughs and screenshots for participants and staff.
- [`audit-report.md`](audit-report.md) — comprehensive functional audit report with categorized findings and reproduction steps.
- [`test-coverage.md`](test-coverage.md) — end-to-end testing coverage matrix across participant and administrative workflows.

## Architecture

- [`architecture/ARCHITECTURE.md`](architecture/ARCHITECTURE.md) — current system structure.
- [`architecture/DOMAIN_MODEL.md`](architecture/DOMAIN_MODEL.md) — domain boundaries and core entities.
- [`architecture/adr/0001-use-payload-nextjs-postgresql.md`](architecture/adr/0001-use-payload-nextjs-postgresql.md) — architecture decision record.

## Brand

- [`brand/README.md`](brand/README.md) — the client's charter applied to the platform: colours, fonts, logo and slogan files, and where to use each.

## Operations

- [`operations/DEPENDENCIES.md`](operations/DEPENDENCIES.md) — dependency exceptions, overrides, ownership, and review policy.
- [`operations/DEPLOYMENT.md`](operations/DEPLOYMENT.md) — the testing environment on the Algerian VPS (app under systemd): setup, deploying updates, backups, staging check.
- [`operations/DEPLOYMENT_DOCKER.md`](operations/DEPLOYMENT_DOCKER.md) — production (`vanidel.com`) fully in Docker on the same VPS: the app's `docker-compose.yml` and the VPS-wide Traefik in `/opt/traefik` that serves both environments.
- [`operations/GUIDE_EQUIPE_COMMERCIALE.md`](operations/GUIDE_EQUIPE_COMMERCIALE.md) — handover guide for Vanidel's commercial team, in French: creating, publishing, tracking, drawing and closing a contest.

## Later

Before production, add:

- `architecture/DATA_AND_PRIVACY.md`
- `operations/BACKUP_AND_RECOVERY.md`

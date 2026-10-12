# Vanidel — System Architecture

## 1. Architecture summary

Vanidel Phase 1 will be implemented as a **modular monolith** using:

- **Next.js** for the public application and server-side web layer.
- **Payload CMS** for admin UI, authentication, content/data collections, APIs, access control, media integration, and jobs.
- **PostgreSQL** as the primary relational database.
- **SeaweedFS**, self-hosted, as S3-compatible object storage for uploaded/public media, with public/private separation.
- **Meta/Google analytics integrations** for campaign measurement.

The first production system should remain one deployable application plus its supporting database/storage infrastructure.

**Data residency:** application-stored participation records, contact data, consent records, ticket/proof images, database backups, and object-storage backups are hosted on the Algerian infrastructure. Meta/Google analytics and pixel integrations are separate third-party data flows; they must be configured so that form PII, consent records, and ticket images are never intentionally transmitted to those services. Any telemetry processed by those providers is treated separately from the application's hosted data-residency boundary.

## 2. Architecture goals

The architecture must optimize for:

1. Fast delivery for the 15 October launch.
2. A usable administration for Vanidel's commercial team.
3. Explicit business logic for participation/duplicate-prevention/draw workflows.
4. Safe handling of participant data and ticket images.
5. Reuse for future corporate content.
6. Evolution toward future commerce without implementing it now.
7. Low operational complexity.
8. Maintainability and handover.

## 3. High-level view

```text
                        vanidel.com
                             │
                       reverse proxy
                             │
                    Next.js + Payload
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
     Public Web         Payload Admin     Application Services
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
                         Payload API
                             │
               ┌─────────────┴─────────────┐
               │                           │
          PostgreSQL          SeaweedFS (S3 API)
                                       │
                              ┌────────┴────────┐
                              │                 │
                         public media      private tickets
```

## 4. Modular monolith

The system is one application but is organized around domain modules.

Suggested structure:

```text
src/
├── app/
│   ├── [locale]/
│   └── api/
│
├── modules/
│   ├── contests/
│   │   ├── domain/
│   │   ├── services/
│   │   └── queries/
│   ├── audience/
│   └── analytics/
│
├── payload/
│   ├── collections/
│   ├── access/
│   └── payload.config.ts
│
├── components/
└── lib/
```

The physical structure may evolve, but domain boundaries should remain explicit.

## 5. Payload's role

Payload is used as:

- CMS/admin framework.
- Authentication foundation for back-office users.
- Access-control layer.
- Collection/data access layer.
- Media metadata layer.
- API/Local API.
- Job execution infrastructure where needed.

Payload is **not** the domain architecture itself.

Business operations should remain explicit application services.

Examples:

```text
submitParticipation()
preventDuplicates()
executeDraw()
voidWinnerAndRedraw()
publishWinner()
exportConsentedContacts()
```

These services may use Payload's Local API for persistence.

## 6. Public application

Next.js handles:

- Public contest pages.
- Locale-independent contest entry routing (`/concours/{slug}`) for printed QR/campaign links.
- Arabic/French localized contest routing (`/{fr|ar}/concours/{slug}`, see SPECIFICATION §17.1).
- RTL rendering.
- Participation UI.
- Server-side validation entry points.
- SEO metadata.
- Social preview metadata.
- Tracking integration.
- Winners/archive pages.
- Future corporate and commerce frontend routes.

## 7. Administration

The first administration should use Payload's standard admin capabilities as much as possible.

Initial navigation should focus on business concepts:

- Contests
- Participations
- Draws
- Winners
- Contacts
- Media

Avoid building a bespoke admin shell before the operational need justifies it.

Custom admin views may be added later for high-value workflows such as draws or reporting.

## 8. Database

Use PostgreSQL.

Reasons:

- Contest data is relational.
- Participation and draw queries benefit from SQL.
- Future reporting is easier.
- Future commerce is naturally relational.

Important indexes should be introduced around common draw/reporting queries, for example:

- participation contest
- submission timestamp
- normalized phone (per contest, for duplicate prevention)
- ticket file hash (per contest, unique)
- normalized email
- campaign/source fields

## 9. File/media architecture

Use logically separate public and private media handling.

### Public media

Examples:

- Contest hero images.
- Prize images.
- Share images.
- Regulations where intended to be public.
- Published winner media.

### Private media

Examples:

- Ticket/proof-of-purchase images.

Private ticket files must require authorization and must not be published through public asset URLs by default.

### Storage implementation

- SeaweedFS runs self-hosted on the Algerian infrastructure and exposes the S3 API.
- Payload uses `@payloadcms/storage-s3` pointed at the SeaweedFS S3 gateway, with path-style addressing (`forcePathStyle: true`).
- Two buckets: a public bucket for campaign/editorial media, and a private bucket for tickets with no anonymous read.
- Tickets are served only through Payload access control or short-lived signed URLs, never through a direct bucket link.
- The S3 gateway and SeaweedFS master/filer ports are bound to localhost or the private network. Only the reverse proxy is public.

## 10. Participation write path

Anonymous/public submissions should go through a constrained application endpoint/server action, not unrestricted generic collection CRUD.

```text
Public form
   ↓
submitParticipation()
   ↓
validate contest state
   ↓
validate fields/files
   ↓
normalize phone
   ↓
duplicate prevention (ticket hash in contest, phone entry limit in period)
   ↓
find or create Contact by normalized phone (never update it)
   ↓
persist Participation (with submitted-data snapshot) / Consent
   ↓
return confirmation
```

## 11. Draw architecture

Draw execution is a domain command.

```text
Admin action
   ↓
executeDraw()
   ↓
resolve the period (contest settings, Africa/Algiers time)
   ↓
query all participations submitted in the period
   ↓
hash the ordered list of eligible IDs
   ↓
secure random selection
   ↓
persist Draw (period, pool hash, count, executor)
   ↓
persist Winner(s)
```

The draw is operator-triggered rather than automatically scheduled.

A re-draw voids the affected winner with a reason and creates a new Draw linked to the previous draw. It reuses the original period and eligibility rules, but excludes every Participation already selected as a Winner anywhere in the original draw/re-draw chain. It selects only the replacement winner count required. Completed draws are never modified.

## 12. Jobs

Use Payload jobs only where delayed/recurring execution brings clear value.

Examples:

- Scheduled contest state transitions.
- Future notifications.
- Maintenance tasks.

Do not use a job queue merely to make synchronous Phase 1 workflows more complex.

## 13. Localization

Split localization into two concerns.

### Managed content

Payload localized fields:

- Contest titles.
- Descriptions.
- Instructions.
- Prize content.
- SEO text.

### Application interface

Next.js application localization:

- Buttons.
- Validation messages.
- Navigation.
- Form labels.
- System messages.

Arabic requires RTL support.

Implementation (`next-intl`):

- `src/i18n/config.ts` is the single source of truth for locales (`fr` default, `ar`), their direction and display names. Routing, the proxy, Payload `localization` and the language switcher derive from it.
- Public pages live under `src/app/(frontend)/[locale]/` with `localePrefix: 'always'`; the layout sets `<html lang dir>` and validates the locale.
- `src/proxy.ts` redirects unprefixed public paths to the visitor's locale (`NEXT_LOCALE` cookie, then `Accept-Language`, then `fr`). This serves the locale-independent QR entry `/concours/{slug}`. Payload's `/admin` and `/api` are excluded.
- Interface strings live in `src/i18n/messages/{fr,ar}.json` with identical keys (checked by `src/tests/int/i18n.int.spec.ts`). Editorial content stays in Payload localized fields.
- Internal links use `Link`/`redirect` from `src/i18n/navigation.ts`, never `next/link` or a hand-built `/${locale}` prefix.

## 14. Consent state and exports

Consent records are historical. For each Contact and consent type, the effective consent state is resolved from the most recent applicable ConsentRecord.

Marketing exports must include only Contacts whose effective state for the required consent type is granted. Exported contact details should come from the latest Participation snapshot for that Contact.

## 15. Analytics

Use a hybrid approach.

### External analytics

- Page views.
- Campaign traffic.
- Pixel events.
- Conversion-style events.

### Database reporting

- Participation counts.
- Wilaya distribution.
- Source attribution.
- Draw/winner metrics.

Do not build a custom analytics platform in Phase 1.

## 16. Security baseline

At minimum:

- Authenticated admin access.
- Role-aware Payload access rules.
- Server-side validation.
- Restricted ticket file access.
- Upload type/size limits.
- Basic rate limiting/abuse protection.
- Security headers.
- Secret management through environment variables.
- Audit metadata for draws and re-draws.
- Database backups.
- Off-server backup copies where practical.

## 17. Deployment

Initial deployment target:

```text
VPS
├── reverse proxy
├── Next.js + Payload application
├── Payload job runner if needed
├── PostgreSQL
└── SeaweedFS (S3 API, private network only)
    ├── public media bucket
    └── private tickets bucket
```

Everything runs at the Algerian hosting provider.

No Kubernetes or microservices are required.

## 18. Backup/recovery

Before production:

- Automated PostgreSQL backups.
- Off-server copy.
- Backup of the SeaweedFS buckets (tickets included) together with the PostgreSQL dumps, to a second location in Algeria. A single-node SeaweedFS on the same VPS shares the database's disk, so one disk failure would otherwise lose both.
- Documented restore procedure.
- Periodic restore test.

A dedicated backup/recovery document should be added before production.

## 19. Future corporate phase

The corporate phase can extend the same application with content modules such as:

- Pages.
- Product ranges.
- Recipes.
- Points of sale.
- News.

This is a natural extension of the Payload/Next.js foundation.

## 20. Future commerce phase

Commerce implementation is deliberately undecided.

When Phase 3 requirements are purchased and specified, evaluate:

- Payload commerce/custom commerce within the modular monolith, or
- a dedicated commerce backend integrated with the same frontend/foundation.

Do not install or model commerce in Phase 1.

## 21. Architecture constraints

The following should be avoided until justified:

- Microservices.
- Multiple databases per domain.
- Separate admin application.
- Dedicated commerce service.
- Redis solely for architectural fashion.
- Generic workflow engines.
- Generic form builders.
- Excessive Payload hooks containing hidden business logic.

## 22. Architectural principle

> Design Phase 1 so later phases can be added; do not implement later phases before they are sold.

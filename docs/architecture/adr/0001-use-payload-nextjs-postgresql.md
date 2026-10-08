# ADR-0001: Use Payload CMS + Next.js + PostgreSQL as a Modular Monolith

- **Status:** Accepted
- **Date:** 2026-10-08
- **Decision owners:** iZak Code / Vanidel technical implementation
- **Scope:** Vanidel Phase 1 platform foundation

## Context

Vanidel accepted the `Croissance` offer for a reusable contest/tombola platform.

The Phase 1 system must support:

- Reusable contest creation.
- Arabic and French public pages.
- Ticket/proof-of-purchase upload.
- Participant/contact data.
- Consent capture.
- Duplicate prevention at submission.
- Weekly random draws (configurable period) and re-draws.
- Winner publication.
- Contest archives.
- Campaign/source tracking.
- Meta/Google tracking.
- Contact export.
- Per-contest reporting.

The first contest must launch on 15 October 2026.

The accepted commercial roadmap also anticipates a future corporate site and e-commerce site using a common technical foundation, but those phases have not yet been purchased.

The architecture therefore needs to balance:

- immediate development speed,
- commercial-team usability,
- custom business logic,
- future content-management needs,
- maintainability,
- hosting simplicity,
- and evolution without pre-building future scope.

## Decision drivers

1. Deliver Phase 1 quickly.
2. Avoid building a custom admin/CMS.
3. Keep contest logic explicit and testable.
4. Support Arabic/French content.
5. Support private ticket uploads.
6. Support role-aware back-office access.
7. Use relational persistence suitable for contest/reporting data.
8. Keep infrastructure simple.
9. Reuse the foundation for a future corporate site.
10. Preserve options for future commerce.
11. Minimize unnecessary vendor/platform coupling.
12. Keep the stack aligned with TypeScript/React development.

## Considered options

### Option A — Payload CMS + Next.js + PostgreSQL

Benefits:

- Next.js-native application architecture.
- Built-in admin UI.
- Authentication and access control.
- Collection schemas and APIs.
- Media management.
- Localization support.
- Jobs/hooks/extensions.
- Strong fit for both editorial and application data.
- One main TypeScript application.
- Natural future corporate CMS extension.

Risks:

- Business logic can become hidden in Payload hooks if poorly structured.
- Application can become overly CMS-centric.
- Some framework coupling exists.
- E-commerce capabilities may not be sufficient for an unknown future Phase 3.

### Option B — Directus + Next.js + PostgreSQL

Benefits:

- Excellent data-oriented administration.
- Strong SQL/database-first architecture.
- Good permissions and file management.
- Good data table UX for participation lists.
- Low database lock-in.

Risks:

- Separate Directus and Next.js runtimes.
- More architectural decisions around where business logic belongs.
- Less cohesive TypeScript application model.
- Future commerce would likely require custom or external implementation.

### Option C — Supabase + Next.js + custom administration

Benefits:

- Strong PostgreSQL foundation.
- Good transactional/application backend.
- Auth, storage, RLS, functions/jobs.
- Excellent control of the business model.

Risks:

- Requires building the Vanidel administration/CMS.
- Slower Phase 1 delivery.
- Higher implementation cost for a 65,000 DZD project.
- Corporate CMS would require further custom development or another system.

### Option D — Strapi + Next.js

Benefits:

- Mature CMS/admin capabilities.
- Localization.
- Media.
- Extensible backend.

Risks:

- More clearly separated CMS backend/frontend architecture.
- Custom transactional business logic is less cohesive with the Next.js application than Payload.
- Stronger fit for editorial CMS use cases than mixed CMS/application use cases.

### Option E — Sanity + Next.js + separate transactional backend

Benefits:

- Excellent editorial experience.
- Strong future corporate CMS capability.

Risks:

- Contest transactional data would benefit from a separate database/backend.
- Introduces multiple data platforms for Phase 1.
- Excessive complexity for current scope.

### Option F — Fully custom Next.js + PostgreSQL

Benefits:

- Maximum domain control.
- Minimal framework-specific CMS coupling.

Risks:

- Requires building admin CRUD, media, localization, permissions, participation and draw UI, and future CMS capabilities.
- Too expensive and slow relative to current budget/deadline.

### Option G — Dedicated commerce platform from day one

Rejected because e-commerce has not been purchased and Phase 3 requirements are not yet defined.

## Decision

Use:

- **Next.js**
- **Payload CMS**
- **PostgreSQL**
- **SeaweedFS**, self-hosted, as S3-compatible object storage
- a **modular monolith** architecture

for Vanidel Phase 1.

Payload will provide:

- Admin UI.
- Authentication.
- Access control.
- Collection/data infrastructure.
- Media integration.
- APIs/Local API.
- Localization for managed content.
- Jobs where justified.

Next.js will provide:

- Public site/application.
- Arabic/French routing and interface localization.
- Participation experience.
- SEO/social metadata.
- Tracking integration.
- Future corporate/storefront UI.

PostgreSQL will provide:

- Primary relational persistence.
- Reporting/query foundation.
- Future-compatible structured data storage.

Object storage (SeaweedFS, accessed through the S3 API) will separate:

- public campaign/editorial assets,
- private ticket/proof-of-purchase files.

All components run at the Algerian hosting provider, so personal data and ticket images stay in Algeria. SeaweedFS was chosen over a hosted S3 service for that reason, while keeping the standard S3 API so the storage can be swapped later.

## Domain architecture decision

Payload collections are persistence/admin mechanisms, not the business architecture.

Custom contest behavior must live in explicit application services such as:

- `submitParticipation`
- `preventDuplicates`
- `executeDraw`
- `voidWinnerAndRedraw`
- `publishWinner`
- `exportConsentedContacts`

Generic CRUD must not bypass critical domain invariants.

## Repository/application shape

Initial implementation remains one application/repository.

A multi-application monorepo is not required for Phase 1.

Suggested logical structure:

```text
src/
├── app/
├── modules/
│   ├── contests/
│   ├── audience/
│   └── analytics/
├── payload/
├── components/
└── lib/
```

## Consequences

### Positive

- Faster implementation.
- No need to build an admin framework.
- Strong commercial-team usability.
- One primary TypeScript stack.
- Low operational complexity.
- Good future corporate CMS path.
- Explicit domain logic remains possible.
- PostgreSQL preserves relational/reporting flexibility.

### Negative

- Payload-specific schemas/access configuration create some framework coupling.
- Discipline is required to avoid putting all business logic into hooks.
- Custom admin screens may still be needed later.
- Future e-commerce architecture remains unresolved.

## Deferred decisions

The following are intentionally **not decided by this ADR**:

- Final Phase 3 commerce architecture.
- Whether a future dedicated commerce backend such as Medusa is needed.
- Corporate page-builder structure.
- Advanced analytics/BI.
- OCR/automated receipt validation.
- Advanced marketing automation.
- Microservices.
- Multiple deployable frontend applications.

These decisions should be made only when the related requirements are purchased and known.

## Revisit conditions

Revisit this ADR if:

- The contest platform grows beyond the operational limits of a modular monolith.
- A future commerce scope introduces requirements that Payload cannot reasonably support.
- Vanidel needs separate deployment/security boundaries.
- Multiple independent teams begin developing separate domains.
- Operational scale or compliance requirements justify architectural separation.

## Guiding principle

> Build Phase 1 so Phase 2 and Phase 3 can be added without rewriting the contest platform, but do not make Phase 1 pay the implementation cost of future phases that Vanidel has not yet purchased.

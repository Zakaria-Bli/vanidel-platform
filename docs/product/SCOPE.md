# Vanidel — Phase 1 Scope

**Offer:** `Croissance`
**Purpose:** Protect the agreed Phase 1 boundary and distinguish current delivery from future roadmap items.

## 1. Scope principle

The accepted `Croissance` offer covers the reusable contest platform and its visibility/acquisition features.

The corporate website and e-commerce website are future phases and are not included in the current implementation.

The codebase should be designed so those phases can be added later, but **future functionality must not be implemented merely because it may be useful later**.

## 2. Included in the current offer

### Contest platform

- Reusable contest page model.
- Arabic and French.
- Up to 6 contests per year without redevelopment.
- Contest administration.
- Contest visuals.
- Prizes.
- Dates.
- Participation instructions.
- Regulations.
- Winners.
- Archive.

### Participation

- Name.
- Phone.
- Email.
- Wilaya.
- Ticket photo.
- Consent fields.
- Contest-specific field configuration where required.

### Participation review

- Participation list (read-only).
- Ticket review, mainly to verify drawn winners.
- Duplicate prevention at submission.

There is no moderation step: no approval or rejection. Every accepted submission enters the draw pool. See section 7.

### Draws

- Draw workflow, weekly by default, with the period and draw day configurable per contest.
- Selection among all participations submitted in the draw period.
- Re-draw when a winner is invalid or unreachable.
- Persisted/logged draw results.
- Archive/history.

### Audience/contact base

- Consented contact records.
- Cross-contest contact base.
- Export.

### Visibility/acquisition

- Social sharing.
- Social preview metadata.
- SEO-ready public pages.
- Tracked campaign links.
- Meta/Google pixels.
- Per-contest reporting.

## 3. Delivery split

### 3.1 Required for 15 October 2026

- First contest page.
- Arabic/French.
- First contest configured by developer.
- Participation form.
- Ticket upload.
- Consent capture.
- Duplicate prevention at submission.
- Participation list.
- Export.

The draw tool is not needed on launch day. It must be ready **before the first draw date** of the first contest.

### 3.2 Completed during the first contest

- Reusable contest creation administration.
- Scheduling/opening/closing controls.
- Winners section.
- Contest archive.
- Social sharing.
- Channel/source tracking.
- End-of-contest reporting.
- Commercial-team handover for future contests.

This staged delivery is part of the agreed proposal and should be used to prioritize implementation.

## 4. Explicitly excluded from `Croissance`

### Corporate site

Not included:

- Brand presentation pages.
- Product ranges.
- Recipes.
- Store locator / points of sale.
- News/editorial section.
- General corporate page builder.

### E-commerce

Not included:

- Product catalog implementation for sales.
- Shopping cart.
- Checkout.
- Payments.
- Order management.
- Customer accounts.
- Inventory/warehouse logic.
- Fulfillment.
- Shipping.
- Promotions engine.

### Communication services

Not included unless separately requested:

- Transactional email service implementation beyond what is necessary for the agreed workflow.
- Promotional email campaigns.
- SMS campaigns.
- SMTP/SMS provider costs.

### Advanced contest automation

Not included:

- OCR.
- Receipt data extraction.
- AI ticket validation.
- Advanced fraud scoring.
- Generic workflow engine.
- Arbitrary no-code form builder.
- Automatic legal eligibility determination.

### Platform engineering

Not required for Phase 1:

- Microservices.
- Kubernetes.
- Event-driven distributed architecture.
- Separate databases per domain.
- Multi-application monorepo solely for future-proofing.
- Dedicated commerce backend before Phase 3 requirements exist.

## 5. “Same foundation” interpretation

The proposal's common foundation should be implemented as shared technical foundations and compatible domain design:

- One domain.
- One visual/design system.
- One hosting environment where practical.
- One audience/contact foundation.
- Shared analytics conventions.
- Shared authentication/admin foundation.
- Shared media and localization approach.

It does **not** require all future business domains to be tightly coupled into one model.

The architecture should preserve separation between:

- Contest data.
- Audience/contact/consent data.
- Corporate/editorial content.
- Product/catalog data.
- Future order/commerce data.

## 6. Change-control rule

Any request that materially extends the items listed as included should be assessed against this scope.

Examples that should trigger a scope check:

- New participation mechanics.
- Automated verification.
- Additional integrations.
- Complex custom dashboards.
- Email/SMS automation.
- Commerce features.
- Corporate content modules.
- New roles/workflows beyond the initial operational need.

Where a request is outside the accepted `Croissance` scope, it should be estimated separately rather than absorbed into Phase 1.

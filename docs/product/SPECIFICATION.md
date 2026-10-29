# Vanidel Contest Platform — Product & Functional Specification

**Status:** Initial specification  
**Phase:** Phase 1 — `Croissance` offer  
**Client:** Vanidel  
**Source:** Accepted commercial proposal `IZC-VAN-2026-01` dated 4 October 2026

## 1. Purpose

Vanidel is purchasing a reusable contest/tombola platform rather than a one-off campaign page.

The platform must support repeated campaigns, allow Vanidel's commercial team to manage future contests through an administration interface, collect participations, perform weekly draws, publish winners, maintain an archive, and build a reusable audience/contact base.

The platform is also intended to become the first technical block of later corporate and e-commerce phases, but those later phases are **not part of the current `Croissance` implementation scope**.

## 2. Delivery strategy

Phase 1 is intentionally delivered in two steps.

### 2.1 Launch target — 15 October 2026

The first contest must be online with:

- Arabic and French public contest experience.
- Contest page configured by the developer.
- Participation form.
- Ticket/proof-of-purchase image upload.
- Required consent fields.
- Duplicate prevention at submission.
- Participation list.
- Export capability.

The draw capability is not required on launch day. It must be ready before the first draw date of the first contest.

### 2.2 During the first contest

Complete the reusable administration required for future campaigns:

- Contest creation and configuration.
- Contest scheduling/opening/closing.
- Winners section.
- Contest archive.
- Social sharing.
- Campaign/source tracking.
- End-of-contest reporting.

The commercial team should be able to manage subsequent contests without redevelopment.

## 3. Actors

### 3.1 Participant

A member of the public who reaches a contest through QR code, social media, direct link, influencer link, or another campaign source.

The participant can:

- View the active contest.
- Read participation instructions.
- View prizes.
- Access the contest regulations.
- Submit participation information.
- Upload a ticket/proof-of-purchase image.
- Grant or refuse applicable consent.
- Receive confirmation that the submission was recorded.
- Share the contest.
- View published winners and archived contests.

### 3.2 Commercial team

Vanidel users responsible for campaign operations.

They can:

- Create future contests.
- Configure campaign content.
- Add campaign visuals.
- Configure dates.
- Add prizes.
- Add regulations.
- Review participations.
- Inspect ticket images, mainly to verify drawn winners.
- Run draws and re-draws.
- Publish winners.
- Export consented contact data.
- Review campaign statistics.

### 3.3 Administrator / technical operator

The developer or authorized technical administrator.

They can:

- Manage application users and permissions.
- Configure infrastructure-level settings.
- Support data recovery and maintenance.
- Manage technical integrations.
- Investigate operational issues.

## 4. Contest lifecycle

A contest should conceptually support the following states:

1. **Draft** — not public.
2. **Scheduled** — configured and planned for a future start.
3. **Open** — accepting participations.
4. **Closed** — no longer accepting participations.
5. **Archived** — remains publicly accessible as a past campaign.

Exact state-transition rules may be refined during implementation, but a contest must not accept new participations outside its valid participation period.

## 5. Contest content

Each contest must support contest-specific configuration including:

- Title.
- Public slug/identifier.
- Arabic content.
- French content.
- Hero/main visual.
- Participation instructions.
- Prize information.
- First and last day (whole days in Africa/Algiers time: from 00:00 on the first day to 23:59 on the last).
- Participation rules, including the entry limit per phone per draw period.
- Regulation document, including PDF where supplied.
- Winner publication content.
- Contest-specific visual assets.
- Social sharing metadata.
- Tracking/campaign metadata.

The current scope calls for a reusable contest template, not a generic no-code page builder.

## 6. Participation form

The proposal requires support for the following participant fields:

- Name.
- Phone number.
- Email.
- Wilaya.
- Ticket/proof-of-purchase photo.
- Consent fields.

Fields may be enabled or disabled per contest where this is part of the contest configuration.

### 6.1 Submission rules

A submission must:

- Reference an open contest.
- Pass server-side validation.
- Store the submitted participant/contact data.
- Store the proof-of-purchase reference.
- Record consent values.
- Record the submission timestamp.
- Record campaign/source attribution when available.
- Be accepted directly. There is no moderation status: an accepted submission is immediately part of the draw pool for its period.
- Be rejected at submission if it is a duplicate (see 8.1).

### 6.2 Abuse protection

Implementation should support practical protections appropriate to the launch, such as:

- Server-side validation.
- File type validation.
- File size limits.
- Basic request/rate protection.
- Duplicate checks.
- Optional anti-bot measures if abuse is observed.

Advanced fraud detection, OCR, receipt parsing, and AI-based ticket verification are not part of the sold scope.

## 7. Participant/contact model

A reusable contact base is one of the project's commercial goals.

The implementation should therefore distinguish between:

- **Contact / participant identity** — reusable person/contact information.
- **Participation** — one submission to one specific contest.
- **Consent** — historical evidence of a consent decision captured during a participation.

### 7.1 No overwrites

- Each Participation stores the name, phone, email and wilaya **exactly as submitted**. This snapshot is never modified and is the source of truth for the participation list, reports, draws and winners.
- A Contact is matched **only by normalized phone number**, never by name or email.
- A Contact is created the first time a normalized phone appears. Later participations link to it but **never update its fields**.
- Same name with a different phone creates a new Contact. Same phone with a different name (for example a shared family phone) links to the existing Contact; each participation keeps its own submitted name.
- The cross-contest contact base is the set of unique normalized phone numbers.
- Consent history is preserved through ConsentRecord entries.
- For each consent type, the **effective consent state** for a Contact is the most recent applicable ConsentRecord for that Contact.
- Marketing-oriented exports include a Contact only when its effective consent state for the required consent type is granted.
- Exported name, email and wilaya are taken from that Contact's latest Participation rather than copied onto Contact as mutable profile data.

### 7.2 Phone normalization

Algerian mobile numbers are normalized to `+213` followed by 9 digits starting with 5, 6 or 7. Accepted input forms include `05…`, `5…`, `00213…` and `+213…`.

A participant is not automatically an e-commerce customer account.

## 8. Ticket / proof-of-purchase handling

Each participation can include a proof-of-purchase image.

Requirements:

- Image upload from mobile devices. Mobile photo handling (formats, compression, metadata stripping) is defined during implementation.
- File metadata stored with the participation.
- Ticket image review from administration.
- Access restricted to authorized users.

### 8.1 Duplicate prevention

Duplicates are **prevented at submission**, not flagged for later review. A submission is refused with a clear message when:

- The same receipt image (exact file hash) was already submitted to the same contest.
- The same normalized phone exceeds the contest's entry limit for the current draw period. The limit (maximum entries per phone per draw period) is a contest setting, configured by the commercial team for each contest.

Perceptual image matching, OCR, and automated fraud scoring are explicitly deferred unless separately agreed.

## 9. Participation review (no moderation)

There is no moderation workflow: no `pending`, `approved` or `rejected` status, and no approval step.

The commercial team can:

- List and filter participations (contest, period, wilaya, source).
- Open a participation and see its submitted details.
- Inspect the ticket/proof, mainly to verify a drawn winner.
- Remove an ineligible participation by moving it to the trash (soft delete).

A participation in the trash is left out of participation lists, counts, reports, exports, marketing contacts, the per-phone entry limit and draw pools. Only an admin can restore it or delete it for good. Its receipt stays stored, so the same receipt still cannot enter the contest again. A permanent delete keeps the participant's consent records (detached from the deleted participation) as evidence of their consent decisions.

Participations are never edited. A participation already selected by a draw, voided or not, cannot be moved to the trash or deleted: a problem found on a drawn winner is handled by a re-draw (section 10.3).

## 10. Weekly draws

The proposal requires weekly random draws among valid participations for the relevant week.

### 10.1 Draw periods

- The draw period (weekly by default) and the draw day are **configurable per contest**.
- The draw pool is also **configurable per contest**: the participations of the draw's period (default), or every participation since the contest started. It cannot change once the contest has a draw.
- Each draw stores its own exact period start and end, so changing a contest's settings later never changes past draws.
- Period boundaries use the Africa/Algiers timezone.

### 10.2 Eligibility and execution

- Eligible: every participation of the contest whose submission time falls within the draw period, or, when the contest's draw pool covers the whole contest, from the contest start to the end of the draw period.
- A winner cannot win again: participations of a person (Contact) who already holds a winner that is not voided are excluded, as is every participation already selected, voided or not. A voided winner's other participations stay eligible.
- Each eligible participation is one chance, so a person with more participations has more chances; a single draw picks at most one participation per person.
- The draw is **operator-triggered** from the administration, not run automatically.
- Selection uses a cryptographically secure random number generator.

A draw should record:

- Contest.
- Period start and end, and where the pool starts (the period start or the contest start).
- Execution timestamp.
- User who executed it.
- Number of eligible participations.
- A hash of the ordered list of eligible participation IDs, so the pool can be proven unchanged afterwards.
- Selected participation(s).
- Algorithm/version metadata sufficient for auditing.

A completed draw is never rerun or overwritten.

### 10.3 Re-draw

If a drawn winner is invalid (for example an unreadable or non-qualifying ticket) or cannot be reached, the operator runs a re-draw:

- The original winner is marked void with a reason. The original draw record is kept unchanged.
- The re-draw is a new draw record linked to the draw it replaces and uses the original draw period and eligibility rules.
- Its replacement pool excludes **every Participation already selected as a Winner in the contest**, whether that earlier winner was confirmed, published, or voided, and every person holding a winner that is not voided (§10.2).
- The re-draw selects only the number of replacement winners required.

### 10.4 Public visibility

The draw method is not shown on the public pages. Draw records are internal audit data.

## 11. Winners

The public platform must support a winners section.

Published winner information must follow the presentation described in the proposal, including masked names where required.

Optional winner photo/video content may be added by Vanidel where available and legally cleared.

## 12. Contest archive

Past contests must remain publicly accessible as an archive.

Archived pages may contain:

- Contest content.
- Dates.
- Prizes.
- Published winners.
- Campaign result summary where appropriate.

The archive supports transparency, trust, SEO, and continuity between campaigns.

## 13. Campaign tracking and statistics

The `Croissance` offer includes tracked links, pixels, and per-contest reporting.

### 13.1 Attribution

The platform should capture campaign source where available, including channels such as:

- QR code on packaging.
- Posters.
- Facebook.
- Instagram.
- TikTok.
- Influencer links.
- Other tagged campaign links.

UTM-style parameters may be used as the normalized attribution mechanism.

### 13.2 External tracking

Support integration of:

- Meta Pixel.
- Google tracking / analytics tooling.

The client is responsible for supplying required access/accounts.

### 13.3 Internal reporting

Per-contest reporting should be able to summarize at least:

- Visits, where supplied by analytics integration.
- Participations.
- Participation source/channel.
- Wilaya distribution.
- Draws and re-draws.

The proposal promises a campaign report/result, not a custom enterprise BI platform.

## 14. Contact export

Vanidel must be able to export participants who have granted the relevant consent.

Exports should:

- Be limited to authorized users.
- Respect the stored consent state.
- Include only fields necessary for the intended business purpose.
- Avoid treating non-consented participants as marketing contacts.

## 15. Localization

The public contest experience must support:

- Arabic.
- French.

Requirements include:

- Localized contest content.
- Localized interface labels.
- RTL layout behavior for Arabic.
- Appropriate date/number formatting.
- Mobile usability in both languages.

Editorial localization and application-interface translations should be handled as separate concerns.

## 16. Mobile-first behavior

Because QR codes are a primary acquisition path, the public experience must be designed for mobile first.

Priority areas:

- Fast loading.
- Clear call to action.
- Mobile camera/file upload.
- Simple form interactions.
- Accessible prize and participation information.
- Share actions after participation only (WhatsApp, Instagram, copy link, and the device share sheet where available).
- An open contest's page scrolls to the participation form on arrival.

## 17. SEO and social sharing

Contest pages and archives should support:

- Server-rendered metadata.
- Search-engine-readable pages.
- Open Graph/social preview metadata.
- Contest-specific share image.
- Stable public URLs.

### 17.1 URL scheme

QR codes are printed on packaging and point to a **specific contest**, so the locale-independent contest entry URL must remain stable:

- `/concours/{slug}` — permanent QR/campaign entry point for a specific contest.
- On entry, the application detects or resolves the visitor's locale and serves/redirects to the appropriate localized contest page.
- `/{fr|ar}/concours/{slug}` — localized contest page.
- `/{fr|ar}/concours/archives` — localized archive of past contests.
- Winners are shown on the contest page, below the participation form in a collapsible block, and in the archive.

The QR code must use `/concours/{slug}`, not a locale-prefixed URL, so the same printed code can serve both Arabic and French visitors.

The site root is reserved for the future corporate site. Until then, `/` redirects to the contest section.

## 18. Access control

Initial roles may be kept intentionally simple.

### `admin`

- Full access.
- User management.
- Technical configuration.
- All contest operations.
- Restore participations from the trash, or delete them for good.

### `commercial`

- Manage contests.
- Manage campaign content.
- Review participations and tickets, and move ineligible participations to the trash.
- Run draws and re-draws.
- Publish winners.
- Export consented contacts.
- View statistics.

A custom RBAC builder is not part of Phase 1.

## 19. Data privacy and retention

The platform collects personal data and uploaded proof-of-purchase images.

The system should support:

- Explicit consent capture.
- Historical consent evidence.
- Restricted access to ticket images.
- Retention/deletion processes.
- Authorized exports.
- Backup protection.

The accepted proposal states that Vanidel is responsible for obtaining legal validation of the applicable data retention period under Algerian Law 18-07.

The technical implementation must therefore **support a configurable retention policy**, but this specification does not define the legally required duration.

## 20. Future phases

### 20.1 Corporate site — not currently included

Potential future content includes:

- Brand presentation.
- Product ranges.
- Recipes.
- Points of sale.
- News/content.
- Contest section.

### 20.2 E-commerce — not currently included

Potential future scope includes:

- Product packs.
- Catalog.
- Customer accounts.
- Cart.
- Orders.
- Checkout/payment behavior.
- Fulfillment/inventory depending on future requirements.

No commerce implementation should be introduced in Phase 1 solely because e-commerce is on the roadmap.

## 21. Explicitly out of current scope

Unless separately agreed:

- Corporate website.
- E-commerce website.
- Customer commerce accounts.
- Cart/checkout.
- Payment providers.
- Inventory/warehouse system.
- Email marketing automation.
- SMS marketing.
- SMTP/SMS provider fees.
- OCR.
- Automated receipt recognition.
- AI fraud detection.
- Generic form builder.
- Generic workflow engine.
- Custom enterprise analytics/BI.
- Native mobile application.
- Microservices architecture.

## 22. Open decisions / clarifications

Before or during implementation, confirm:

- Exact first-contest start/end dates and weekly draw schedule.
- Number of winners per draw.
- Whether a participant can win more than once.
- Whether phone or email is mandatory for the first contest.
- Default draw period and draw day for the first contest.
- Final consent wording and consent categories.
- Retention duration once validated by Vanidel's legal adviser.
- Final analytics accounts/pixel identifiers.
- Final regulation PDF and campaign visuals.

## 23. Acceptance baseline

Phase 1 should be considered functionally complete when:

- The first contest can run end-to-end.
- Future contests can be created without code changes.
- Participants can submit from mobile in Arabic or French.
- Tickets can be reviewed securely.
- Duplicate submissions are prevented.
- Draws and re-draws can be executed and audited.
- Winners can be published.
- Past contests remain archived.
- Consented contacts can be exported.
- Campaign attribution/statistics can be reviewed.
- Vanidel's commercial team can operate the workflow without developer intervention for routine contest setup.

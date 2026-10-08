# Vanidel — Domain Model

## 1. Design principle

The platform uses Payload CMS, but not every record should be treated conceptually as editorial CMS content.

The system contains three categories:

1. **Editorial/configuration content**
2. **Transactional/business data**
3. **Audience/contact data**

Payload may persist and administer all three, while application services enforce business behavior.

## 2. Domain boundaries

```text
Contest Domain
  Contest
  Prize
  Participation
  TicketProof
  Draw
  Winner

Audience Domain
  Contact
  ConsentRecord

Content Domain
  Media
  future Pages
  future Recipes
  future ProductRanges
  future News

Analytics Domain
  CampaignSource / attribution
  aggregated reporting

Future Commerce Domain
  Product / Catalog
  Customer
  Cart
  Order
  Payment
```

Future commerce entities are architectural placeholders only; they are **not implemented in Phase 1**.

## 3. Core entities

### 3.1 Contest

**Category:** Editorial/configuration + business configuration

Represents one contest campaign.

Suggested attributes:

- `id`
- `slug`
- `status`
- `startAt`
- `endAt`
- localized `title`
- localized `description`
- localized `participationInstructions`
- `heroMedia`
- `shareMedia`
- `regulationMedia`
- `formConfiguration`
- `drawConfiguration` (period length, draw day, winners per draw)
- `entryLimitPerPhone` (per draw period)
- `consentConfiguration`
- `trackingConfiguration`
- timestamps

Relationships:

```text
Contest
  ├── Prize*
  ├── Participation*
  ├── Draw*
  └── Winner*
```

### 3.2 Prize

**Category:** Editorial/configuration

Represents a prize or prize description attached to a contest.

Suggested attributes:

- `contest`
- localized `title`
- localized `description`
- `media`
- optional `quantity/order`

### 3.3 Contact

**Category:** Audience identity

Represents reusable person/contact information across contests.

Suggested attributes:

- `id`
- `phoneNormalized` (unique, the only matching key)
- `name`, `emailNormalized`, `wilaya` as first submitted
- timestamps

A Contact is created the first time a normalized phone appears. Later participations link to it but **never update it**. Matching never uses name or email.

A Contact is **not** automatically an authenticated user or future e-commerce customer account.

### 3.4 Participation

**Category:** Transactional/business data

Represents one submission by a Contact to one Contest.

Suggested attributes:

- `id`
- `contest`
- `contact`
- `submittedAt`
- submitted snapshot: `name`, `phone`, `phoneNormalized`, `email`, `wilaya`
- `ticketProof`
- `source`
- `utmSource`
- `utmMedium`
- `utmCampaign`
- `utmContent`

There is no moderation status. A Participation is valid on creation and immutable afterwards; the submitted snapshot is the source of truth for lists, reports, draws and winners.

### 3.5 TicketProof

**Category:** Transactional/private media

Represents the proof-of-purchase uploaded with a participation.

Suggested attributes:

- `file`
- `mimeType`
- `fileSize`
- `hash`
- `uploadedAt`

`hash` is unique per contest and is used to refuse duplicate receipts at submission.

TicketProof files are private by default.

### 3.6 ConsentRecord

**Category:** Audience/compliance data

Records the consent state at a point in time.

Suggested attributes:

- `contact`
- `participation`
- `type`
- `granted`
- `textVersion`
- `capturedAt`
- `source`

Consent is historical rather than stored as one mutable boolean on Contact.

For each `Contact` and consent `type`, the **effective consent state** is the most recent applicable `ConsentRecord`. Marketing exports may include the Contact only when that effective state is granted.

### 3.7 Draw

**Category:** Transactional/business data

Represents one weekly draw operation.

Suggested attributes:

- `contest`
- `periodStart`
- `periodEnd` (exact values stored on the draw, Africa/Algiers time)
- `status`
- `eligibleCount`
- `poolHash` (hash of the ordered list of eligible participation IDs)
- `executedAt`
- `executedBy`
- `algorithmVersion`
- `randomnessMetadata`
- `redrawOf` (optional link to the draw this one replaces)

A completed Draw is immutable.

### 3.8 Winner

**Category:** Transactional result + public editorial projection

Represents a selected participation from a Draw.

Suggested attributes:

- `draw`
- `participation`
- `rank`
- `selectedAt`
- `publicDisplayName`
- optional `publicMedia`
- `published`
- `voided`, `voidReason`, `voidedBy`, `voidedAt` (set when the winner is invalid or unreachable, before a re-draw)

The selected result and the public presentation should remain conceptually distinct.

### 3.9 CampaignSource

**Category:** Analytics/configuration

Optional normalized representation of known campaign sources.

Examples:

- QR packaging
- poster
- Facebook
- Instagram
- TikTok
- influencer

Initial attribution may rely primarily on UTM parameters rather than requiring this as a first-class entity.

## 4. Key relationships

```text
Contact
  ├── Participation*
  └── ConsentRecord*

Contest
  ├── Prize*
  ├── Participation*
  └── Draw*

Participation
  ├── Contact
  ├── Contest
  ├── TicketProof
  └── ConsentRecord*

Draw
  ├── Winner*
  └── redrawOf → Draw (optional)

Winner
  └── Participation
```

## 5. CMS vs application data

### CMS/editorial

Managed primarily through normal Payload editing forms:

- Contest public content.
- Prize content.
- Regulations.
- Public media.
- Winner publication content.
- Future corporate content.

### Application/business

Managed through domain actions and constrained admin workflows:

- Participation submission.
- Duplicate prevention.
- Draw execution and re-draws.
- Consent recording.
- Export authorization.

These may still be Payload collections, but generic CRUD must not bypass domain rules.

## 6. Important invariants

Application services should enforce rules such as:

- A participation may only be submitted to an open contest.
- A duplicate receipt (same hash in the contest) or a phone over its entry limit for the period is refused at submission.
- A Participation and its submitted snapshot are never modified after creation.
- A Contact is never updated by a later participation.
- A re-draw uses the original draw's eligibility pool but excludes every Participation already selected as a Winner anywhere in the same draw/re-draw chain.
- A completed draw must not be overwritten; a re-draw is a new Draw.
- TicketProof files are not public assets.
- Marketing exports require the relevant **effective** consent state to be granted, resolved from the most recent applicable ConsentRecord for the Contact.
- A public winner must originate from a persisted draw result.
- Future commerce customer identity must not be assumed from contest participation alone.

## 7. Future evolution

### Corporate

New editorial collections may be added without changing the contest model materially:

- Pages
- ProductRanges
- Recipes
- Stores
- News

### Commerce

Commerce should remain its own bounded domain.

At Phase 3, decide whether it belongs:

- inside Payload using its commerce capabilities/custom domain code, or
- in a dedicated commerce system integrated with the shared frontend/audience layer.

This decision is deliberately deferred.

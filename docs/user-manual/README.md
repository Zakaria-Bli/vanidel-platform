# Vanidel Platform — User Manual & Operational Guide

Welcome to the official User Manual for the **Vanidel Contest Platform** (_Plateforme de Concours et Tombolas Vanidel_). This documentation provides practical, step-by-step guidance for both public participants and internal business teams (Commercial and Administrators), accompanied by real interface walkthroughs and screenshots.

---

## Manual Structure & Table of Contents

```text
docs/user-manual/
├── README.md                              # This index and roadmap
├── introduction.md                       # Platform overview, purpose, and architecture
├── getting-started.md                    # Access, authentication, and interface setup
├── navigation.md                         # Layout, admin sidebar, and quick actions
├── participant/
│   ├── browse-contests.md                # Browsing contests, language switching (FR/AR)
│   ├── submit-entry.md                   # Step-by-step participation, receipt upload, sharing
│   ├── view-winners.md                   # Winner visibility, draw accordions, past archives
│   └── privacy-and-regulations.md        # Rules PDF, data protection (Law 18-07), legal terms
├── admin/
│   ├── dashboard.md                      # Live monitoring, action items ("À faire"), stats
│   ├── create-contest.md                 # Creating contests, tabs configuration, duplicate tool
│   ├── content-and-translations.md       # Bilingual editing, rich text, pre-publish checklist
│   ├── preview-and-publish.md            # Preview mode, publishing, lifecycle status
│   ├── campaign-links.md                 # Tracking links, channel attribution, PNG/SVG QR codes
│   ├── participations.md                 # Reviewing entries, search, filtering, receipt audit
│   ├── draws.md                          # Draw periods, cryptographic randomness, execution
│   ├── winners.md                        # Verification, contact, publishing, voiding & re-draw
│   └── reporting-and-exports.md          # Contest report CSV, audience marketing contact export
├── roles-and-permissions.md              # Role capability matrix (Public, Commercial, Admin)
├── troubleshooting.md                    # Error messages, duplicate prevention, recovery steps
└── glossary.md                           # Key terminology, Algerian wilayas, domain definitions
```

---

## Core Sections Overview

### 1. Fundamentals

- **[Introduction](introduction.md)**: Background on Vanidel's reusable contest platform, core business objectives, key capabilities, and system components.
- **[Getting Started](getting-started.md)**: Entry points, credentials, initial login, account settings, and locale options (French, Arabic, English).
- **[Navigation & Interface Tour](navigation.md)**: Overview of public interface design and the administrative control room.

### 2. Public Participant Experience

- **[Browsing Contests](participant/browse-contests.md)**: How participants discover ongoing campaigns, switch between French and Arabic RTL layouts, and view campaign dates.
- **[Submitting an Entry](participant/submit-entry.md)**: Detailed walkthrough of filling the participation form, Algerian phone validation, receipt photo upload, consent handling, confirmation feedback, and social sharing.
- **[Viewing Winners & Archives](participant/view-winners.md)**: How public winners are revealed with masked names and how archived contests are accessed.
- **[Privacy & Regulations](participant/privacy-and-regulations.md)**: How official rules PDFs are accessed and compliance with Algerian personal data protection laws (Law 18-07 as amended by Law 25-11).

### 3. Commercial & Administrative Operations

- **[Operational Dashboard](admin/dashboard.md)**: Real-time campaign tracking, daily participation counts, unique entrants, and pending tasks.
- **[Contest Creation & Configuration](admin/create-contest.md)**: Setting up campaigns, prize pools, participation limits, and draw schedules.
- **[Content & Translations](admin/content-and-translations.md)**: Managing bilingual French/Arabic texts, steps, legal consent versions, and the pre-publication checklist.
- **[Preview & Publishing](admin/preview-and-publish.md)**: Private staff preview banner, live verification, and transitioning through draft, scheduled, published, and archived states.
- **[Campaign Links & QR Codes](admin/campaign-links.md)**: Generating UTM tracking URLs and downloading high-resolution PNG and vector SVG QR codes for print packaging and social influencers.
- **[Participations Management](admin/participations.md)**: Auditing submissions, reviewing receipts in full resolution, immutable record guarantees, and CSV data exports.
- **[Executing Draws](admin/draws.md)**: Scheduled draw periods, secure random selection, pool hashing, and audit trails.
- **[Winner Management & Re-Draws](admin/winners.md)**: Ticket verification, publishing winners, voiding invalid entries with documented motifs, and executing automated re-draws.
- **[Reporting & Audience Exports](admin/reporting-and-exports.md)**: Downloading comprehensive contest analytics reports and exporting marketing-consented contacts.

### 4. Governance & Support

- **[Roles & Permissions](roles-and-permissions.md)**: Access control matrix comparing Public Visitors, Commercial Operators, and Technical Administrators.
- **[Troubleshooting & Known Issues](troubleshooting.md)**: Solutions for common validation errors, duplicate receipt rejections, and technical recovery workflows.
- **[Glossary & Domain Reference](glossary.md)**: Explanations of domain concepts, Algerian wilaya codes, and cryptographic hashing terminology.

---

## Related Documents

- **Functional Audit Report**: [`docs/audit-report.md`](../audit-report.md) — Exhaustive findings, reproducible bugs, usability observations, and technical recommendations.
- **Test Coverage Matrix**: [`docs/test-coverage.md`](../test-coverage.md) — Comprehensive verification matrix detailing tested workflows, scenarios, and results.
- **Commercial Quick Guide (French)**: [`docs/operations/GUIDE_EQUIPE_COMMERCIALE.md`](../operations/GUIDE_EQUIPE_COMMERCIALE.md) — Handover summary for Vanidel's commercial team.
- **Product Functional Specification**: [`docs/product/SPECIFICATION.md`](../product/SPECIFICATION.md) — Definitive product requirements and business logic rules.

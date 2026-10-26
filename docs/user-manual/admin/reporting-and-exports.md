# 5.9 Admin Operations: Reporting & Audience Exports

The Vanidel platform provides comprehensive analytics to measure campaign return on investment (ROI) and build reusable marketing audiences.

---

## 5.9.1 Contest Analytics Report

Inside any contest editor (`/admin/collections/contests/:id`), click the **Rapport** (_Report_) tab:

![Contest Analytics Report Tab](../assets/contests/admin-contest-report.png)
_Figure 5.27: The contest report tab showing breakdown by channel, wilaya, and draw status._

### Information Displayed in the Report

1. **Top Metric Cards**:
   - **Participations**: Total volume of entries received.
   - **Numéros uniques**: Distinct Algerian mobile numbers entered.
   - **Contacts opt-in**: Participants who granted voluntary marketing consent.
   - **Gagnants**: Total confirmed winners drawn.
2. **Breakdown by Marketing Channel (**Répartition par canal**)**:
   - Evaluates performance across packaging QR codes, in-store posters, social ads, and individual influencer links.
   - Displays links even if they have generated 0 entries to gauge underperforming campaigns.
3. **Breakdown by Wilaya (**Répartition par wilaya**)**:
   - Geographic distribution of participations across Algeria.
4. **Draw Summary**:
   - Number of draws executed, re-draws performed, winners published, and winners voided.

### Downloading the Contest Report (CSV)

Click **Télécharger le rapport (CSV)** or navigate to `/api/contests/:id/report?format=csv` to download a structured spreadsheet ready for Excel or Google Sheets.

---

## 5.9.2 Exporting Consented Marketing Contacts

One of Vanidel's primary strategic goals is building an audience for future product launches and tombola campaigns.

Navigate to **Participations › Contacts** (`/admin/collections/contacts`):

![Contacts Collection Table](../assets/exports/admin-contacts-list.png)
_Figure 5.28: The master audience contacts table with normalized telephone identities._

### Exporting Consented Contacts

Above the table, click **Exporter les contacts marketing (CSV)**:

1. Select a specific contest or choose **Tous les contacts / All contacts**.
2. Click the export button.
3. The platform processes all audience records and downloads `marketing-contacts-{contest}-{date}.csv`.

### Strict Consent Filtering Mechanism

> [!IMPORTANT]
> The marketing export adheres strictly to Algerian Law 18-07/25-11. It exports **only** contacts whose latest recorded marketing consent state is **granted** (`granted = true`).

- If an entrant previously opted in but later unchecks the marketing box on a subsequent entry, their latest state is `false` and they are automatically excluded.
- The exported CSV includes:
  - `phone`: Clean E.164 normalized phone number (e.g. `+213555123456`).
  - `name`: Participant's name.
  - `email`: Email address (if provided).
  - `wilaya_code` & `wilaya`: Resident wilaya.
  - `last_participation_at`: Timestamp of most recent participation.
  - `consented_at`: Exact timestamp when marketing consent was captured.
  - `consent_text_version`: Cryptographic hash identifying the exact legal text accepted.

---

## 5.9.3 Reviewing the Consent Audit Trail

Navigate to **Participations › Consentements** (`/admin/collections/consent-records`):

![Consent Audit Trail](../assets/exports/admin-consent-records-list.png)
_Figure 5.29: The consent records audit table tracking regulatory agreements._

Every checkbox interaction creates an immutable `ConsentRecord`:

- **Contact**: Normalized phone link.
- **Type**: `Règlement`, `Traitement des données`, or `Marketing`.
- **Accordé**: Boolean (`vrai` / `faux`).
- **Date**: Exact capture timestamp.
- **Version**: Text hash proving what terms were presented to the consumer.

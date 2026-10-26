# 5.6 Admin Operations: Reviewing Participations

Vanidel treats participations as immutable, auditable proof of consumer engagement.

---

## 5.6.1 The Participations Audit Table

Navigate to **Participations › Participations** (`/admin/collections/participations`):

![Participations Collection Table](../assets/participations/admin-participations-list.png)
_Figure 5.17: The master participations audit table._

### Key Columns Displayed

- **Envoyée le**: Exact submission timestamp in Algiers time.
- **Ticket**: Direct link to the protected receipt photo.
- **Nom**: Entrant's full name.
- **Téléphone saisi**: Phone number as entered by the participant.
- **Wilaya**: Algerian administrative wilaya code and name (e.g. `16 - Alger`, `25 - Constantine`, `31 - Oran`).
- **Canal**: Marketing attribution channel (e.g. `poster`, `facebook`, or direct).
- **Concours**: Associated contest campaign.

---

## 5.6.2 Inspecting a Participation Record

Clicking on any submission opens its detailed inspection card:

![Participation Detail Card](../assets/participations/admin-participation-detail.png)
_Figure 5.18: Immutable participation inspection card._

### Absolute Immutability & Anti-Tampering Guarantee

> [!IMPORTANT]
> Every field in a participation record is strictly **disabled / read-only**. There is no manual moderation, approval, modification, or deletion permitted by staff.

- Submissions enter the draw pool immediately upon receipt.
- Verification occurs only _after_ a winner has been randomly drawn. If a winning ticket is found to be invalid, the operator cancels the winner via the documented Re-draw protocol, preserving the integrity of the original submission log.

### Inspecting Receipt Photos

- Click the receipt link (`/api/tickets/file/...`) to inspect the photo at full resolution.
- Verify that the receipt shows:
  1. A qualifying Vanidel product purchase (_Gamme Mix_, _Gamme Crème_, or _Gamme Flan_).
  2. A purchase date falling within the active campaign period.
  3. Legible store/superette name and transaction receipt number.

---

## 5.6.3 Exporting Participations to CSV

Above the participations table, the **Export Bar** allows staff to download submissions for accounting or logistics:

1. Select a specific **Concours** or leave on _"Tous"_.
2. (Optional) Define a **Du** (_From_) and **Au** (_To_) date range in `YYYY-MM-DD` format.
3. Click **Exporter les participations (CSV)**.
4. The browser downloads a clean CSV file (`participations-{contest}-{date}.csv`) containing normalized phone numbers, submission timestamps, wilaya codes, channel parameters, and receipt filenames.

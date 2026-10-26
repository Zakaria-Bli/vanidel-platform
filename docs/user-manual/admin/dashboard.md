# 5.1 Admin Operations: Dashboard & Monitoring

The Vanidel administrative control room is designed to provide immediate operational situational awareness for marketing and commercial teams.

---

## 5.1.1 Dashboard Architecture

The dashboard at `/admin` is organized around the lifecycle of running campaigns:

![Live Contest Dashboard](../assets/admin/dashboard-commercial.png)
_Figure 5.1: The commercial dashboard displaying live metrics, quick actions, and collection links._

---

## 5.1.2 Real-Time Metrics & Performance Tracking

For every live contest, the **En direct** (_Live_) section provides three key performance indicators:

1. **Total Participations**: The cumulative volume of submissions captured across all periods.
2. **Aujourd'hui**: The number of submissions recorded since midnight (00:00 Algiers time) on the current calendar day.
3. **Numéros uniques**: The count of distinct Algerian mobile numbers that have entered the contest, representing distinct individual participants.

After running weekly draws and processing entries, the dashboard reflects updated campaign activity:

![Updated Dashboard Metrics](../assets/admin/dashboard-with-draw-completed.png)
_Figure 5.2: The operational dashboard updated after executing draws and registering new campaign link entries._

---

## 5.1.3 The Actionable Todo List (_À faire_)

When operational tasks require attention, the dashboard automatically generates an alert list:

- **Tirages à lancer**: Lists any completed draw periods that have not yet had a draw executed. Clicking the item jumps straight to the draw launcher.
- **Gagnants à publier**: Highlights drawn winners awaiting verification or publication.
- **Brouillons incomplets**: Identifies contest drafts that have missing required elements according to the pre-publication checklist.

---

## 5.1.4 Quick Action Workflows

Located on the right side of the dashboard, **Actions rapides** enables staff to initiate high-priority workflows with a single click:

- **Nouveau concours** (`/admin/collections/contests/create`): Initiates the contest builder.
- **Lien de campagne** (`/admin/collections/campaign-links/create`): Opens the tracking link and QR generator.
- **Exporter les participations** (`/admin/collections/participations`): Directly opens the participations auditing view.
- **Médias** (`/admin/collections/media`): Navigates to the campaign visual assets library.

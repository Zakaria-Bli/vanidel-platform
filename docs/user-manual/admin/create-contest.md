# 5.2 Admin Operations: Creating & Configuring Contests

Vanidel's commercial team can create future promotional campaigns through a structured, multi-tabbed interface without technical assistance or code deployment.

---

## 5.2.1 Creating a New Contest

1. In the sidebar, navigate to **Concours › Concours** (`/admin/collections/contests`).
2. Click the top button **Créer un nouveau Concours** (`/admin/collections/contests/create`).
3. The blank contest form opens:

![Blank Contest Creation Form](../assets/contests/create-contest-01-initial.png)
_Figure 5.3: Initial blank contest creation interface showing tabs and pre-publication reminder._

---

## 5.2.2 Fast-Track: Duplicating an Existing Contest

The recommended and most efficient way to start a new campaign is by **duplicating** an existing contest:

1. Open an existing contest (e.g. `/admin/collections/contests/1`).
2. Click the three-dots action menu button (**⋮**) located next to the **Sauvegarder** button in the header:

![Contest Actions Menu](../assets/contests/contest-edit-dots-menu.png)
_Figure 5.4: Action menu displaying document management options._

3. Select **Dupliquer** (_Duplicate_):

![Selecting Duplicate](../assets/contests/contest-duplicate-menu.png)
_Figure 5.5: Selecting the "Dupliquer" action from the dropdown menu._

4. A new draft is instantly created (e.g. at `/admin/collections/contests/2`):
   - The status is set to **Brouillon** (_Draft_).
   - The URL slug is automatically renamed with the suffix `-copie` (e.g., `gamme-mix-2026-copie`).
   - All bilingual French and Arabic texts, participation steps, prizes, draw parameters, and consent configurations are preserved.

![Duplicated Contest Draft](../assets/contests/contest-duplicated-draft.png)
_Figure 5.6: The newly cloned draft ready for scheduling and text updates._

---

## 5.2.3 The Four Configuration Tabs

The contest editor is partitioned into four functional tabs:

### 1. Tab "Contenu" (_Content_)

Manages the visual storytelling, prizes, and instructions:

- **Titre** (_Title_): Public title in the current locale.
- **Description**: Promotional overview rendered using the Lexical rich-text editor.
- **Comment participer (étapes)** (_Steps_): Reorderable, numbered instructions guiding the participant.
- **Visuel principal** (_Main Visual_): 16:9 banner image displayed at the top of the contest page.
- **Règlement (PDF)**: Official contest regulation document in PDF format.
- **Lots** (_Prizes_): Prize title, description, quantity, and promotional packshot image.

![Contest Edit - Content Tab](../assets/contests/admin-contest-edit-content.png)
_Figure 5.7: The Content tab configuring campaign texts, visual assets, and prize lists._

---

### 2. Tab "Participation" (_Form Rules_)

Controls eligibility constraints and required fields:

- **E-mail**: Configure as `non demandé` (_Not asked_), `facultatif` (_Optional_), or `obligatoire` (_Mandatory_).
- **Wilaya obligatoire**: Toggle whether the participant must select their wilaya.
- **Participations max. par téléphone et par période**: Limits how many times an entrant can participate within a single draw period (typically `1`).
- **Consentements** (_Consents Array_):
  - Regulation consent (required).
  - Data processing consent under Law 18-07/25-11 (required).
  - Marketing offers consent (optional).
  - Version identifier string to track legal changes.

![Contest Edit - Participation Tab](../assets/contests/admin-contest-edit-participation.png)
_Figure 5.8: The Participation tab defining entry limits, email rules, and legal consent checkboxes._

---

### 3. Tab "Tirages" (_Draws Schedule_)

Configures the mechanical rules governing weekly winner draws:

- **Durée d’une période (jours)**: Frequency of draws (e.g., `7` for weekly draws, `1` for daily campaigns).
- **Premier jour de la période**: The calendar day when periods start (e.g., `Dimanche` / _Sunday_ or contest start day).
- **Gagnants par tirage**: How many winners are chosen in each draw (e.g., `1`).
- **Périmètre du tirage** (_Pool Scope_):
  - `Période seule` (_Period only_): Draw picks only among entries submitted within the specific period.
  - `Depuis le début` (_Since contest start_): Draw picks from all cumulative eligible submissions since campaign launch.

![Contest Edit - Draws Tab](../assets/contests/admin-contest-edit-draws.png)
_Figure 5.9: The Draws tab defining period duration and pool scope._

> [!WARNING]
> Never modify the draw settings once the contest has started and the first draw has been executed.

---

### 4. Tab "Partage et SEO" (_Sharing & Social Preview_)

Configures search engine and social media link previews:

- **Titre SEO** and **Description SEO**: What appears when sharing the link on Google, WhatsApp, Facebook, or Instagram.
- **Image de partage (1200×630)**: Social share card visual formatted for social network link crawlers.

![Contest Edit - Sharing & SEO Tab](../assets/contests/admin-contest-edit-seo.png)
_Figure 5.10: The Sharing and SEO tab configuring social network preview cards._

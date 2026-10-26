# 5.3 Admin Operations: Content, Bilingual Editing & Pre-Publish Checklist

Every contest on the Vanidel platform is natively bilingual, supporting independent French and Arabic content trees.

---

## 5.3.1 Managing French & Arabic Content

To ensure the public portal offers full French and Arabic experiences, contest content must be saved in both locales.

### Switching Editing Locales

1. In the top navigation bar, locate the **Paramètres régionaux** dropdown button.
2. Select **Français** to enter French texts.
3. Edit the Title, Description, Steps, and Prizes.
4. Click **Sauvegarder** to persist the French localization.
5. In the locale switcher, select **العربية (ar)**.
6. Enter the corresponding Arabic translations for Title, Description, Steps, and Prizes.
7. Click **Sauvegarder** to persist the Arabic localization.

> [!TIP]
> Array items (such as Steps, Prizes, and Consent checkboxes) maintain consistent database IDs across locales. When editing Arabic, the texts map directly to the corresponding rows created in French.

---

## 5.3.2 French & Arabic Typographic Best Practices

- **Non-Breaking Spaces (Espaces insécables)**: In French, insert a non-breaking space before punctuation marks (`:`, `!`, `?`) and within monetary amounts (`10 000 DA`). This prevents currency symbols or punctuation marks from breaking onto new lines.
  - On macOS: Press `Option + Space`.
  - On Windows: Press `Alt + 0160`.
- **Arabic Terminology**: Ensure product names and prizes use official brand Arabic titles (e.g. `تشكيلة Mix`, `قسيمة شراء بقيمة 10 000 دج`).

---

## 5.3.3 The Pre-Publication Checklist (_Avant de publier_)

Located in the top right sidebar of the contest editor, the **Avant de publier** checklist automatically evaluates campaign readiness:

![Pre-Publication Checklist](../assets/contests/admin-contest-edit-content.png)
_Figure 5.11: The "Avant de publier" dynamic validation checklist._

### Checklist Verification Rules

The checklist updates automatically on each save:

| Item                                          | Status | Impact on Publication | Description                                                                      |
| :-------------------------------------------- | :----: | :-------------------- | :------------------------------------------------------------------------------- |
| **Textes en français et en arabe**            | ✓ / ✗  | **Mandatory blocker** | Title, description, and steps must be filled in both French and Arabic.          |
| **Au moins une étape « Comment participer »** | ✓ / ✗  | **Mandatory blocker** | At least one sequential participation step must exist.                           |
| **Consentements règlement et données**        | ✓ / ✗  | **Mandatory blocker** | Regulations and Data Processing consent rows must exist and be set to mandatory. |
| **Dates de début et de fin à venir**          | ✓ / ✗  | **Mandatory blocker** | Start date and End date must be defined and logically ordered.                   |
| **Visuel principal**                          | ✓ / ✗  | **Mandatory blocker** | A hero banner visual must be attached.                                           |
| **Règlement PDF dans chaque langue**          |   !    | Recommended           | A bailiff regulation PDF should be uploaded in French and Arabic.                |
| **Au moins un lot**                           | ✓ / ✗  | **Mandatory blocker** | At least one prize must be configured.                                           |
| **Image de partage**                          | ✓ / ✗  | Recommended           | 1200×630 share card visual (falls back to hero if missing).                      |
| **Description SEO dans chaque langue**        | ✓ / ✗  | Recommended           | Search engine snippet description.                                               |

> [!IMPORTANT]
> If any mandatory requirement (marked with ✗) is unmet, the platform refuses to transition the contest status to **Publié** (_Published_).

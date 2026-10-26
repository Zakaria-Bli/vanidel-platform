# 5.7 Admin Operations: Executing Weekly Draws

Draws on the Vanidel platform are intentionally **operator-triggered**, auditable, and backed by cryptographically secure random selection algorithms.

---

## 5.7.1 Draw Period Rules & Prerequisites

To maintain strict regulatory compliance with Algerian contest rules:

1. **Completed Periods Only**: A draw can only be triggered once its period has completely elapsed. Ongoing periods cannot be drawn prematurely.
2. **One Draw per Period**: Each period can only be drawn once. The platform permanently locks drawn periods against re-execution.
3. **Eligible Pool Calculation**:
   - The pool consists of all participations submitted during the period (or since contest start if `poolScope` is `sinceStart`).
   - Any participant who has already won an active prize in the contest is automatically excluded (a participant can only win once).
   - Voided winners remain excluded from winning again with their winning ticket, though their other distinct tickets remain eligible.

---

## 5.7.2 Executing a Draw

1. In the sidebar, navigate to **Concours › Tirages** (`/admin/collections/draws`):

![Draws Directory](../assets/draws/admin-draws-list.png)
_Figure 5.19: The draws directory showing completed draws._

2. In the top notification box **Lancer un tirage**, locate the **Période** dropdown:
   - If no periods have ended yet, the box displays _"Aucune période terminée pour le moment"_.
   - When a period concludes, it appears in the dropdown (e.g. _"Concours Gamme Mix : tentez votre chance ! · Période 1 (18/10 – 24/10)"_):

![Eligible Period Dropdown](../assets/draws/admin-draws-eligible-period.png)
_Figure 5.20: An ended draw period ready for selection._

3. Select the eligible period:

![Selected Period Ready to Draw](../assets/draws/draw-select-period.png)
_Figure 5.21: Period selected, enabling the "Lancer le tirage" execution button._

4. Click **Lancer le tirage** (_Execute Draw_).
5. A confirmation dialog appears:
   ```text
   Lancer le tirage de cette période ? Il ne pourra pas être refait.
   ```
6. Click **OK** (_Accept_).

---

## 5.7.3 Cryptographic Audit Trail

Upon confirmation:

- The server acquires a PostgreSQL transaction lock.
- It calculates an immutable SHA-256 pool hash (`poolHash`) covering all ordered eligible entry IDs.
- Secure random selection picks the configured number of winners using `crypto.randomInt`.
- A persistent `Draw` record is written with:
  - `poolHash`
  - `eligibleCount`
  - `algorithmVersion`
  - `executedBy` (the staff member ID)
  - `executedAt` timestamp
- Winning `Winner` records are generated with automatically masked public names.
- The interface automatically redirects directly to the resulting winners list:

![Redirected Winners List](../assets/draws/draw-winners-list.png)
_Figure 5.22: Automated redirect to the winners table filtered by the completed draw._

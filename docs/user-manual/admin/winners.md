# 5.8 Admin Operations: Managing Winners, Verification & Re-Draws

Winning entries must be rigorously audited before prize distribution. When a ticket is invalid or a winner cannot be reached, the platform provides an automated replacement draw protocol (_Re-draw_).

---

## 5.8.1 Winner Verification Workflow

1. In the sidebar, navigate to **Concours › Gagnants** (`/admin/collections/winners`).
2. Open the newly drawn winner record:

![Winner Inspection View](../assets/draws/winner-detail-view.png)
_Figure 5.23: The winner inspection card displaying the participant's full contact details and receipt image._

3. Review the **Vérification** section:
   - **Nom**: Entrant's full legal name (e.g. `Youcef Mansouri`).
   - **Téléphone**: Contact phone number (e.g. `0770112233`).
   - **Wilaya**: Resident wilaya.
   - **Ticket de caisse**: Click the image thumbnail or **Ouvrir en taille réelle** to inspect the receipt in high definition.
4. Contact the winner by telephone to notify them of their prize and confirm identity.

---

## 5.8.2 Publishing & Holding Back Winners

By default, drawn winners are set to **Publié** (_Published = true_) and appear on the public contest page under their masked name (e.g., `Youcef M.`).

- **To Hold Back a Winner While Verifying**:
  - In the **Publication** block, uncheck **Publié**.
  - Click **Sauvegarder**.
  - The winner will not appear on the public page until verified and re-checked.
- **Adding Testimonial Media**:
  - If the winner agrees in writing to participate in a photo or video handover, upload the asset in **Photo ou vidéo** (MP4/WebM video under 10 MB or PNG/JPEG image).

---

## 5.8.3 Voiding a Winner & Executing a Re-Draw

If the ticket photo is illegible, does not show a Vanidel product, or the winner is unreachable after mandatory notification attempts:

1. Scroll down to the **Annulation** (_Cancellation_) block in the winner card.
2. In the **Motif de l’annulation** field, enter the detailed reason (e.g., _"Ticket non conforme : pas de produit Vanidel"_ or _"Injoignable après 3 appels"_).
   > [!IMPORTANT]
   > Providing a cancellation reason is mandatory. The re-draw cannot be executed without documenting the audit motive.

![Entering Cancellation Reason](../assets/draws/winner-detail-view.png)
_Figure 5.24: The cancellation section requiring a documented motif._

3. Click **Annuler et retirer au sort** (_Cancel and redraw_).
4. A browser confirmation dialog appears:
   ```text
   Annuler ce gagnant et tirer un remplaçant ? Cette action est définitive.
   ```
5. Click **OK** (_Accept_).

---

## 5.8.4 What Happens During a Re-Draw?

The platform executes the re-draw transactionally:

1. **Original Winner Voided**:
   - The initial winner record is marked `Annulé: vrai`.
   - `Publié` is automatically unchecked (`faux`), removing them from the public site.
   - The cancellation reason, timestamp, and canceling operator ID are recorded permanently.
   - The original draw record remains completely untouched for historical auditing.

![Voided Winner Record](../assets/draws/voided-winner-record.png)
_Figure 5.25: Audit trail of the voided winner showing recorded motif and timestamp._

2. **Replacement Selected**:
   - A new draw record (`Draw #2`) is created and linked to the original draw as a `redrawOf`.
   - The pool consists of all original eligible entries minus anyone who has already won and minus the voided submission.
   - The platform picks the replacement winner (e.g., `Fatima Z.`) and opens their record immediately:

![Replacement Winner Card](../assets/draws/redraw-replacement-winner.png)
_Figure 5.26: Replacement winner record generated from the re-draw._

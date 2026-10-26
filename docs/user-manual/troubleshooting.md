# 7. Troubleshooting & Known Issues

This section provides actionable solutions for common issues, operational error messages, and verified recovery procedures.

---

## 7.1 Participant Submission Issues

### Issue 1: "Indiquez un numéro de mobile algérien valide (05, 06 ou 07)."

- **Cause**: The phone number entered does not match an active Algerian mobile prefix, or contains invalid characters/country codes.
- **Solution**: Instruct the participant to enter a standard 10-digit mobile number starting with `05` (Ooredoo), `06` (Mobilis), or `07` (Djezzy), e.g., `0555 12 34 56`. The system automatically normalizes this into international E.164 format (`+213555123456`).

### Issue 2: "Ce numéro a déjà atteint le nombre de participations autorisé pour cette période."

- **Cause**: The phone number has already submitted the maximum allowed number of entries (configured under _Participations max. par téléphone et par période_) for the current draw period.
- **Solution**: The participant must wait until the next weekly draw period begins (every Sunday or Monday at 00:00 Algiers time) to submit another qualifying receipt.

### Issue 3: "Ce ticket a déjà été envoyé pour ce concours."

- **Cause**: The cryptographic SHA-256 fingerprint of the uploaded receipt photo matches an image already registered for this contest.
- **Solution**: The participant must upload a new, distinct receipt showing a different Vanidel purchase. Reusing or sharing receipt images across multiple entries is blocked by the anti-fraud system.

### Issue 4: Receipt Upload Fails or Takes Too Long

- **Cause**: The image file exceeds allowable size limits or is in an unsupported format (e.g. HEIC, TIFF).
- **Solution**: Use standard JPEG, PNG, or WebP images. On modern smartphones with high-megapixel cameras, encourage users to take a direct photo through the mobile browser camera picker.

---

## 7.2 Administrative & Draw Operational Issues

### Issue 5: "Aucune période terminée pour le moment" on the Draws Page

- **Cause**: The current contest has not yet passed the conclusion of its first draw period. For weekly contests starting on a Sunday, the first period concludes the following Saturday at 23:59:59.
- **Solution**: Draws cannot be run prematurely on open periods. Wait until the calendar period elapses. Once 00:00 on the subsequent Sunday arrives, the period appears in the dropdown.

### Issue 6: Cannot Save Contest as "Publié"

- **Cause**: Mandatory pre-publication checklist criteria are missing.
- **Solution**: Look at the **Avant de publier** checklist in the top right sidebar. Any item marked with a red ✗ (e.g. missing Arabic translation, no main visual, or missing prize) blocks publication. Fill the missing information, save as draft, then change status to _Publié_.

### Issue 7: Accidentally Drew an Invalid or Unreachable Winner

- **Cause**: A drawn entrant's ticket is illegible or they do not respond to phone calls.
- **Solution**: Open the winner record (`/admin/collections/winners/:id`). In the **Annulation** section, enter the mandatory reason (e.g., _"Ticket sans produit Vanidel"_), then click **Annuler et retirer au sort**. The system voids the winner and draws an instant replacement from the same period.

### Issue 8: Preview Mode Stays Active on Public Site

- **Cause**: Entering preview mode sets a secure `vanidel-preview` session cookie in your browser.
- **Solution**: Click the yellow button **Quitter l’aperçu** in the top banner, or navigate to `/api/preview/exit`.

---

## 7.3 Infrastructure & System Recovery

### Resetting Disposable Development Data

If the local Docker PostgreSQL database needs to be reset:

```sh
# Stop container
docker stop vanidel-postgres

# Restart fresh container
docker run -d --rm --name vanidel-postgres -p 127.0.0.1:5432:5432 \
  -e POSTGRES_USER=payload -e POSTGRES_PASSWORD=payload-local -e POSTGRES_DB=vanidel \
  postgres:17-alpine

# Verify readiness and re-seed
docker exec vanidel-postgres pg_isready -U payload -d vanidel
pnpm seed
```

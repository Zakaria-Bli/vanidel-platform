# 4.2 Participant Experience: Submitting an Entry

Entering a contest is streamlined into a single, mobile-optimized form designed to be completed in under two minutes without requiring registration.

---

## 4.2.1 The Participation Form

The submission form sits directly below the campaign details at `#participer`:

![Participation Form Initial View](../assets/participations/participation-form-fr.png)
_Figure 4.4: The participation form with customer contact fields, file picker, and consent agreements._

### Required Input Fields

1. **Nom et prénom** (_Full Name_):
   - Mandatory text field.
   - Used for prize identification and masked announcement (e.g. `Amine B.`).
2. **Numéro de téléphone** (_Phone Number_):
   - Mandatory telephone field.
   - Accepts standard Algerian mobile numbers formatted as `05 XX XX XX XX`, `06 XX XX XX XX`, or `07 XX XX XX XX` (or with international code `+213`).
3. **E-mail** (_Email Address_):
   - Optional or mandatory depending on contest settings.
4. **Wilaya**:
   - Mandatory dropdown containing all 58/69 Algerian administrative wilayas, sorted by code and name (e.g., `16 - Alger`, `31 - Oran`, `25 - Constantine`).
5. **Photo du ticket de caisse** (_Receipt Photo_):
   - File upload button (**Choisir une photo**).
   - Accepts camera photos or file gallery uploads in JPEG, PNG, or WebP formats.
   - Requirements: Full receipt must be clearly legible and show the Vanidel product purchase.
6. **Consentements** (_Mandatory & Optional Consents_):
   - **Règlement du concours** (_Mandatory_): Acceptance of official campaign rules.
   - **Traitement des données personnelles** (_Mandatory_): Consent to collect contact information under Algerian Law 18-07/25-11 for contest management and winner announcement.
   - **Offres et nouveautés** (_Optional_): Opt-in to receive promotional updates from Vanidel.

---

## 4.2.2 Form Validation Rules & Error Feedback

The application implements rigorous client and server-side validation to ensure clean data:

### Missing Required Fields

Submitting the form with missing fields highlights the required elements according to HTML5 and accessible web standards:

![Form Validation Errors](../assets/participations/participation-validation-errors.png)
_Figure 4.5: Immediate visual validation highlighting missing required inputs._

### Invalid Phone Number

If a non-Algerian or invalid telephone number is entered (e.g., landline or non-mobile prefix), the form displays a targeted error message:

![Invalid Phone Validation Error](../assets/participations/participation-invalid-phone-error.png)
_Figure 4.6: Inline error message: "Indiquez un numéro de mobile algérien valide (05, 06 ou 07)."_

---

## 4.2.3 Anti-Fraud & Duplicate Prevention

To preserve contest integrity, the platform enforces two automated anti-fraud safeguards:

### 1. Entry Limit per Phone and Draw Period

Each contest defines an entry limit per phone number per draw period (typically 1 entry). If a participant attempts to submit another entry using the same phone number within the same period, submission is refused:

![Duplicate Phone Error](../assets/participations/participation-duplicate-phone-error.png)
_Figure 4.7: Duplicate prevention feedback: "Ce numéro a déjà atteint le nombre de participations autorisé pour cette période. Réessayez à la prochaine période."_

### 2. Duplicate Receipt Photo Detection

Every uploaded image is processed through an automated SHA-256 fingerprinting hash. If another participant attempts to upload the exact same receipt image (even with a different phone or name), the platform rejects the entry:

![Duplicate Receipt Photo Error](../assets/participations/participation-duplicate-ticket-error.png)
_Figure 4.8: Receipt duplicate feedback: "Ce ticket a déjà été envoyé pour ce concours."_

---

## 4.2.4 Successful Submission & Social Sharing

When all fields are valid, the entry is recorded immediately into the draw pool for the current period:

![Completed Form](../assets/participations/participation-form-filled.png)
_Figure 4.9: A fully filled, valid submission form ready for submission._

Upon clicking **Envoyer ma participation**, the form transforms into an animated success confirmation:

![Participation Confirmation & Social Sharing](../assets/participations/participation-success.png)
_Figure 4.10: Confirmation screen featuring Chef Vanidel, success message, and viral social sharing buttons._

### Features of the Confirmation Screen

- **Visual Badge**: Chef Vanidel illustration giving a thumbs-up.
- **Clear Instructions**: Reminds the participant to keep their physical receipt (_"Gardez votre ticket de caisse : il vous sera demandé si vous êtes tiré au sort"_).
- **Social Sharing Call to Action**:
  - **WhatsApp**: Pre-fills a personalized invitation message linking back to the campaign with campaign attribution tracking tags (`?utm_source=whatsapp&utm_medium=share`).
  - **Instagram**: Opens Instagram to share the campaign with friends.
  - **Copier le lien**: Copies the direct campaign link to the clipboard.

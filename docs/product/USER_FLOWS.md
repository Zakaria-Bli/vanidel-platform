# Vanidel Contest Platform — User Flows

## 1. Participant flow

```text
Campaign source / QR code
        ↓
Contest page
        ↓
Read instructions + prizes + rules
        ↓
Open participation form
        ↓
Enter identity/contact details
        ↓
Select wilaya
        ↓
Upload ticket photo
        ↓
Review/grant consent
        ↓
Submit
        ↓
Server validation + duplicate prevention
        ↓
Participation stored (immediately in the draw pool for its period)
        ↓
Confirmation / sharing
```

### Expected behaviors

- The contest page is available in Arabic and French.
- The experience is optimized for mobile.
- Submission is accepted only while the contest is open.
- Invalid files or required fields are rejected with clear feedback.
- A duplicate (same receipt image in the contest, or the phone's entry limit reached for the period) is refused with a clear message.
- Campaign/source parameters are retained where available.
- Consent is recorded with the submission.
- The participant does not need an account.

## 2. Participation review flow

There is no moderation: no approval or rejection step.

```text
Commercial user signs in
        ↓
Open Participations
        ↓
Filter (contest, period, wilaya, source)
        ↓
Open participation
        ↓
View submitted details and ticket image
```

## 3. Draw flow

```text
Commercial user opens contest
        ↓
Open Draws
        ↓
Select the draw period (from the contest's period settings)
        ↓
System calculates the pool: all participations submitted in the period
        ↓
User confirms execution
        ↓
Secure random selection
        ↓
Draw record persisted (with pool hash)
        ↓
Winner record(s) persisted
        ↓
Result becomes non-destructive/auditable
```

### Important behavior

The draw is deliberately **operator-triggered**, even though the platform supports scheduled jobs elsewhere.

### Re-draw

```text
Winner's ticket is invalid, or winner is unreachable
        ↓
Operator voids the winner, with a reason
        ↓
Operator runs a re-draw on the same period
        ↓
New draw record persisted, linked to the original draw
        ↓
Pool = original eligibility pool minus all Participations already selected as Winners in the draw/re-draw chain
```

The original draw record is never modified.

## 4. Winner publication flow

```text
Completed draw
        ↓
Selected winner(s)
        ↓
Commercial team checks the winner's ticket and contacts them
        ↓
(If invalid or unreachable → re-draw, see section 3)
        ↓
Commercial team verifies publication details
        ↓
Apply masked public name
        ↓
Optional winner image/video added
        ↓
Publish winner content
        ↓
Winner appears on public contest page/archive
```

## 5. First-contest setup flow

The first contest is configured by the developer to meet the 15 October deadline.

```text
Vanidel supplies:
  logo / campaign visuals
  contest text
  prizes
  regulation
  technical account access where needed
        ↓
Developer configures first contest
        ↓
Developer validates FR/AR public page
        ↓
Developer validates form/upload/duplicate prevention
        ↓
Launch
```

## 6. Future contest creation flow

After the administration is delivered:

```text
Commercial user
        ↓
Create Contest
        ↓
Enter FR/AR content
        ↓
Upload visuals
        ↓
Add prizes
        ↓
Set dates
        ↓
Configure form fields
        ↓
Attach regulation
        ↓
Configure share/tracking metadata
        ↓
Preview
        ↓
Schedule / Publish
```

The intended outcome is that routine future contests do not require code changes.

## 7. Contest close/archive flow

```text
Contest reaches end date
        ↓
Stop accepting participation
        ↓
Complete remaining draws
        ↓
Publish final winners
        ↓
Mark contest archived
        ↓
Keep public archive accessible
```

## 8. Contact export flow

```text
Authorized commercial user
        ↓
Open Contacts / Export
        ↓
Filter to relevant consent
        ↓
Export the allowed fields
```

Only Contacts whose **effective consent state** for the required consent type is granted should be included in marketing-oriented exports. The effective state is the most recent applicable ConsentRecord for that Contact.

## 9. Reporting flow

```text
Contest
   ├── analytics visit data
   ├── participation data
   ├── source attribution
   └── wilaya distribution
        ↓
Campaign summary/report
```

Phase 1 requires useful campaign measurement, not a full custom BI platform.

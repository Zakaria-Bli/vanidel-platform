# 8. Glossary & Reference

This section defines key domain terms, technical concepts, and reference tables used across the Vanidel platform.

---

## 8.1 Domain Concepts

### Campaign Link (_Lien de campagne_)

A custom tracking URL that records the marketing channel (packaging QR, poster, social network, or influencer) from which a participant arrived. Generates downloadable PNG and vector SVG QR codes.

### Consent Version (_Version du consentement_)

A cryptographic hash (e.g., `2cfd0fce`) generated from the exact wording of a legal consent clause (Regulations, Data Processing, or Marketing). Stored in the database alongside each submission to provide immutable proof of what legal text the participant accepted.

### Draw Period (_Période de tirage_)

A discrete calendar slice of a contest during which submissions are collected for a specific weekly draw. Bound strictly to the Algiers timezone (`Africa/Algiers`), starting at 00:00 and concluding at 23:59:59.

### Honeypot

An invisible form input field (`website`) used to catch automated spam bots. Real human users do not see or fill the field; submissions with this field populated are silently discarded.

### Masked Name (_Nom masqué_)

A privacy-compliant formatting of an individual's name for public display, showing only their first name and the initial letter of their surname (e.g. `Amine B.` or `Fatima Z.`).

### Pool Hash (_Hachage du bassin_)

A SHA-256 cryptographic digest calculated across the sorted, deterministic list of all eligible submission IDs for a draw period. Proves the draw pool was not altered before or during selection.

### Pool Scope (_Périmètre du tirage_)

Determines which entries are eligible for a draw:

- **Période seule** (_Period only_): Only submissions received within the specific draw period.
- **Depuis le début** (_Since start_): Cumulative pool of all submissions from campaign launch up to the period end.

### Re-Draw (_Re-tirage_)

An operator-triggered replacement draw executed when an initial winner is voided due to an invalid receipt or unreachability. Picks a replacement entrant from the same period while keeping the original draw record intact for auditing.

---

## 8.2 Algerian Wilayas Reference Table (Codes 01–58)

The table below lists the 58 Algerian administrative wilayas supported by the platform's selection and export systems:

|  Code  | Wilaya (French) | الولاية (Arabic) |  Code  | Wilaya (French)     | الولاية (Arabic) |
| :----: | :-------------- | :--------------- | :----: | :------------------ | :--------------- |
| **01** | Adrar           | أدرار            | **30** | Ouargla             | ورقلة            |
| **02** | Chlef           | الشلف            | **31** | Oran                | وهران            |
| **03** | Laghouat        | الأغواط          | **32** | El Bayadh           | البيض            |
| **04** | Oum El Bouaghi  | أم البواقي       | **33** | Illizi              | إليزي            |
| **05** | Batna           | باتنة            | **34** | Bordj Bou Arréridj  | برج بوعريريج     |
| **06** | Béjaïa          | بجاية            | **35** | Boumerdès           | بومرداس          |
| **07** | Biskra          | بسكرة            | **36** | El Tarf             | الطارف           |
| **08** | Béchar          | بشار             | **37** | Tindouf             | تندوف            |
| **09** | Blida           | البليدة          | **38** | Tissemsilt          | تيسمسيلت         |
| **10** | Bouira          | البويرة          | **39** | El Oued             | الوادي           |
| **11** | Tamanrasset     | تمنراست          | **40** | Khenchela           | خنشلة            |
| **12** | Tébessa         | تبسة             | **41** | Souk Ahras          | سوق أهراس        |
| **13** | Tlemcen         | تلمسان           | **42** | Tipaza              | تيبازة           |
| **14** | Tiaret          | تيارت            | **43** | Mila                | ميلة             |
| **15** | Tizi Ouzou      | تيزي وزو         | **44** | Aïn Defla           | عين الدفلى       |
| **16** | Alger           | الجزائر          | **45** | Naâma               | النعامة          |
| **17** | Djelfa          | الجلفة           | **46** | Aïn Témouchent      | عين تموشنت       |
| **18** | Jijel           | جيجل             | **47** | Ghardaïa            | غرداية           |
| **19** | Sétif           | سطيف             | **48** | Relizane            | غليزان           |
| **20** | Saïda           | سعيدة            | **49** | Timimoun            | تيميمون          |
| **21** | Skikda          | سكيكدة           | **50** | Bordj Badji Mokhtar | برج باجي مختار   |
| **22** | Sidi Bel Abbès  | سيدي بلعباس      | **51** | Ouled Djellal       | أولاد جلال       |
| **23** | Annaba          | عنابة            | **52** | Béni Abbès          | بني عباس         |
| **24** | Guelma          | قالمة            | **53** | In Salah            | عين صالح         |
| **25** | Constantine     | قسنطينة          | **54** | In Guezzam          | عين قزام         |
| **26** | Médéa           | المدية           | **55** | Touggourt           | تقرت             |
| **27** | Mostaganem      | مستغانم          | **56** | Djanet              | جانت             |
| **28** | M'Sila          | المسيلة          | **57** | El M'Ghaier         | المغير           |
| **29** | Mascara         | معسكر            | **58** | El Meniaa           | المنيعة          |

_(Note: Extended administrative delegacy codes 59–69, such as Aflou, Barika, Bou Saâda, etc., are also recognized by the system's normalizer)._

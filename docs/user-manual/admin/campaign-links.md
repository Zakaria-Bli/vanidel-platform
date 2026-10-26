# 5.5 Admin Operations: Campaign Links & QR Code Generator

The Vanidel platform includes an integrated campaign tracking and QR code generation engine to attribute incoming participants to marketing channels.

---

## 5.5.1 The Campaign Links Directory

Navigate to **Concours › Liens de campagne** (`/admin/collections/campaign-links`):

![Campaign Links List](../assets/campaign-links/admin-campaign-links-list.png)
_Figure 5.14: The campaign links overview table._

Each campaign link tracks a specific distribution channel, providing transparency into which marketing efforts drive consumer participation.

---

## 5.5.2 Generating a New Campaign Link

1. Click **Créer un nouveau Lien de campagne** (`/admin/collections/campaign-links/create`):

![Create Campaign Link Form](../assets/campaign-links/create-campaign-link-form.png)
_Figure 5.15: The campaign link creation form._

2. Enter a recognizable **Nom** (_Name_), e.g., _"Affiche Superette Alger"_ or _"Instagram @sarah"_.
3. In **Concours**, select the target contest.
4. Select the marketing **Canal** (_Channel_):
   - **QR code emballage** (_Packaging QR_)
   - **Affiche** (_Print Poster_)
   - **Facebook**
   - **Instagram**
   - **TikTok**
   - **Influenceur** (_Influencer_)
   - **Autre** (_Other_)
5. In **Code**, enter a unique slug (e.g. `alger-centre` or `sarah-promo`). Mandatory for _Influenceur_ and _Autre_.
6. Click **Sauvegarder** (_Save_).

---

## 5.5.3 Copying Links & Downloading QR Codes

Once saved, the platform automatically renders the tracked URL and download controls:

![Generated QR Code and Tracking Links](../assets/campaign-links/campaign-link-qr-code.png)
_Figure 5.16: Generated tracking address and vector/raster QR download buttons._

### Available Outputs

1. **Tracked Destination URL**:
   ```text
   http://localhost:3000/concours/gamme-mix-2026?utm_source=poster&utm_medium=print&utm_content=alger-centre
   ```
   - Click **Copier le lien** to copy the URL for digital distribution.
2. **QR Code (PNG)**:
   - High-resolution raster image ideal for social media posts, email newsletters, and digital display screens.
3. **QR Code (SVG, impression)**:
   - Infinitely scalable vector graphic formatted specifically for commercial print packaging (cartons, wrappers, and outdoor posters).

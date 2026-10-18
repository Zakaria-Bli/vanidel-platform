# Vanidel brand on the platform

How the client's charter (`charte graphique vanidel 2026.pdf`, October 2026) is applied to the site and the admin. The charter itself and the original logo PDF are kept with the project files, not in git.

![Brand assets overview](assets-overview.jpg)

## The charter in short

| Item         | Charter                       | On the web                                                                                                   |
| ------------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Red          | `#EA0029` · Pantone 185 C     | Primary colour, exactly `#EA0029`. White on it is 4.64:1 (AA).                                               |
| Blue         | `#308AB9` · Pantone 7688 C    | Second brand colour. White on it is 3.85:1, so white text on it is large text only (24 px, or 18.7 px bold). |
| Cream        | `#F2DAB2` · Pantone 7506 C    | Background bands. Dark text on it is 12:1.                                                                   |
| Title font   | Futura LT Paneuropean Bold    | Jost, a free look-alike, until web licences are bought (see Fonts).                                          |
| Body font    | Franklin Gothic Book ("Core") | Libre Franklin, a free look-alike, until web licences are bought (see Fonts).                                |
| Slogan       | كلشي يسهال, Arabic only       | Vector artwork, shown untranslated in every locale. Never typed as text.                                     |
| Text colour  | Not specified                 | Ink `#231F20`, the black of the logo file.                                                                   |
| Arabic fonts | Not specified                 | Alexandria for titles, IBM Plex Sans Arabic for text (see Fonts).                                            |

Hex values are used on screen; the Pantone references are for print only.

## Colours

Tokens are layered: brand primitives, then roles, then per-locale typography. Components only use roles and type utilities, so a brand change touches one file.

| File                                       | Holds                                                                                           | Used by        |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------- | -------------- |
| `src/styles/brand/tokens.css`              | Colour ramps (`--brand-red-500`…), radii, shadows and motion                                    | Site and admin |
| `src/lib/fonts/index.ts`                   | The four fonts, as role variables                                                               | Site and admin |
| `src/app/(frontend)/styles/theme.css`      | Colour roles under shadcn's names (`--primary`, `--secondary`…) and the section spacing         | Site           |
| `src/app/(frontend)/styles/typography.css` | The type scale, per locale                                                                      | Site           |
| `src/app/(frontend)/styles/rich-text.css`  | Lists, links and spacing in text from the rich-text editor                                      | Site           |
| `src/app/(frontend)/globals.css`           | Imports the above and maps them to Tailwind utilities (`bg-primary`, `text-h1`, `rounded-card`) | Site           |

Each ramp is built in OKLCH around its charter colour: red and blue at step 500, cream at step 300. The neutrals are warm greys tinted toward the cream.

| Role               | Value                 | Use                                                                                               |
| ------------------ | --------------------- | ------------------------------------------------------------------------------------------------- |
| `primary`          | red 500 `#EA0029`     | Buttons, badges, step numbers, red bands. White on it 4.64:1.                                     |
| `primary-hover`    | red 600 `#D00023`     | Hover on red                                                                                      |
| `primary-ink`      | red 700 `#AC031C`     | Small red text and links: 7.54:1 on white, 5.55:1 on cream. Red 500 is never used for small text. |
| `secondary`        | cream 100 `#FDF3E2`   | Step cards, the participation section, empty states                                               |
| `brand-cream`      | cream 300 `#F2DAB2`   | The charter's cream bands                                                                         |
| `brand-blue`       | blue 500 `#308AB9`    | Blue bands and icons; white text on it only at large sizes                                        |
| `brand-blue-ink`   | blue 700 `#04628B`    | Blue text on white, 6.72:1                                                                        |
| `muted-foreground` | neutral 600 `#5D5A57` | Secondary text, 6.85:1 on white                                                                   |
| `ring`             | blue 600 `#1577A5`    | Focus outlines, so focus never looks like an error or the brand red. White on red bands.          |
| `destructive`      | `#B91C1C`             | Errors, always with an icon and text since the brand itself is red                                |

## Fonts

The charter's fonts are commercial (Monotype); a desktop licence does not cover the web. Until web licences are bought, the site and the admin use free look-alikes under the SIL Open Font License, loaded with `next/font`:

| Role          | Charter                    | Now                  | Why                                                                                                       |
| ------------- | -------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------- |
| Latin titles  | Futura LT Paneuropean Bold | Jost                 | A Futura revival with the same geometric capitals                                                         |
| Latin text    | Franklin Gothic Book       | Libre Franklin       | A Franklin Gothic revival, with a large x-height for small text                                           |
| Arabic titles | –                          | Alexandria           | A geometric, monoline Arabic sans with round bowls, built like Futura, with weights up to 900             |
| Arabic text   | –                          | IBM Plex Sans Arabic | A light, open grotesque designed for interfaces, closer to Franklin's Book weight than denser Arabic sans |

**Swapping in the licensed fonts** means editing `src/lib/fonts/index.ts` only: replace the loader of a role with `localFont` from `next/font/local`, pointing at the woff2 files, and keep its `variable`. Everything else reads the role variables `--font-brand-display`, `--font-brand-body`, `--font-brand-display-ar` and `--font-brand-body-ar`.

**Per-locale sizes.** At the same size, Plex Arabic's letters are about 30% smaller than Libre Franklin's, so Arabic text is set larger and with more line height (body 18 px / 1.85 against 16 px / 1.6). Alexandria is about as large as Jost, so Arabic titles keep roughly the same size with more line height. Arabic is never letter-spaced or uppercased. Components use the role utilities (`text-display`, `text-h1`, `text-h2`, `text-h3`, `text-eyebrow`, `text-body-lg`, `text-body`, `text-small`, `text-caption`, `text-label`, `text-button`), which read the right values for the page's language.

## Files

Files fetched by a fixed URL (favicons, the default share image) live in `public/`. Files used inside components live in `src/assets/brand/` and are imported statically, so `next/image` gets their size and serves them from `/_next/static/media` with a hashed name.

| File                                                    | What it is                                           | Use it on                                                    |
| ------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------ |
| `src/assets/brand/logo/vanidel-logo-red.svg`            | Full logo, flat, charter red                         | White or cream backgrounds only                              |
| `src/assets/brand/logo/vanidel-logo-white.svg`          | Full logo, white                                     | Red or blue backgrounds, dark mode                           |
| `src/assets/brand/logo/vanidel-mark-red.svg`            | The "V" mark alone, red                              | Where the full logo would be under 72 px wide                |
| `src/assets/brand/logo/vanidel-mark-white.svg`          | The "V" mark alone, white                            | Same, on red or blue                                         |
| `src/assets/brand/logo/vanidel-mark-red-square.svg`     | The red mark centred in a transparent square         | Square slots such as the admin's navigation icon             |
| `src/assets/brand/slogan/kolchi-yeshal-white.svg`       | The slogan, white, traced from the charter           | Red or blue backgrounds                                      |
| `src/assets/brand/slogan/kolchi-yeshal-red.svg`         | The slogan, red                                      | White or cream backgrounds                                   |
| `src/assets/brand/packshots/vanidel-packshots-mix.png`  | Crêpes, pancake, brownies and gaufres boxes, cut out | Red bands, the default share image                           |
| `src/assets/brand/packshots/vanidel-packshots-flan.png` | The five flan sachets, cut out                       | Blue bands, as in the charter                                |
| `src/assets/brand/photos/vanidel-chef-ambassador.png`   | The chef ambassador, cut out, 2000 px wide           | Approved for the "no contest running" state only (see below) |
| `src/assets/brand/photos/vanidel-chef-thumbs-up.png`    | The chef ambassador giving a thumbs up, cut out      | The participation confirmation                               |
| `public/brand/icons/favicon.svg`                        | White mark on a rounded red square                   | Browser tab icon, site and admin                             |
| `public/favicon.ico`                                    | 16, 32 and 48 px, made from `favicon.svg`            | Browsers that ask for `/favicon.ico`                         |
| `public/brand/icons/apple-touch-icon.png`               | 180 px, opaque, made from `favicon.svg`              | Home-screen icon on iOS                                      |
| `public/brand/share/vanidel-share-default.png`          | 1200×630: logo, slogan and packshots on red          | Share previews of pages without their own image              |

The three files marked "made from" are generated by `pnpm brand:assets` (`src/lib/scripts/brand-assets.mjs`). Run it after changing `favicon.svg`, the white logo, the white slogan or the Mix packshot, and commit what it writes. Builds never run it.

The full-resolution chef photo (3300 px) is kept with the project files under `brand/source/`.

## Rules

- **Backgrounds.** The red logo goes on white or cream, the white logo on red or blue. Never put the logo directly on a photo.
- **Clear space.** Keep at least 25% of the logo's height free on every side.
- **Minimum size.** The full logo is never narrower than 72 px; below that, use the mark alone.
- **Slogan.** Always the vector artwork, in white on red or blue, or in red on white or cream. It is the same in French and Arabic, and its `alt` text is marked `lang="ar"`. If a French slogan is supplied one day, it replaces these two files and nothing else changes.
- **Mirroring.** Logos, the slogan, packshots and photos are never mirrored in Arabic (right-to-left). Where a picture has a direction, it is placed physically, not logically.
- **Chef photo.** Used only in the "no contest running" empty state, on the right in both languages: his gesture points left, at the message, and mirroring the photo would reverse the logo on his apron.
- **Chef thumbs up.** Shown once a participation is sent, beside the confirmation. Never mirrored either.
- **Packshots.** The Mix boxes go with red, the flan sachets with blue, as in the charter.

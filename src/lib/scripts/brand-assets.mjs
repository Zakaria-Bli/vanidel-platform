// Regenerates the brand files that browsers and social networks fetch by fixed URL, from the
// vector sources in public/brand/icons and src/assets/brand (see docs/brand/README.md). The
// outputs are committed, so builds never run this: run `pnpm brand:assets` after changing a
// source and commit what it writes.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import sharp from 'sharp'

const RED = '#EA0029'

const favicon = 'public/brand/icons/favicon.svg'
const logoWhite = 'src/assets/brand/logo/vanidel-logo-white.svg'
const sloganWhite = 'src/assets/brand/slogan/kolchi-yeshal-white.svg'
const packshot = 'src/assets/brand/packshots/vanidel-packshots-mix.png'

/** An SVG rasterised to `width` pixels wide, sharp at any size. */
async function svgToPng(file, width) {
  const svg = await readFile(file)
  return sharp(svg, { density: 72 * Math.ceil((width / 64) * 4) })
    .resize({ width })
    .png()
    .toBuffer()
}

/** A .ico holding one PNG per size, which every browser still in use reads. */
async function ico(file, sizes) {
  const images = await Promise.all(sizes.map((size) => svgToPng(file, size)))
  const header = Buffer.alloc(6 + 16 * images.length)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)
  let offset = header.length
  images.forEach((image, index) => {
    const entry = 6 + 16 * index
    header.writeUInt8(sizes[index] % 256, entry)
    header.writeUInt8(sizes[index] % 256, entry + 1)
    header.writeUInt16LE(1, entry + 4)
    header.writeUInt16LE(32, entry + 6)
    header.writeUInt32LE(image.length, entry + 8)
    header.writeUInt32LE(offset, entry + 12)
    offset += image.length
  })
  return Buffer.concat([header, ...images])
}

/** The share image used when a page has none of its own: logo, slogan and packshots on red. */
async function shareImage() {
  const width = 1200
  const height = 630
  const logo = await svgToPng(logoWhite, 420)
  const logoMeta = await sharp(logo).metadata()
  const slogan = await svgToPng(sloganWhite, 250)
  const sloganMeta = await sharp(slogan).metadata()
  const products = await sharp(packshot).trim({ threshold: 0 }).resize({ width: 700 }).toBuffer()
  const productsMeta = await sharp(products).metadata()

  const gap = 36
  const textHeight = logoMeta.height + gap + sloganMeta.height
  const textTop = Math.round((height - textHeight) / 2)
  const textLeft = 64

  return sharp({ create: { width, height, channels: 4, background: RED } })
    .composite([
      { input: logo, left: textLeft, top: textTop },
      {
        input: slogan,
        left: textLeft + Math.round((logoMeta.width - sloganMeta.width) / 2),
        top: textTop + logoMeta.height + gap,
      },
      {
        input: products,
        left: width - productsMeta.width - 24,
        top: Math.round((height - productsMeta.height) / 2) + 24,
      },
    ])
    .flatten({ background: RED })
    .png({ compressionLevel: 9 })
    .toBuffer()
}

const outputs = {
  'public/favicon.ico': () => ico(favicon, [16, 32, 48]),
  // iOS rounds the corners itself, so the icon is a full-bleed opaque square.
  'public/brand/icons/apple-touch-icon.png': async () =>
    sharp(await svgToPng(favicon, 180))
      .flatten({ background: RED })
      .png()
      .toBuffer(),
  'public/brand/share/vanidel-share-default.png': shareImage,
}

for (const [file, render] of Object.entries(outputs)) {
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, await render())
  console.warn(`wrote ${file}`)
}

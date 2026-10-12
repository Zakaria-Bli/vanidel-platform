import sharp from 'sharp'

const width = 60
const height = 40

/**
 * A small JPEG carrying EXIF data and a 90° orientation flag, like a phone photo. Its pixels are
 * noise drawn from `seed`, so different seeds stay different after re-encoding (flat colours can
 * quantize to identical bytes) and the same seed always gives the same photo.
 */
export async function phonePhoto(seed = 0): Promise<Buffer> {
  const pixels = Buffer.alloc(width * height * 3)
  let state = (seed * 2654435761 + 1) >>> 0
  for (let index = 0; index < pixels.length; index++) {
    state = (state * 1664525 + 1013904223) >>> 0
    pixels[index] = state >>> 24
  }
  return sharp(pixels, { raw: { width, height, channels: 3 } })
    .jpeg()
    .withMetadata({ orientation: 6, exif: { IFD0: { Copyright: 'Test phone' } } })
    .toBuffer()
}

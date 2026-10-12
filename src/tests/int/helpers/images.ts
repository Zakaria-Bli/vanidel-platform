import sharp from 'sharp'

/** A small JPEG carrying EXIF data and a 90° orientation flag, like a phone photo. */
export async function phonePhoto(seed = 0): Promise<Buffer> {
  return sharp({
    create: { width: 60, height: 40, channels: 3, background: { r: seed % 256, g: 120, b: 80 } },
  })
    .jpeg()
    .withMetadata({ orientation: 6, exif: { IFD0: { Copyright: 'Test phone' } } })
    .toBuffer()
}

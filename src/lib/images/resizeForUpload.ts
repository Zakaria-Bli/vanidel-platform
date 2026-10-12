import { fitWithin } from './fitWithin'

/**
 * Shrinks a phone photo in the browser before upload: a receipt stays readable at 1600 px, and a
 * ~4 MB camera photo becomes a few hundred KB, which matters on mobile data. Applies the EXIF
 * orientation. Returns the original file when the browser cannot decode it (e.g. HEIC outside
 * Safari) so the server can still try, or refuse it with a clear message.
 */
export async function resizeForUpload(file: File, max = 1600, quality = 0.85): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const { width, height } = fitWithin(bitmap.width, bitmap.height, max)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality),
    )
    if (!blob) return file
    const name = file.name.replace(/\.[^.]*$/, '') || 'ticket'
    return new File([blob], `${name}.jpg`, { type: 'image/jpeg' })
  } catch {
    return file
  }
}

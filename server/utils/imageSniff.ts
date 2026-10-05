import crypto from 'crypto';

export type AllowedImageMime = 'image/jpeg' | 'image/png' | 'image/webp';

export interface SniffResult {
  isValid: boolean;
  mimeType?: AllowedImageMime;
  sha256: string;
  error?: string;
}

/**
 * Sniffs the magic bytes of a buffer to verify that it is truly a JPEG, PNG, or WebP image.
 * Prevents file-extension spoofing and malicious payload upload.
 */
export function sniffImage(buffer: Buffer): SniffResult {
  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

  if (buffer.length < 12) {
    return { isValid: false, sha256, error: 'File is too small to be a valid image' };
  }

  // 1. JPEG check (FF D8 FF)
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { isValid: true, mimeType: 'image/jpeg', sha256 };
  }

  // 2. PNG check (89 50 4E 47 0D 0A 1A 0A)
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { isValid: true, mimeType: 'image/png', sha256 };
  }

  // 3. WebP check (RIFF .... WEBP)
  const isRiff =
    buffer[0] === 0x52 && // 'R'
    buffer[1] === 0x49 && // 'I'
    buffer[2] === 0x46 && // 'F'
    buffer[3] === 0x46; // 'F'

  const isWebp =
    buffer[8] === 0x57 && // 'W'
    buffer[9] === 0x45 && // 'E'
    buffer[10] === 0x42 && // 'B'
    buffer[11] === 0x50; // 'P'

  if (isRiff && isWebp) {
    return { isValid: true, mimeType: 'image/webp', sha256 };
  }

  return {
    isValid: false,
    sha256,
    error: 'Invalid file format. Only true JPEG, PNG, and WebP images are permitted.',
  };
}

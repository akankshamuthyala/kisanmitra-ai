/**
 * Strips non-printable ASCII/Unicode control characters except newline and tab.
 * Escapes angle brackets to prevent delimiter confusion.
 */
export function sanitizeUserInput(input: string | null | undefined, maxLength = 2000): string {
  if (!input) return '';

  return input
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '') // remove control chars
    .trim()
    .slice(0, maxLength);
}

/**
 * Strips HTML tags from AI output or text.
 */
export function stripHtml(str: string): string {
  if (!str) return '';
  return str.replace(/<\/?[^>]+(>|$)/g, '');
}

/**
 * Deep sanitizes all strings in an object by removing HTML tags.
 */
export function deepSanitizeStrings<T>(obj: T): T {
  if (typeof obj === 'string') {
    return stripHtml(obj) as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => deepSanitizeStrings(item)) as unknown as T;
  }
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = deepSanitizeStrings(value);
    }
    return result as T;
  }
  return obj;
}

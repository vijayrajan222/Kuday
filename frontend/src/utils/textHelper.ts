/**
 * Strips emoji characters and symbols for clean UI rendering.
 */
export function cleanEmojis(text?: string | null): string {
  if (!text) return '';
  return text
    .replace(/[\p{Extended_Pictographic}\uFE0F]/gu, '')
    .trim();
}


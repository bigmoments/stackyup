/**
 * Calculate accurate reading time based on actual word count.
 * Average reading speed: 200 words per minute.
 */
export function calculateWordCount(contentHtmlOrText: string): number {
  if (!contentHtmlOrText) return 0;
  const plainText = contentHtmlOrText
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plainText ? plainText.split(" ").filter(Boolean).length : 0;
}

export function calculateReadingTime(contentHtmlOrText: string): number {
  const words = calculateWordCount(contentHtmlOrText);
  return Math.max(1, Math.ceil(words / 200));
}


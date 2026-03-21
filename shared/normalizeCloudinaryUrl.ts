/**
 * Undo accidental double-encoding when a Cloudinary URL is put through encodeURIComponent
 * more than once (e.g. %20 → %2520). Required for stream-document and valid fetch URLs.
 */
export function normalizeCloudinaryCourseUrl(url: string): string {
  let s = url.trim();
  if (!s) return s;
  try {
    while (/%25[0-9A-Fa-f]{2}/i.test(s)) {
      const prev = s;
      s = decodeURIComponent(s);
      if (s === prev) break;
    }
  } catch {
    return url.trim();
  }
  return s;
}

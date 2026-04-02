export type CloudinaryImageOptions = {
  /** Max width for delivery (`c_limit`). Default 1600. */
  maxWidth?: number;
};

/**
 * Improves Cloudinary image delivery: `f_auto`, `q_auto`, and a width cap.
 * No-op for non-Cloudinary URLs, raw uploads, or URLs that already request `f_auto`.
 */
export function optimizeCloudinaryImageUrl(url: string, options: CloudinaryImageOptions = {}): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  const lower = trimmed.toLowerCase();
  if (!lower.includes("res.cloudinary.com") || !lower.includes("/image/upload/")) {
    return trimmed;
  }
  if (lower.includes("/raw/upload/")) return trimmed;

  const maxWidth = options.maxWidth ?? 1600;
  const m = trimmed.match(/^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/i);
  if (!m) return trimmed;

  const afterUpload = m[2];
  if (/^[^/]*\bf_auto\b/i.test(afterUpload)) return trimmed;

  return `${m[1]}f_auto,q_auto,c_limit,w_${maxWidth}/${afterUpload}`;
}

import type { ImgHTMLAttributes } from "react";
import { optimizeCloudinaryImageUrl } from "@shared/optimizeImageUrl";

type SiteImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string;
  /** First paint / LCP: eager load and high fetch priority. */
  priority?: boolean;
  /** Full-viewport background (sets default `sizes` when omitted). */
  hero?: boolean;
  /** Passed to Cloudinary URLs only; caps delivery width. */
  cloudinaryMaxWidth?: number;
};

/**
 * Optimized `<img>`: Cloudinary URLs get `f_auto`, `q_auto`, and width limits; other URLs pass through.
 */
export function SiteImage({
  src,
  alt = "",
  priority = false,
  hero = false,
  cloudinaryMaxWidth,
  loading,
  decoding = "async",
  sizes,
  fetchPriority,
  ...rest
}: SiteImageProps) {
  const optimizedSrc =
    src.includes("res.cloudinary.com") && src.includes("/image/upload/")
      ? optimizeCloudinaryImageUrl(src, {
          maxWidth: cloudinaryMaxWidth ?? (hero ? 1920 : 1200),
        })
      : src;

  const resolvedSizes = sizes ?? (hero ? "100vw" : undefined);

  return (
    <img
      src={optimizedSrc}
      alt={alt}
      loading={priority ? "eager" : loading ?? "lazy"}
      decoding={decoding}
      sizes={resolvedSizes}
      fetchPriority={priority ? "high" : fetchPriority}
      {...rest}
    />
  );
}

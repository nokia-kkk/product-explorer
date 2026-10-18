import { useState } from 'react';

const PLACEHOLDER_SVG = (
  <svg
    aria-hidden="true"
    data-testid="product-image-placeholder"
    viewBox="0 0 100 100"
    className="h-full w-full text-muted"
  >
    <rect width="100" height="100" fill="hsl(var(--muted))" />
    <circle cx="38" cy="36" r="12" fill="currentColor" />
    <path d="M18 78 L44 50 L60 66 L74 54 L84 78 Z" fill="currentColor" />
  </svg>
);

type ProductImageProps = {
  src?: string;
  alt: string;
  className?: string;
  'data-testid'?: string;
};

/** A product image that falls back to a placeholder when `src` is missing or fails to load. */
export function ProductImage({ src, alt, className, 'data-testid': testId }: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div role="img" aria-label={alt} data-testid={testId} className={className}>
        {PLACEHOLDER_SVG}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      data-testid={testId}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

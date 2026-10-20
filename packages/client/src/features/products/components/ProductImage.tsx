import { useState } from 'react';

const PLACEHOLDER_SVG = (
  <svg
    aria-hidden="true"
    data-testid="product-image-placeholder"
    viewBox="0 0 100 100"
    className="h-full w-full"
  >
    <rect width="100" height="100" fill="hsl(var(--muted))" />
    <g
      fill="none"
      stroke="hsl(var(--muted-foreground))"
      strokeOpacity="0.45"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="28" y="30" width="44" height="40" rx="2" />
      <circle cx="40" cy="42" r="4" />
      <path d="M30 64l11-12 8 8 7-6 12 10" />
    </g>
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

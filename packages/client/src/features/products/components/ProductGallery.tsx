import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ProductImage } from './ProductImage';

type ProductGalleryProps = {
  title: string;
  thumbnail: string;
  images: string[];
};

export function ProductGallery({ title, thumbnail, images }: ProductGalleryProps) {
  const gallery = images.length > 0 ? images : [thumbnail];
  const [selected, setSelected] = useState(0);
  // `selected` is only ever set from this array's indices, so it is always in range.
  const active = gallery[selected];

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-md border border-border bg-muted">
        <ProductImage
          src={active}
          alt={title}
          data-testid="main-image"
          className="aspect-square w-full object-cover"
        />
      </div>

      {gallery.length > 1 && (
        <ul
          aria-label="Product images"
          className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]"
        >
          {gallery.map((image, index) => (
            <li key={`${image}-${index}`} className="shrink-0">
              <button
                type="button"
                aria-label={`View image ${index + 1}`}
                aria-current={index === selected ? 'true' : undefined}
                onClick={() => setSelected(index)}
                className={cn(
                  'block h-16 w-16 overflow-hidden rounded-md border bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  index === selected
                    ? 'border-primary ring-1 ring-primary'
                    : 'border-border opacity-80 hover:border-muted-foreground hover:opacity-100'
                )}
              >
                <ProductImage
                  src={image}
                  alt={`${title} view ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

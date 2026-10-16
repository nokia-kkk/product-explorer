import { useState } from 'react';
import ProductImage from './ProductImage';

type ProductGalleryProps = {
  title: string;
  thumbnail: string;
  images: string[];
};

export default function ProductGallery({ title, thumbnail, images }: ProductGalleryProps) {
  const gallery = images.length > 0 ? images : [thumbnail];
  const [selected, setSelected] = useState(0);
  // `selected` is only ever set from this array's indices, so it is always in range.
  const active = gallery[selected];

  return (
    <div className="flex flex-col gap-3">
      <ProductImage
        src={active}
        alt={title}
        data-testid="main-image"
        className="aspect-square w-full rounded-lg border border-gray-200 bg-gray-100 object-cover"
      />

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
                className={[
                  'block h-16 w-16 overflow-hidden rounded-md border bg-gray-100',
                  index === selected
                    ? 'border-gray-900 ring-2 ring-gray-900'
                    : 'border-gray-200 hover:border-gray-400',
                ].join(' ')}
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

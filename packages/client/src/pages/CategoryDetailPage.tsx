import { Link, useParams } from 'react-router-dom';
import { useCategories } from '../features/categories/hooks/useCategories';
import { ProductBrowser } from '../features/products/components/ProductBrowser';

function Breadcrumb({ name }: { name: string }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex items-center gap-2">
        <li>
          <Link to="/" className="text-muted-foreground hover:text-foreground hover:underline">
            Home
          </Link>
        </li>
        <li aria-hidden="true" className="text-muted-foreground">
          /
        </li>
        <li>
          <Link
            to="/categories"
            className="text-muted-foreground hover:text-foreground hover:underline"
          >
            Categories
          </Link>
        </li>
        <li aria-hidden="true" className="text-muted-foreground">
          /
        </li>
        <li aria-current="page" className="font-medium capitalize text-foreground">
          {name}
        </li>
      </ol>
    </nav>
  );
}

export function CategoryDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();

  // Used for the page title and breadcrumb only; the listing itself is filtered
  // by the slug from the path.
  const categories = useCategories();
  const name = categories.data.find((c) => c.slug === slug)?.name ?? slug;

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb name={name} />
      <ProductBrowser title={name} lockedCategory={slug} />
    </div>
  );
}

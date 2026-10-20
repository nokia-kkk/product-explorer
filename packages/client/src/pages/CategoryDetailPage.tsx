import { Link, useParams } from 'react-router-dom';
import { useCategories } from '../features/categories/hooks/useCategories';
import { ProductBrowser } from '../features/products/components/ProductBrowser';

function Breadcrumb({ name }: { name: string }) {
  const linkClass = 'text-muted-foreground transition-colors hover:text-foreground';

  return (
    <nav aria-label="Breadcrumb" className="text-xs">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link to="/" className={linkClass}>
            Home
          </Link>
        </li>
        <li aria-hidden="true" className="text-border">
          /
        </li>
        <li>
          <Link to="/categories" className={linkClass}>
            Categories
          </Link>
        </li>
        <li aria-hidden="true" className="text-border">
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

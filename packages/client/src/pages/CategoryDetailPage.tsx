import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { CategoryListResponse } from '@shared/types';
import { fetchCategories } from '../lib/api';
import ProductList from '../components/ProductList';

function Breadcrumb({ name }: { name: string }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex items-center gap-2">
        <li>
          <Link to="/" className="text-gray-600 hover:text-gray-900 hover:underline">
            Home
          </Link>
        </li>
        <li aria-hidden="true" className="text-gray-400">
          /
        </li>
        <li>
          <Link to="/categories" className="text-gray-600 hover:text-gray-900 hover:underline">
            Categories
          </Link>
        </li>
        <li aria-hidden="true" className="text-gray-400">
          /
        </li>
        <li aria-current="page" className="font-medium capitalize text-gray-900">
          {name}
        </li>
      </ol>
    </nav>
  );
}

export default function CategoryDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();

  // Used for the page title and breadcrumb only; the listing itself is filtered
  // by the slug from the path.
  const categoriesQuery = useQuery<CategoryListResponse>({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });
  const name = categoriesQuery.data?.data.find((c) => c.slug === slug)?.name ?? slug;

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb name={name} />
      <ProductList title={name} lockedCategory={slug} />
    </div>
  );
}

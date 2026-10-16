import { useParams } from 'react-router-dom';

export default function CategoryDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <section>
      <h1 className="text-2xl font-semibold text-gray-900">Category {slug}</h1>
      <p className="mt-2 text-gray-600">Products for this category will appear here.</p>
    </section>
  );
}

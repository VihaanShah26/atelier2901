import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageLayout from '@/components/atelier/PageLayout';
import ProductGrid from '@/components/atelier/ProductGrid';
import { useProducts } from '@/hooks/useProducts';

const STATIONERY_CATEGORIES = {
  essential: {
    label: 'Essential Stationery',
    collection: 'stationery_essential',
    description: 'Everyday essentials designed by Atelier.',
  },
  premium: {
    label: 'Premium Stationery',
    collection: 'stationery_premium',
    description: 'Luxurious finishes and bespoke detailing.',
  },
  envelopes: {
    label: 'Envelopes & Money Holders',
    collection: 'stationery_money',
    description: 'Elegant accompaniments for gifting and correspondence.',
  },
} as const;

type StationeryCategoryKey = keyof typeof STATIONERY_CATEGORIES;
const DEFAULT_CATEGORY: StationeryCategoryKey = 'essential';

export default function Stationery() {
  const [searchParams] = useSearchParams();
  const requestedCategory = (searchParams.get('collection') ?? DEFAULT_CATEGORY) as StationeryCategoryKey;
  const activeCategory: StationeryCategoryKey = STATIONERY_CATEGORIES[requestedCategory]
    ? requestedCategory
    : DEFAULT_CATEGORY;

  const collections = useMemo(
    () => [STATIONERY_CATEGORIES[activeCategory].collection],
    [activeCategory],
  );
  const { products, loading, error } = useProducts(collections);
  const { label, description } = STATIONERY_CATEGORIES[activeCategory];

  return (
    <PageLayout>
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-16">
        <div className="mb-8 lg:mb-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-light animate-fade-in opacity-0">
            Collection
          </p>
          <h1 className="font-sans md:text-2xl lg:text-3xl animate-fade-in opacity-0" style={{ animationDelay: '100ms' }}>
            {label}
          </h1>
          <p className="text-muted-foreground font-light mt-2 animate-fade-in opacity-0" style={{ animationDelay: '200ms' }}>
            {description}
          </p>
        </div>
        
        <ProductGrid products={products} loading={loading} error={error} />
      </section>
    </PageLayout>
  );
}

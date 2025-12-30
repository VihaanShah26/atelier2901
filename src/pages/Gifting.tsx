import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageLayout from '@/components/atelier/PageLayout';
import ProductGrid from '@/components/atelier/ProductGrid';
import { useProducts } from '@/hooks/useProducts';

const GIFTING_CATEGORIES = {
  travel: {
    label: 'Travel Accessories',
    description: 'Curated travel companions crafted for the discerning explorer.',
    collection: 'gifting_travel',
  },
  coasters: {
    label: 'Coasters',
    description: 'Design-forward coasters that bring quiet luxury to any table.',
    collection: 'gifting_coasters',
  },
  wine: {
    label: 'Wine Accessories',
    description: 'Elevated accessories designed to accompany memorable pours.',
    collection: 'gifting_wine',
  },
} as const;

type GiftingCategoryKey = keyof typeof GIFTING_CATEGORIES;
const DEFAULT_CATEGORY: GiftingCategoryKey = 'travel';

export default function Gifting() {
  const [searchParams] = useSearchParams();
  const requestedCategory = (searchParams.get('collection') ?? DEFAULT_CATEGORY) as GiftingCategoryKey;
  const activeCategory: GiftingCategoryKey = GIFTING_CATEGORIES[requestedCategory]
    ? requestedCategory
    : DEFAULT_CATEGORY;

  const collections = useMemo(
    () => [GIFTING_CATEGORIES[activeCategory].collection],
    [activeCategory],
  );
  const { products, loading, error } = useProducts(collections);
  const { label, description } = GIFTING_CATEGORIES[activeCategory];

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

import { useMemo } from 'react';
import PageLayout from '@/components/atelier/PageLayout';
import ProductGrid from '@/components/atelier/ProductGrid';
import { useProducts } from '@/hooks/useProducts';

const STATIONERY_COLLECTIONS = [
  'stationery_essential',
  'stationery_money',
  'stationery_premium'
];

export default function Stationery() {
  const collections = useMemo(() => STATIONERY_COLLECTIONS, []);
  const { products, loading, error } = useProducts(collections);

  return (
    <PageLayout>
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-16">
        <div className="mb-8 lg:mb-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-light animate-fade-in opacity-0">
            Collection
          </p>
          <h1 className="font-sans md:text-2xl lg:text-3xl animate-fade-in opacity-0" style={{ animationDelay: '100ms' }}>
            Bespoke Stationery
          </h1>
        </div>
        
        <ProductGrid products={products} loading={loading} error={error} />
      </section>
    </PageLayout>
  );
}
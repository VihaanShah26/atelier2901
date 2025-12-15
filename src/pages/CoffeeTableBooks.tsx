import { useMemo } from 'react';
import PageLayout from '@/components/atelier/PageLayout';
import ProductGrid from '@/components/atelier/ProductGrid';
import { useProducts } from '@/hooks/useProducts';

export default function CoffeeTableBooks() {
  const collections = useMemo(() => ['coffeetablebooks'], []);
  const { products, loading, error } = useProducts(collections);

  return (
    <PageLayout>
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-24">
        <div className="mb-12 lg:mb-16">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-light animate-fade-in opacity-0">
            Collection
          </p>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl animate-fade-in opacity-0" style={{ animationDelay: '100ms' }}>
            Coffee Table Books
          </h1>
        </div>
        
        <ProductGrid products={products} loading={loading} error={error} />
      </section>
    </PageLayout>
  );
}
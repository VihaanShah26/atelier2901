import { useMemo } from 'react';
import PageLayout from '@/components/atelier/PageLayout';
import HamperSlideshow from '@/components/atelier/HamperSlideshow';
import { useProducts } from '@/hooks/useProducts';

export default function CoffeeTableBooks() {
  const collections = useMemo(() => ['coffeetablebooks'], []);
  const { products, loading, error } = useProducts(collections);

  return (
    <PageLayout>
      <HamperSlideshow
        title="Coffee Table Books"
        products={products}
        loading={loading}
        error={error}
        showImageName={false}
      />
    </PageLayout>
  );
}

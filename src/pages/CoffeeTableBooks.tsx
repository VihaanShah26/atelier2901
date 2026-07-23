import { useMemo } from 'react';
import PageLayout from '@/components/atelier/PageLayout';
import HamperSlideshow from '@/components/atelier/HamperSlideshow';
import { useProducts } from '@/hooks/useProducts';

export default function CoffeeTableBooks() {
  const collections = useMemo(() => ['coffeetablebooks'], []);
  const { products, loading, error } = useProducts(collections);
  const description = "Every story deserves to be beautifully told. \nAt ATELIER 2901, we create bespoke coffee table books that transform life's most cherished moments into timeless memoirs. Whether celebrating weddings, milestone birthdays, anniversaries, family legacies, or creative journeys, each book is thoughtfully designed to become a treasured keepsake. \n\nLet's bring your story to life."; 

  return (
    <PageLayout>
      <HamperSlideshow
        title="Coffee Table Books"
        products={products}
        loading={loading}
        error={error}
        showImageName={false}
        description={description}
      />
    </PageLayout>
  );
}

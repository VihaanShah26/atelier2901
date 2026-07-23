import { useMemo } from 'react';
import PageLayout from '@/components/atelier/PageLayout';
import HamperSlideshow from '@/components/atelier/HamperSlideshow';
import { useProducts } from '@/hooks/useProducts';

export default function Invitations() {
  const collections = useMemo(() => ['invitations'], []);
  const { products, loading, error } = useProducts(collections);
  const description = "Every celebration begins with an invitation. At ATELIER 2901, we create bespoke invitations that set the tone for life's most memorable occasions. From intimate gatherings and milestone celebrations to weddings, baby announcements, and everything in between, each invitation is thoughtfully designed to reflect your unique story and style. \n\nLet's create the perfect beginning \nto your celebration."; 

  return (
    <PageLayout>
      <HamperSlideshow title="Invitations" products={products} loading={loading} error={error} description={description} />
    </PageLayout>
  );
}

import PageLayout from '@/components/atelier/PageLayout';
import HamperSlideshow from '@/components/atelier/HamperSlideshow';
import { useProducts } from '@/hooks/useProducts';

interface HampersProps {
  title?: string;
  collections?: string[];
}

export default function Hampers({ title = 'Hampers', collections = ['hampers', 'stationery_hampers'] }: HampersProps) {
  const { products, loading, error } = useProducts(collections);

  return (
    <PageLayout>
      <HamperSlideshow title={title} products={products} loading={loading} error={error} />
    </PageLayout>
  );
}

import PageLayout from '@/components/atelier/PageLayout';
import HamperSlideshow from '@/components/atelier/HamperSlideshow';
import { useProducts } from '@/hooks/useProducts';

interface HampersProps {
  title?: string;
  collection?: string;
}

export default function Hampers({ title = 'Hampers', collection = 'hampers' }: HampersProps) {
  const { products, loading, error } = useProducts([collection]);

  return (
    <PageLayout>
      <HamperSlideshow title={title} products={products} loading={loading} error={error} />
    </PageLayout>
  );
}

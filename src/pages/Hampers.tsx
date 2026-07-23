import PageLayout from '@/components/atelier/PageLayout';
import HamperSlideshow from '@/components/atelier/HamperSlideshow';
import { useProducts } from '@/hooks/useProducts';

interface HampersProps {
  title?: string;
  collections?: string[];
}

export default function Hampers({ title = 'Gift Hampers', collections = ['hampers', 'stationery_hampers'] }: HampersProps) {
  const { products, loading, error } = useProducts(collections);
  const description = `Every gift tells a story. At ATELIER 2901, we create bespoke gift hampers that are thoughtfully curated and beautifully presented for every occasion. From personal celebrations to weddings, festive gifting, and corporate orders, each hamper is tailored to your vision. \n\nLet's curate something truly memorable together.`; 

  return (
    <PageLayout>
      <HamperSlideshow title={title} products={products} loading={loading} error={error} description={description} />
    </PageLayout>
  );
}

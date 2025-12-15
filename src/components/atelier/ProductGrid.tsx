import { useState } from 'react';
import { Product } from '@/hooks/useProducts';
import ProductCard from './ProductCard';
import ProductModal from './ProductModal';
import ProductSkeleton from './ProductSkeleton';

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  error: string | null;
}

export default function ProductGrid({ products, loading, error }: ProductGridProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground font-light">{error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground font-light">No items yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product, index) => (
          <div 
            key={product.id} 
            className="animate-fade-in opacity-0"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <ProductCard 
              product={product} 
              onClick={() => setSelectedProduct(product)}
            />
          </div>
        ))}
      </div>

      {selectedProduct && (
        <ProductModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
        />
      )}
    </>
  );
}
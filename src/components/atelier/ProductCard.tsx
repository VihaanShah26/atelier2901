import { Product } from '@/hooks/useProducts';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const displayName = product.name || 'ATELIER 2901';

  return (
    <div 
      onClick={onClick}
      className="product-card group cursor-pointer border border-border p-4 transition-all duration-300 hover:border-foreground/30"
    >
      <div className="aspect-square overflow-hidden bg-muted mb-4">
        <img
          src={product.img}
          alt={displayName}
          className="product-image w-full h-full object-cover transition-transform duration-500 ease-out"
          loading="lazy"
        />
      </div>
      <p className="font-serif text-lg text-center text-foreground/80 group-hover:text-foreground transition-colors">
        {displayName}
      </p>
    </div>
  );
}
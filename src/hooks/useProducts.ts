import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Product {
  id: string;
  name: string;
  img: string;
  images: string[];
  category: string;
  price: number | null;
  personalizedPrice?: number | null;
  sizes?: Array<{ label: string; price: number }> | null;
  goldFoil?: boolean;
}

const parseProductImages = (img: unknown) => {
  if (typeof img !== 'string') return [];
  return img
    .split(/\r?\n/)
    .map((src) => src.trim())
    .filter(Boolean);
};

export function useProducts(collectionNames: string[]) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setError(null);
      
      try {
        const allProducts: Product[] = [];
        
        for (const collectionName of collectionNames) {
          const querySnapshot = await getDocs(collection(db, collectionName));
          
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            const images = parseProductImages(data.img);
            const rawSizes = Array.isArray(data.sizes) ? data.sizes : [];
            const sizes = rawSizes
              .map((size) => ({
                label: typeof size?.label === 'string' ? size.label : '',
                price: typeof size?.price === 'number' ? size.price : Number(size?.price),
              }))
              .filter((size) => size.label && Number.isFinite(size.price));
            allProducts.push({
              id: `${collectionName}-${doc.id}`,
              name: data.name || '',
              img: images[0] || '',
              images,
              category: collectionName,
              price: typeof data.price === 'number' ? data.price : null,
              personalizedPrice: typeof data.personalizedPrice === 'number' ? data.personalizedPrice : null,
              sizes: sizes.length ? sizes : null,
              goldFoil: data.goldFoil === true,
            });
          });
        }
        
        // Sort by numeric ID within each category
        allProducts.sort((a, b) => {
          const aNum = parseInt(a.id.split('-').pop() || '0');
          const bNum = parseInt(b.id.split('-').pop() || '0');
          return aNum - bNum;
        });
        
        setProducts(allProducts);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [collectionNames.join(',')]);

  return { products, loading, error };
}

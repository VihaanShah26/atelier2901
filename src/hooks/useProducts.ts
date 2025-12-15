import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Product {
  id: string;
  name: string;
  img: string;
  category: string;
}

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
            allProducts.push({
              id: `${collectionName}-${doc.id}`,
              name: data.name || '',
              img: data.img || '',
              category: collectionName,
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
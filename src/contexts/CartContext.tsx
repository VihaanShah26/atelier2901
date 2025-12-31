import React, { createContext, useContext, useEffect, useState } from 'react';

export type PersonalizeChoice = 'yes' | 'no';

export interface CartItem {
  id: string;
  name: string;
  img: string;
  category: string;
  quantity: number;
  personalize: PersonalizeChoice;
  price: number | null;
  greeting: string | null;
  personalizationName: string | null;
  initials: string | null;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity: number) => void;
  removeFromCart: (
    id: string,
    personalize: PersonalizeChoice,
    greeting: string | null,
    personalizationName: string | null,
    initials: string | null
  ) => void;
  updateQuantity: (
    id: string,
    personalize: PersonalizeChoice,
    greeting: string | null,
    personalizationName: string | null,
    initials: string | null,
    quantity: number
  ) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'atelier2901-cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((item) => ({
        ...item,
        personalize: item.personalize === 'yes' ? 'yes' : 'no',
        price: typeof item.price === 'number' ? item.price : null,
        greeting: typeof item.greeting === 'string' ? item.greeting : null,
        personalizationName:
          typeof item.personalizationName === 'string' ? item.personalizationName : null,
        initials: typeof item.initials === 'string' ? item.initials : null,
      })) as CartItem[];
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = (item: Omit<CartItem, 'quantity'>, quantity: number) => {
    setItems(prev => {
      const existing = prev.find(
        i =>
          i.id === item.id &&
          i.personalize === item.personalize &&
          i.greeting === item.greeting &&
          i.personalizationName === item.personalizationName &&
          i.initials === item.initials
      );
      if (existing) {
        return prev.map(i => 
          i.id === item.id &&
          i.personalize === item.personalize &&
          i.greeting === item.greeting &&
          i.personalizationName === item.personalizationName &&
          i.initials === item.initials
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { ...item, quantity }];
    });
  };

  const removeFromCart = (
    id: string,
    personalize: PersonalizeChoice,
    greeting: string | null,
    personalizationName: string | null,
    initials: string | null
  ) => {
    setItems(prev =>
      prev.filter(
        i =>
          !(
            i.id === id &&
            i.personalize === personalize &&
            i.greeting === greeting &&
            i.personalizationName === personalizationName &&
            i.initials === initials
          )
      )
    );
  };

  const updateQuantity = (
    id: string,
    personalize: PersonalizeChoice,
    greeting: string | null,
    personalizationName: string | null,
    initials: string | null,
    quantity: number
  ) => {
    if (quantity <= 0) {
      removeFromCart(id, personalize, greeting, personalizationName, initials);
      return;
    }
    setItems(prev => prev.map(i => 
      i.id === id &&
      i.personalize === personalize &&
      i.greeting === greeting &&
      i.personalizationName === personalizationName &&
      i.initials === initials
        ? { ...i, quantity }
        : i
    ));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + (item.price ?? 0) * item.quantity,
    0
  );

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      subtotal
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

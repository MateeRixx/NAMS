import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface CartItem {
  productId: string;
  productName: string;
  basePrice: number;
  estimatedMonthlyCost: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  itemCount: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('cart') || '[]');
      return stored.map((i: Partial<CartItem>) => ({
        productId: i.productId || '',
        productName: i.productName || '',
        basePrice: i.basePrice || 0,
        estimatedMonthlyCost: i.estimatedMonthlyCost || (i.basePrice || 0) * 30,
      }));
    }
    catch { return []; }
  });

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      if (prev.some((i) => i.productId === item.productId)) return prev;
      const next = [...prev, item];
      localStorage.setItem('cart', JSON.stringify(next));
      return next;
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.productId !== productId);
      localStorage.setItem('cart', JSON.stringify(next));
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem('cart');
  }, []);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, itemCount: items.length }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
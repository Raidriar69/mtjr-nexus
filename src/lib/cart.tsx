'use client';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface CartItem {
  _id: string;
  title: string;
  game: string;
  price: number;
  originalPrice?: number;
  images: string[];
  platform?: string;
  rank?: string;
  productType?: 'single' | 'shared' | 'bulk';
  quantity: number;
  availableStock?: number;
}

type AddResult = 'added' | 'already_in_cart' | 'cart_full' | 'max_stock';

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => AddResult;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (id: string) => boolean;
  itemCount: number;
  total: number;
}

const CartContext = createContext<CartContextValue | null>(null);
const CART_KEY = 'mtjrnexus_cart';
const MAX_ITEMS = 10;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      if (saved) setItems(JSON.parse(saved));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items, ready]);

  const addItem = useCallback(
    (item: Omit<CartItem, 'quantity'> & { quantity?: number }): AddResult => {
      let result: AddResult = 'added';
      const requestedQty = item.quantity ?? 1;

      setItems((prev) => {
        const existing = prev.find((i) => i._id === item._id);

        if (existing) {
          if (item.productType === 'bulk') {
            const maxStock = item.availableStock ?? existing.availableStock ?? Infinity;
            if (existing.quantity >= maxStock) {
              result = 'max_stock';
              return prev;
            }
            result = 'added';
            return prev.map((i) =>
              i._id === item._id
                ? { ...i, quantity: Math.min(existing.quantity + requestedQty, maxStock) }
                : i
            );
          }
          result = 'already_in_cart';
          return prev;
        }

        if (prev.length >= MAX_ITEMS) {
          result = 'cart_full';
          return prev;
        }
        return [...prev, { ...item, quantity: requestedQty }];
      });

      return result;
    },
    []
  );

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i._id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i._id !== id) return i;
        const maxStock =
          i.productType === 'bulk' ? (i.availableStock ?? Infinity) : 1;
        return { ...i, quantity: Math.max(1, Math.min(quantity, maxStock)) };
      })
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const isInCart = useCallback((id: string) => items.some((i) => i._id === id), [items]);

  const itemCount = items.length;
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, isInCart, itemCount, total }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

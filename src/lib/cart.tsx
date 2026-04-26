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
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: CartItem) => 'added' | 'already_in_cart' | 'cart_full';
  removeItem: (id: string) => void;
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

  const addItem = useCallback((item: CartItem): 'added' | 'already_in_cart' | 'cart_full' => {
    let result: 'added' | 'already_in_cart' | 'cart_full' = 'added';
    setItems((prev) => {
      if (prev.find((i) => i._id === item._id)) { result = 'already_in_cart'; return prev; }
      if (prev.length >= MAX_ITEMS) { result = 'cart_full'; return prev; }
      return [...prev, item];
    });
    return result;
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i._id !== id));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const isInCart = useCallback((id: string) => items.some((i) => i._id === id), [items]);

  const itemCount = items.length;
  const total = items.reduce((sum, i) => sum + i.price, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, isInCart, itemCount, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

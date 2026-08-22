"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getProduct } from "@/data/products";

export type CartLine = {
  slug: string;
  size: string;
  quantity: number;
};

type CartContextValue = {
  items: CartLine[];
  count: number;
  subtotal: number;
  hydrated: boolean;
  addItem: (slug: string, size: string, quantity?: number) => void;
  updateQuantity: (slug: string, size: string, quantity: number) => void;
  removeItem: (slug: string, size: string) => void;
  clearCart: () => void;
};

const STORAGE_KEY = "maison-amiral-cart-v1";
const CartContext = createContext<CartContextValue | null>(null);

function sanitise(items: CartLine[]) {
  return items.filter((item) => {
    const product = getProduct(item.slug);
    return (
      Boolean(product) &&
      product?.sizes.includes(item.size) &&
      Number.isInteger(item.quantity) &&
      item.quantity > 0 &&
      item.quantity <= 10
    );
  });
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(sanitise(JSON.parse(stored) as CartLine[]));
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((slug: string, size: string, quantity = 1) => {
    const product = getProduct(slug);
    if (!product || !product.sizes.includes(size)) return;

    setItems((current) => {
      const existing = current.find((item) => item.slug === slug && item.size === size);
      if (existing) {
        return current.map((item) =>
          item.slug === slug && item.size === size
            ? { ...item, quantity: Math.min(10, item.quantity + quantity) }
            : item,
        );
      }
      return [...current, { slug, size, quantity: Math.min(10, Math.max(1, quantity)) }];
    });
  }, []);

  const updateQuantity = useCallback((slug: string, size: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((current) => current.filter((item) => !(item.slug === slug && item.size === size)));
      return;
    }
    setItems((current) =>
      current.map((item) =>
        item.slug === slug && item.size === size
          ? { ...item, quantity: Math.min(10, quantity) }
          : item,
      ),
    );
  }, []);

  const removeItem = useCallback((slug: string, size: string) => {
    setItems((current) => current.filter((item) => !(item.slug === slug && item.size === size)));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const count = useMemo(() => items.reduce((total, item) => total + item.quantity, 0), [items]);
  const subtotal = useMemo(
    () =>
      items.reduce((total, item) => {
        const product = getProduct(item.slug);
        return total + (product?.price ?? 0) * item.quantity;
      }, 0),
    [items],
  );

  return (
    <CartContext.Provider
      value={{ items, count, subtotal, hydrated, addItem, updateQuantity, removeItem, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}

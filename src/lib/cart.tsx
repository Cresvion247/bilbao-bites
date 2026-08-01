import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { round2 } from "./format";

export type CartModifier = {
  groupSlug: string;
  groupNameEn: string;
  groupNameEs: string;
  slug: string;
  nameEn: string;
  nameEs: string;
  priceDelta: number;
};

export type CartItem = {
  key: string;
  productId: string;
  slug: string;
  nameEn: string;
  nameEs: string;
  basePrice: number;
  quantity: number;
  modifiers: CartModifier[];
  instructions?: string | undefined;
};

const STORAGE_KEY = "bs.cart.v1";

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "key">) => void;
  setQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function itemUnitPrice(item: Pick<CartItem, "basePrice" | "modifiers">) {
  return round2(item.basePrice + item.modifiers.reduce((sum, m) => sum + m.priceDelta, 0));
}

function makeKey(item: Omit<CartItem, "key">) {
  const mods = item.modifiers
    .map((m) => `${m.groupSlug}:${m.slug}`)
    .sort()
    .join("|");
  return `${item.productId}#${mods}#${item.instructions ?? ""}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* ignore corrupted basket */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((item: Omit<CartItem, "key">) => {
    const key = makeKey(item);
    setItems((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) =>
          i.key === key ? { ...i, quantity: i.quantity + item.quantity } : i,
        );
      }
      return [...prev, { ...item, key }];
    });
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.key !== key)
        : prev.map((i) => (i.key === key ? { ...i, quantity } : i)),
    );
  }, []);

  const removeItem = useCallback(
    (key: string) => setItems((prev) => prev.filter((i) => i.key !== key)),
    [],
  );

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = round2(items.reduce((sum, i) => sum + itemUnitPrice(i) * i.quantity, 0));
    return { items, addItem, setQuantity, removeItem, clear, count, subtotal };
  }, [items, addItem, setQuantity, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

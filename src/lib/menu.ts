import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Category = {
  id: string;
  slug: string;
  name_en: string;
  name_es: string;
  sort_order: number;
};

export type Modifier = {
  id: string;
  group_id: string;
  slug: string;
  name_en: string;
  name_es: string;
  price_delta: number;
  is_default: boolean;
  is_available: boolean;
  sort_order: number;
};

export type ModifierGroup = {
  id: string;
  slug: string;
  name_en: string;
  name_es: string;
  min_select: number;
  max_select: number;
  is_required: boolean;
  sort_order: number;
  modifiers: Modifier[];
};

export type Product = {
  id: string;
  category_id: string;
  slug: string;
  name_en: string;
  name_es: string;
  description_en: string | null;
  description_es: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_curry: boolean;
  tags: string[];
  sort_order: number;
  groups: ModifierGroup[];
};

export type DeliveryZone = {
  id: string;
  name: string;
  delivery_fee: number;
  estimated_minutes: number;
  is_enabled: boolean;
};

export type RestaurantSettings = {
  id: string;
  restaurant_name: string;
  logo_url: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  address: string | null;
  opening_hours: Record<string, string>;
  tax_rate: number;
  payment_provider: string;
};

async function fetchMenu() {
  const [categoriesRes, productsRes, groupsRes, modifiersRes, linksRes] = await Promise.all([
    supabase.from("categories").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("products").select("*").order("sort_order"),
    supabase.from("modifier_groups").select("*").order("sort_order"),
    supabase.from("modifiers").select("*").order("sort_order"),
    supabase.from("product_modifier_groups").select("*"),
  ]);

  const error =
    categoriesRes.error ??
    productsRes.error ??
    groupsRes.error ??
    modifiersRes.error ??
    linksRes.error;
  if (error) throw error;

  const modifiersByGroup = new Map<string, Modifier[]>();
  for (const m of (modifiersRes.data ?? []) as unknown as Modifier[]) {
    if (!m.is_available) continue;
    const list = modifiersByGroup.get(m.group_id) ?? [];
    list.push({ ...m, price_delta: Number(m.price_delta) });
    modifiersByGroup.set(m.group_id, list);
  }

  const groupsById = new Map<string, ModifierGroup>();
  for (const g of (groupsRes.data ?? []) as unknown as ModifierGroup[]) {
    groupsById.set(g.id, { ...g, modifiers: modifiersByGroup.get(g.id) ?? [] });
  }

  const groupsByProduct = new Map<string, ModifierGroup[]>();
  for (const link of (linksRes.data ?? []) as unknown as {
    product_id: string;
    group_id: string;
    sort_order: number;
  }[]) {
    const group = groupsById.get(link.group_id);
    if (!group) continue;
    const list = groupsByProduct.get(link.product_id) ?? [];
    list.push(group);
    groupsByProduct.set(link.product_id, list);
  }

  const categories = (categoriesRes.data ?? []) as unknown as Category[];
  const products = ((productsRes.data ?? []) as unknown as Product[]).map((p) => ({
    ...p,
    price: Number(p.price),
    groups: (groupsByProduct.get(p.id) ?? []).sort((a, b) => a.sort_order - b.sort_order),
  }));

  return { categories, products };
}

export const menuQuery = () => queryOptions({ queryKey: ["menu"], queryFn: fetchMenu });

export const zonesQuery = () =>
  queryOptions({
    queryKey: ["delivery-zones"],
    queryFn: async (): Promise<DeliveryZone[]> => {
      const { data, error } = await supabase.from("delivery_zones").select("*").order("name");
      if (error) throw error;
      return (data ?? []).map((z) => ({
        ...(z as unknown as DeliveryZone),
        delivery_fee: Number((z as { delivery_fee: number }).delivery_fee),
      }));
    },
  });

export const settingsQuery = () =>
  queryOptions({
    queryKey: ["restaurant-settings"],
    queryFn: async (): Promise<RestaurantSettings | null> => {
      const { data, error } = await supabase.from("restaurant_settings").select("*").limit(1);
      if (error) throw error;
      const row = data?.[0] as unknown as RestaurantSettings | undefined;
      return row ? { ...row, tax_rate: Number(row.tax_rate) } : null;
    },
  });

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCart, itemUnitPrice } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { formatMoney, round2 } from "@/lib/format";
import { settingsQuery, zonesQuery } from "@/lib/menu";
import { availableProviders, getPaymentProvider } from "@/lib/payments";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Curry Central" },
      { name: "description", content: "Complete your Indian takeaway order in Bilbao." },
      { property: "og:title", content: "Checkout — Curry Central" },
      { property: "og:description", content: "Complete your order for delivery or collection." },
    ],
  }),
  component: CheckoutPage,
});

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(6).max(30),
  email: z.string().trim().email().max(255),
  address: z.string().trim().max(200),
  postcode: z.string().trim().max(12),
  notes: z.string().trim().max(400),
});

function CheckoutPage() {
  const { t, pick, locale } = useI18n();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, subtotal, clear } = useCart();
  const { data: zones } = useQuery(zonesQuery());
  const { data: settings } = useQuery(settingsQuery());

  const [fulfilment, setFulfilment] = useState<"delivery" | "collection">("delivery");
  const [zoneId, setZoneId] = useState<string>("");
  const [provider, setProvider] = useState("stripe");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    postcode: "",
    notes: "",
  });

  useEffect(() => {
    if (user?.email) setForm((prev) => ({ ...prev, email: prev.email || user.email! }));
  }, [user?.email]);

  useEffect(() => {
    if (settings?.payment_provider) setProvider(settings.payment_provider);
  }, [settings?.payment_provider]);

  const zone = (zones ?? []).find((z) => z.id === zoneId);
  const deliveryFee = fulfilment === "delivery" ? (zone?.delivery_fee ?? 0) : 0;
  const taxRate = settings?.tax_rate ?? 0.1;
  const tax = round2(subtotal * taxRate);
  const total = round2(subtotal + deliveryFee + tax);

  const update = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function placeOrder() {
    const parsed = schema.safeParse(form);
    const needsAddress = fulfilment === "delivery";
    if (
      !parsed.success ||
      items.length === 0 ||
      (needsAddress && (!form.address.trim() || !zoneId))
    ) {
      toast.error(t("checkout.required"));
      return;
    }

    setSubmitting(true);
    try {
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          user_id: user?.id ?? null,
          fulfilment,
          delivery_zone_id: needsAddress ? zoneId : null,
          subtotal,
          delivery_fee: deliveryFee,
          tax,
          total,
          notes: form.notes || null,
          payment_provider: provider,
        })
        .select("id, order_number")
        .single();
      if (error || !order) throw error ?? new Error("order failed");

      const [{ error: itemsError }, { error: contactError }] = await Promise.all([
        supabase.from("order_items").insert(
          items.map((item) => ({
            order_id: order.id,
            product_id: item.productId,
            product_name: item.nameEn,
            quantity: item.quantity,
            unit_price: itemUnitPrice(item),
            line_total: round2(itemUnitPrice(item) * item.quantity),
            modifiers: item.modifiers.map((m) => ({
              group: m.groupNameEn,
              name: m.nameEn,
              price_delta: m.priceDelta,
            })),
            special_instructions: item.instructions ?? null,
          })),
        ),
        supabase.from("order_contacts").insert({
          order_id: order.id,
          user_id: user?.id ?? null,
          customer_name: form.name,
          phone: form.phone,
          email: form.email,
          address_line: needsAddress ? form.address : null,
          postcode: form.postcode || null,
        }),
      ]);
      if (itemsError || contactError) throw itemsError ?? contactError;

      const intent = await getPaymentProvider(provider).createPayment({
        orderId: order.id,
        amount: total,
        currency: "EUR",
        customerEmail: form.email,
      });
      await supabase
        .from("orders")
        .update({ payment_reference: intent.reference, payment_status: intent.status })
        .eq("id", order.id);

      window.sessionStorage.setItem(
        "bs.lastOrder",
        JSON.stringify({
          orderNumber: order.order_number,
          total,
          fulfilment,
          eta: zone?.estimated_minutes ?? 25,
        }),
      );
      clear();
      void navigate({ to: "/order-confirmation" });
    } catch {
      toast.error(t("common.error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SiteLayout>
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <h1 className="font-display text-3xl">{t("checkout.title")}</h1>

          <section className="surface-card mt-6 space-y-4 p-5">
            <h2 className="font-display text-lg">{t("checkout.details")}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">{t("checkout.name")}</Label>
                <Input
                  id="name"
                  className="mt-1"
                  maxLength={100}
                  value={form.name}
                  onChange={(e) => update("name")(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="phone">{t("checkout.phone")}</Label>
                <Input
                  id="phone"
                  className="mt-1"
                  maxLength={30}
                  value={form.phone}
                  onChange={(e) => update("phone")(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="email">{t("checkout.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  className="mt-1"
                  maxLength={255}
                  value={form.email}
                  onChange={(e) => update("email")(e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="surface-card mt-6 space-y-4 p-5">
            <h2 className="font-display text-lg">{t("checkout.fulfilment")}</h2>
            <RadioGroup
              className="flex gap-6"
              value={fulfilment}
              onValueChange={(value) => setFulfilment(value as "delivery" | "collection")}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="delivery" id="f-delivery" />
                <Label htmlFor="f-delivery" className="font-normal">
                  {t("checkout.delivery")}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="collection" id="f-collection" />
                <Label htmlFor="f-collection" className="font-normal">
                  {t("checkout.collection")}
                </Label>
              </div>
            </RadioGroup>

            {fulfilment === "delivery" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="address">{t("checkout.address")}</Label>
                  <Input
                    id="address"
                    className="mt-1"
                    maxLength={200}
                    value={form.address}
                    onChange={(e) => update("address")(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="postcode">{t("checkout.postcode")}</Label>
                  <Input
                    id="postcode"
                    className="mt-1"
                    maxLength={12}
                    value={form.postcode}
                    onChange={(e) => update("postcode")(e.target.value)}
                  />
                </div>
                <div>
                  <Label>{t("checkout.zone")}</Label>
                  <Select value={zoneId} onValueChange={setZoneId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={t("checkout.selectZone")} />
                    </SelectTrigger>
                    <SelectContent>
                      {(zones ?? [])
                        .filter((z) => z.is_enabled)
                        .map((z) => (
                          <SelectItem key={z.id} value={z.id}>
                            {z.name} · {formatMoney(z.delivery_fee, locale)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </section>

          <section className="surface-card mt-6 space-y-4 p-5">
            <h2 className="font-display text-lg">{t("checkout.payment")}</h2>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableProviders.map((id) => (
                  <SelectItem key={id} value={id}>
                    {id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div>
              <Label htmlFor="notes">{t("checkout.notes")}</Label>
              <Textarea
                id="notes"
                className="mt-1"
                maxLength={400}
                value={form.notes}
                onChange={(e) => update("notes")(e.target.value)}
              />
            </div>
          </section>
        </div>

        <aside className="surface-card h-fit p-5 lg:sticky lg:top-24">
          <h2 className="font-display text-lg">{t("checkout.summary")}</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {items.map((item) => (
              <li key={item.key} className="flex justify-between gap-3">
                <span>
                  {item.quantity} × {pick(item.nameEn, item.nameEs)}
                </span>
                <span className="tabular-nums">
                  {formatMoney(itemUnitPrice(item) * item.quantity, locale)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("basket.subtotal")}</span>
              <span className="tabular-nums">{formatMoney(subtotal, locale)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("basket.delivery")}</span>
              <span className="tabular-nums">{formatMoney(deliveryFee, locale)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("basket.tax")}</span>
              <span className="tabular-nums">{formatMoney(tax, locale)}</span>
            </div>
            <div className="flex justify-between pt-2 font-display text-lg">
              <span>{t("basket.total")}</span>
              <span className="tabular-nums text-primary">{formatMoney(total, locale)}</span>
            </div>
          </div>
          <Button
            className="mt-5 w-full"
            size="lg"
            disabled={submitting || items.length === 0}
            onClick={() => void placeOrder()}
          >
            {submitting ? t("checkout.placing") : t("checkout.place")}
          </Button>
        </aside>
      </div>
    </SiteLayout>
  );
}

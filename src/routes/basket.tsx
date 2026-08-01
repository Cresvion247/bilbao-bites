import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { useCart, itemUnitPrice } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { formatMoney } from "@/lib/format";

export const Route = createFileRoute("/basket")({
  head: () => ({
    meta: [
      { title: "Your basket — Bilbao Spice" },
      { name: "description", content: "Review your Indian takeaway order before checkout." },
      { property: "og:title", content: "Your basket — Bilbao Spice" },
      { property: "og:description", content: "Review your order before checkout." },
    ],
  }),
  component: BasketPage,
});

function BasketPage() {
  const { t, pick, locale } = useI18n();
  const { items, setQuantity, removeItem, clear, subtotal } = useCart();

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-3xl">{t("basket.title")}</h1>

        {items.length === 0 ? (
          <div className="mt-8">
            <p className="text-muted-foreground">{t("basket.empty")}</p>
            <Button className="mt-4" asChild>
              <Link to="/menu">{t("basket.browse")}</Link>
            </Button>
          </div>
        ) : (
          <>
            <ul className="mt-8 space-y-3">
              {items.map((item) => (
                <li key={item.key} className="surface-card flex gap-4 p-4">
                  <div className="flex-1">
                    <p className="font-medium">{pick(item.nameEn, item.nameEs)}</p>
                    {item.modifiers.length > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.modifiers
                          .map((m) => `${pick(m.groupNameEn, m.groupNameEs)}: ${pick(m.nameEn, m.nameEs)}`)
                          .join(" · ")}
                      </p>
                    )}
                    {item.instructions && (
                      <p className="mt-1 text-xs italic text-muted-foreground">
                        {item.instructions}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="size-8"
                        onClick={() => setQuantity(item.key, item.quantity - 1)}
                      >
                        <Minus className="size-3.5" />
                      </Button>
                      <span className="w-6 text-center tabular-nums">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="size-8"
                        onClick={() => setQuantity(item.key, item.quantity + 1)}
                      >
                        <Plus className="size-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        aria-label={t("basket.remove")}
                        onClick={() => removeItem(item.key)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="font-semibold tabular-nums">
                    {formatMoney(itemUnitPrice(item) * item.quantity, locale)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="surface-card mt-6 space-y-2 p-5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("basket.subtotal")}</span>
                <span className="tabular-nums">{formatMoney(subtotal, locale)}</span>
              </div>
              <p className="text-xs text-muted-foreground">{t("common.currencyNote")}</p>
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={clear}>
                {t("basket.clear")}
              </Button>
              <Button className="flex-1" size="lg" asChild>
                <Link to="/checkout">{t("basket.checkout")}</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </SiteLayout>
  );
}

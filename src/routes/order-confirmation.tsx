import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { formatMoney } from "@/lib/format";

export const Route = createFileRoute("/order-confirmation")({
  head: () => ({
    meta: [
      { title: "Order confirmed — Bilbao Spice" },
      { name: "description", content: "Your Indian takeaway order has been sent to the kitchen." },
      { property: "og:title", content: "Order confirmed — Bilbao Spice" },
      { property: "og:description", content: "Your order has been sent to the kitchen." },
    ],
  }),
  component: ConfirmationPage,
});

type LastOrder = {
  orderNumber: number;
  total: number;
  fulfilment: string;
  eta: number;
};

function ConfirmationPage() {
  const { t, locale } = useI18n();
  const [order, setOrder] = useState<LastOrder | null>(null);

  useEffect(() => {
    const raw = window.sessionStorage.getItem("bs.lastOrder");
    if (raw) setOrder(JSON.parse(raw) as LastOrder);
  }, []);

  return (
    <SiteLayout>
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <CheckCircle2 className="mx-auto size-12 text-primary" />
        <h1 className="mt-6 font-display text-3xl">{t("confirm.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("confirm.thanks")}</p>

        {order && (
          <div className="surface-card mt-8 space-y-2 p-6 text-left text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("confirm.number")}</span>
              <span className="font-display text-lg text-primary">#{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("confirm.status")}</span>
              <span>{t("status.new")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("confirm.eta")}</span>
              <span>
                {order.eta} {t("home.minutes")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("basket.total")}</span>
              <span className="tabular-nums">{formatMoney(order.total, locale)}</span>
            </div>
          </div>
        )}

        <Button className="mt-8" asChild>
          <Link to="/menu">{t("confirm.again")}</Link>
        </Button>
      </div>
    </SiteLayout>
  );
}

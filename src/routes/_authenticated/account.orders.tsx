import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { StatusBadge, type OrderStatus } from "@/components/site/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { formatMoney, formatTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/account/orders")({
  component: OrdersPage,
});

function OrdersPage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();

  const { data: orders } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, status, total, created_at, order_items(id, quantity)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-3xl">{t("orders.title")}</h1>
        {!orders?.length ? (
          <p className="mt-6 text-muted-foreground">{t("orders.empty")}</p>
        ) : (
          <ul className="mt-8 space-y-3">
            {orders.map((order) => (
              <li key={order.id} className="surface-card flex items-center justify-between p-5">
                <div>
                  <p className="font-display text-lg">#{order.order_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatTime(order.created_at, locale)} ·{" "}
                    {(order.order_items ?? []).reduce((s, i) => s + i.quantity, 0)}{" "}
                    {t("orders.items")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={order.status as OrderStatus} />
                  <span className="tabular-nums">{formatMoney(Number(order.total), locale)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SiteLayout>
  );
}

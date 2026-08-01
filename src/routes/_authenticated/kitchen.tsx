import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { StatusBadge, type OrderStatus } from "@/components/site/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { formatMoney, formatTime } from "@/lib/format";
import { dispatchPrintWebhook, printReceipt, type Receipt } from "@/lib/printing";

export const Route = createFileRoute("/_authenticated/kitchen")({
  component: KitchenPage,
});

const flow: OrderStatus[] = ["new", "accepted", "preparing", "ready", "completed"];

type KitchenItem = {
  id: string;
  product_name: string;
  quantity: number;
  line_total: number;
  special_instructions: string | null;
  modifiers: { group: string; name: string }[] | null;
};

type KitchenOrder = {
  id: string;
  order_number: number;
  status: OrderStatus;
  fulfilment: string;
  total: number;
  notes: string | null;
  created_at: string;
  order_items: KitchenItem[];
};

function KitchenPage() {
  const { t, locale } = useI18n();
  const { isKitchen, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: orders } = useQuery({
    queryKey: ["kitchen-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        // Deliberately no contact data: kitchen staff never see customer PII.
        .select(
          "id, order_number, status, fulfilment, total, notes, created_at, order_items(id, product_name, quantity, line_total, special_instructions, modifiers)",
        )
        .not("status", "in", "(completed,cancelled)")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as KitchenOrder[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("kitchen")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  async function advance(order: KitchenOrder, status: OrderStatus) {
    await supabase.from("orders").update({ status }).eq("id", order.id);
    void queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });

    if (status === "accepted") {
      const receipt = toReceipt(order);
      void dispatchPrintWebhook(receipt);
      printReceipt(receipt);
    }
  }

  function toReceipt(order: KitchenOrder): Receipt {
    return {
      orderNumber: order.order_number,
      placedAt: formatTime(order.created_at, locale),
      fulfilment: order.fulfilment,
      notes: order.notes,
      total: Number(order.total),
      lines: order.order_items.map((item) => ({
        quantity: item.quantity,
        name: item.product_name,
        modifiers: (item.modifiers ?? []).map((m) => m.name),
        instructions: item.special_instructions,
        lineTotal: Number(item.line_total),
      })),
    };
  }

  if (!isKitchen && !isAdmin) {
    return (
      <SiteLayout>
        <p className="mx-auto max-w-3xl px-4 py-20 text-muted-foreground">{t("common.error")}</p>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="font-display text-3xl">{t("kitchen.title")}</h1>
        {!orders?.length ? (
          <p className="mt-6 text-muted-foreground">{t("kitchen.noOrders")}</p>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {orders.map((order) => {
              const next = flow[flow.indexOf(order.status) + 1];
              return (
                <article key={order.id} className="surface-card p-5">
                  <header className="flex items-center justify-between">
                    <div>
                      <p className="font-display text-xl">
                        {t("kitchen.order")} #{order.order_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(order.created_at, locale)} ·{" "}
                        {order.fulfilment === "delivery"
                          ? t("checkout.delivery")
                          : t("checkout.collection")}
                      </p>
                    </div>
                    <StatusBadge status={order.status} />
                  </header>

                  <ul className="mt-4 space-y-2 text-sm">
                    {order.order_items.map((item) => (
                      <li key={item.id}>
                        <span className="font-medium">
                          {item.quantity} × {item.product_name}
                        </span>
                        {(item.modifiers ?? []).length > 0 && (
                          <span className="block text-xs text-muted-foreground">
                            {(item.modifiers ?? []).map((m) => m.name).join(", ")}
                          </span>
                        )}
                        {item.special_instructions && (
                          <span className="block text-xs italic text-primary">
                            {item.special_instructions}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>

                  {order.notes && (
                    <p className="mt-3 rounded-md bg-secondary p-2 text-xs">
                      {t("kitchen.customerNotes")}: {order.notes}
                    </p>
                  )}

                  <footer className="mt-4 flex items-center gap-2">
                    <span className="font-semibold tabular-nums">
                      {formatMoney(Number(order.total), locale)}
                    </span>
                    <div className="ml-auto flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => printReceipt(toReceipt(order))}
                      >
                        {t("kitchen.print")}
                      </Button>
                      {next && (
                        <Button size="sm" onClick={() => void advance(order, next)}>
                          {t(`status.${next}` as const)}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => void advance(order, "cancelled")}
                      >
                        {t("status.cancelled")}
                      </Button>
                    </div>
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

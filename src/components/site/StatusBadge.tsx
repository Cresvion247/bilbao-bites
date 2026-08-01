import { Badge } from "@/components/ui/badge";
import { useI18n, type TranslationKey } from "@/lib/i18n";

export type OrderStatus =
  | "new"
  | "accepted"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

const keys: Record<OrderStatus, TranslationKey> = {
  new: "status.new",
  accepted: "status.accepted",
  preparing: "status.preparing",
  ready: "status.ready",
  completed: "status.completed",
  cancelled: "status.cancelled",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useI18n();
  const variant =
    status === "cancelled" ? "destructive" : status === "new" ? "default" : "secondary";
  return <Badge variant={variant}>{t(keys[status])}</Badge>;
}

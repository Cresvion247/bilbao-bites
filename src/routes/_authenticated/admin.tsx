import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { menuQuery, settingsQuery, zonesQuery } from "@/lib/menu";
import { availableProviders } from "@/lib/payments";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

function AdminPage() {
  const { t, pick } = useI18n();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { data: settings } = useQuery(settingsQuery());
  const { data: zones } = useQuery(zonesQuery());
  const { data: menu } = useQuery(menuQuery());
  const [roleUserId, setRoleUserId] = useState("");
  const [role, setRole] = useState<"admin" | "kitchen">("kitchen");

  if (!isAdmin) {
    return (
      <SiteLayout>
        <p className="mx-auto max-w-3xl px-4 py-20 text-muted-foreground">{t("common.error")}</p>
      </SiteLayout>
    );
  }

  const saved = () => toast.success(t("admin.saved"));

  async function saveSettings(patch: Record<string, unknown>) {
    if (!settings) return;
    const { error } = await supabase
      .from("restaurant_settings")
      .update(patch)
      .eq("id", settings.id);
    if (error) return toast.error(t("common.error"));
    void queryClient.invalidateQueries({ queryKey: ["restaurant-settings"] });
    saved();
  }

  async function saveProduct(id: string, patch: Record<string, unknown>) {
    const { error } = await supabase.from("products").update(patch).eq("id", id);
    if (error) return toast.error(t("common.error"));
    void queryClient.invalidateQueries({ queryKey: ["menu"] });
    saved();
  }

  async function saveZone(id: string, patch: Record<string, unknown>) {
    const { error } = await supabase.from("delivery_zones").update(patch).eq("id", id);
    if (error) return toast.error(t("common.error"));
    void queryClient.invalidateQueries({ queryKey: ["delivery-zones"] });
    saved();
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="font-display text-3xl">{t("admin.title")}</h1>

        <Tabs defaultValue="settings" className="mt-8">
          <TabsList className="flex-wrap">
            <TabsTrigger value="settings">{t("admin.settings")}</TabsTrigger>
            <TabsTrigger value="menu">{t("admin.menu")}</TabsTrigger>
            <TabsTrigger value="delivery">{t("admin.delivery")}</TabsTrigger>
            <TabsTrigger value="payments">{t("admin.payments")}</TabsTrigger>
            <TabsTrigger value="users">{t("admin.users")}</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="surface-card mt-4 grid gap-4 p-5 sm:grid-cols-2">
            {settings && (
              <>
                {(
                  [
                    ["restaurant_name", "admin.name"],
                    ["logo_url", "admin.logo"],
                    ["contact_phone", "admin.phone"],
                    ["contact_email", "admin.emailField"],
                    ["address", "admin.addressField"],
                  ] as const
                ).map(([field, labelKey]) => (
                  <div key={field}>
                    <Label htmlFor={field}>{t(labelKey)}</Label>
                    <Input
                      id={field}
                      className="mt-1"
                      defaultValue={(settings[field] as string | null) ?? ""}
                      onBlur={(e) => void saveSettings({ [field]: e.target.value })}
                    />
                  </div>
                ))}
                <div>
                  <Label htmlFor="tax_rate">{t("admin.taxRate")}</Label>
                  <Input
                    id="tax_rate"
                    type="number"
                    step="0.01"
                    className="mt-1"
                    defaultValue={settings.tax_rate}
                    onBlur={(e) => void saveSettings({ tax_rate: Number(e.target.value) })}
                  />
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="menu" className="mt-4 space-y-2">
            {(menu?.products ?? []).map((product) => (
              <div
                key={product.id}
                className="surface-card flex flex-wrap items-center gap-4 p-4 text-sm"
              >
                <span className="min-w-48 flex-1">{pick(product.name_en, product.name_es)}</span>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">{t("admin.price")}</Label>
                  <Input
                    type="number"
                    step="0.10"
                    className="w-24"
                    defaultValue={product.price}
                    onBlur={(e) => void saveProduct(product.id, { price: Number(e.target.value) })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">{t("admin.available")}</Label>
                  <Switch
                    defaultChecked={product.is_available}
                    onCheckedChange={(checked) =>
                      void saveProduct(product.id, { is_available: checked })
                    }
                  />
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="delivery" className="mt-4 space-y-2">
            {(zones ?? []).map((zone) => (
              <div
                key={zone.id}
                className="surface-card flex flex-wrap items-center gap-4 p-4 text-sm"
              >
                <span className="min-w-32 flex-1 font-medium">{zone.name}</span>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">{t("admin.fee")}</Label>
                  <Input
                    type="number"
                    step="0.10"
                    className="w-24"
                    defaultValue={zone.delivery_fee}
                    onBlur={(e) => void saveZone(zone.id, { delivery_fee: Number(e.target.value) })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">{t("admin.eta")}</Label>
                  <Input
                    type="number"
                    className="w-20"
                    defaultValue={zone.estimated_minutes}
                    onBlur={(e) =>
                      void saveZone(zone.id, { estimated_minutes: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">{t("admin.enabled")}</Label>
                  <Switch
                    defaultChecked={zone.is_enabled}
                    onCheckedChange={(checked) => void saveZone(zone.id, { is_enabled: checked })}
                  />
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="payments" className="surface-card mt-4 space-y-4 p-5">
            <div>
              <Label>{t("admin.provider")}</Label>
              <Select
                value={settings?.payment_provider ?? "stripe"}
                onValueChange={(value) => void saveSettings({ payment_provider: value })}
              >
                <SelectTrigger className="mt-1 max-w-xs">
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
            </div>
            <p className="text-xs text-muted-foreground">{t("admin.merchantNote")}</p>
          </TabsContent>

          <TabsContent value="users" className="surface-card mt-4 space-y-4 p-5">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1">
                <Label htmlFor="role-user">{t("admin.roleUserId")}</Label>
                <Input
                  id="role-user"
                  className="mt-1"
                  value={roleUserId}
                  onChange={(e) => setRoleUserId(e.target.value)}
                />
              </div>
              <Select value={role} onValueChange={(value) => setRole(value as "admin" | "kitchen")}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kitchen">kitchen</SelectItem>
                  <SelectItem value="admin">admin</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={async () => {
                  const { error } = await supabase
                    .from("user_roles")
                    .insert({ user_id: roleUserId.trim(), role });
                  if (error) return toast.error(t("common.error"));
                  setRoleUserId("");
                  saved();
                }}
              >
                {t("admin.grant")}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </SiteLayout>
  );
}

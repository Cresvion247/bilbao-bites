import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { settingsQuery } from "@/lib/menu";

export function Footer() {
  const { t } = useI18n();
  const { data: settings } = useQuery(settingsQuery());
  const hours = Object.entries(settings?.opening_hours ?? {});

  return (
    <footer className="mt-24 border-t border-border/70 bg-card/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
        <div>
          <p className="font-display text-lg text-gradient-warm">
            {settings?.restaurant_name ?? "Bilbao Spice"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{settings?.address}</p>
        </div>
        <div>
          <p className="text-sm font-semibold">{t("footer.hours")}</p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {hours.map(([label, value]) => (
              <li key={label} className="flex justify-between gap-4">
                <span className="uppercase tracking-wide">{label}</span>
                <span>{value}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">{t("footer.contact")}</p>
          <p className="mt-2 text-sm text-muted-foreground">{settings?.contact_phone}</p>
          <p className="text-sm text-muted-foreground">{settings?.contact_email}</p>
          <p className="mt-4 text-xs text-muted-foreground">
            © {new Date().getFullYear()} {settings?.restaurant_name ?? "Bilbao Spice"}.{" "}
            {t("footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}

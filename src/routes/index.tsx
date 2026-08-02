import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard } from "@/components/site/ProductCard";
import { useI18n } from "@/lib/i18n";
import { menuQuery, zonesQuery } from "@/lib/menu";
import { formatMoney } from "@/lib/format";
import heroImage from "@/assets/hero-curry.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Curry Central — Premium Indian Takeaway in Bilbao" },
      {
        name: "description",
        content:
          "Slow-cooked curries, tandoor breads and combo boxes delivered across Deusto, Indautxu, Casco Viejo and Abando.",
      },
      { property: "og:title", content: "Curry Central — Premium Indian Takeaway in Bilbao" },
      {
        property: "og:description",
        content: "Order Indian food for delivery or collection in central Bilbao.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { t, locale } = useI18n();
  const { data } = useQuery(menuQuery());
  const { data: zones } = useQuery(zonesQuery());

  const signatures = (data?.products ?? []).filter((p) => p.tags.length > 0).slice(0, 3);

  return (
    <SiteLayout>
      <section className="relative overflow-hidden">
        <img
          src={heroImage}
          alt="Butter chicken curry with garlic naan and saffron rice"
          width={1600}
          height={1104}
          className="absolute inset-0 size-full object-cover opacity-80"
        />
        <div
          className="absolute inset-0"
          style={{ background: "var(--gradient-veil)" }}
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-28 sm:py-36">
          <p className="text-xs uppercase tracking-[0.25em] text-primary">{t("home.eyebrow")}</p>
          <h1 className="mt-5 max-w-2xl text-4xl leading-[1.05] sm:text-6xl">
            {t("home.title")}
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            {t("home.subtitle")}
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link to="/menu">{t("home.cta")}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/menu">{t("home.ctaSecondary")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display text-2xl">{t("home.bestsellers")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("home.bestsellersSub")}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {signatures.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-8">
        <h2 className="font-display text-2xl">{t("home.zones")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("home.zonesSub")}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(zones ?? [])
            .filter((zone) => zone.is_enabled)
            .map((zone) => (
              <div key={zone.id} className="surface-card p-4">
                <p className="font-display text-lg">{zone.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatMoney(zone.delivery_fee, locale)} · {zone.estimated_minutes}{" "}
                  {t("home.minutes")}
                </p>
              </div>
            ))}
        </div>
      </section>
    </SiteLayout>
  );
}

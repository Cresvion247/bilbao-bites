import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { menuQuery } from "@/lib/menu";

export const Route = createFileRoute("/menu/")({
  head: () => ({
    meta: [
      { title: "Menu — Curry Central Indian Takeaway" },
      {
        name: "description",
        content:
          "Starters, curries, tandoor breads, rice and the Bilbao Indian Box combo. Choose your spice level at checkout.",
      },
      { property: "og:title", content: "Menu — Curry Central Indian Takeaway" },
      {
        property: "og:description",
        content: "Browse our full Indian takeaway menu in Bilbao.",
      },
    ],
  }),
  component: MenuPage,
});

function MenuPage() {
  const { t, pick } = useI18n();
  const { data, isLoading } = useQuery(menuQuery());
  const [active, setActive] = useState<string | null>(null);

  const categories = data?.categories ?? [];
  const products = (data?.products ?? []).filter(
    (product) => !active || product.category_id === active,
  );

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="font-display text-3xl sm:text-4xl">{t("menu.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("menu.subtitle")}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={active === null ? "default" : "outline"}
            onClick={() => setActive(null)}
          >
            {t("menu.all")}
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              size="sm"
              variant={active === category.id ? "default" : "outline"}
              onClick={() => setActive(category.id)}
            >
              {pick(category.name_en, category.name_es)}
            </Button>
          ))}
        </div>

        <p className="mt-6 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
          {t("product.spiceNote")}
        </p>

        {isLoading ? (
          <p className="mt-10 text-sm text-muted-foreground">{t("common.loading")}</p>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

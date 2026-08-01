import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Minus, Plus } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { menuQuery, type ModifierGroup } from "@/lib/menu";
import { useI18n } from "@/lib/i18n";
import { formatMoney } from "@/lib/format";
import { useCart, type CartModifier } from "@/lib/cart";

export const Route = createFileRoute("/menu/$slug")({
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { t, pick, locale } = useI18n();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { data, isLoading } = useQuery(menuQuery());
  const [quantity, setQuantity] = useState(1);
  const [selection, setSelection] = useState<Record<string, string[]>>({});
  const [instructions, setInstructions] = useState("");

  const product = data?.products.find((p) => p.slug === slug);

  const chosen = useMemo<CartModifier[]>(() => {
    if (!product) return [];
    const list: CartModifier[] = [];
    for (const group of product.groups) {
      for (const modifierSlug of selection[group.slug] ?? []) {
        const modifier = group.modifiers.find((m) => m.slug === modifierSlug);
        if (!modifier) continue;
        list.push({
          groupSlug: group.slug,
          groupNameEn: group.name_en,
          groupNameEs: group.name_es,
          slug: modifier.slug,
          nameEn: modifier.name_en,
          nameEs: modifier.name_es,
          priceDelta: modifier.price_delta,
        });
      }
    }
    return list;
  }, [product, selection]);

  if (isLoading) {
    return (
      <SiteLayout>
        <p className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted-foreground">
          {t("common.loading")}
        </p>
      </SiteLayout>
    );
  }

  if (!product) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-3xl px-4 py-16">
          <p className="text-sm text-muted-foreground">{t("common.error")}</p>
          <Button className="mt-4" asChild>
            <Link to="/menu">{t("product.back")}</Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  const unitPrice = product.price + chosen.reduce((sum, m) => sum + m.priceDelta, 0);

  const toggle = (group: ModifierGroup, modifierSlug: string, checked: boolean) => {
    setSelection((prev) => {
      const current = prev[group.slug] ?? [];
      if (group.max_select === 1) return { ...prev, [group.slug]: checked ? [modifierSlug] : [] };
      const next = checked
        ? [...current, modifierSlug].slice(0, group.max_select)
        : current.filter((s) => s !== modifierSlug);
      return { ...prev, [group.slug]: next };
    });
  };

  const missingRequired = product.groups.filter(
    (group) => group.is_required && (selection[group.slug]?.length ?? 0) < group.min_select,
  );

  const handleAdd = () => {
    if (missingRequired.length > 0) {
      toast.error(t("product.chooseSpice"));
      return;
    }
    addItem({
      productId: product.id,
      slug: product.slug,
      nameEn: product.name_en,
      nameEs: product.name_es,
      basePrice: product.price,
      quantity,
      modifiers: chosen,
      instructions: instructions.trim() || undefined,
    });
    toast.success(t("product.added"));
    void navigate({ to: "/basket" });
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link
          to="/menu"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> {t("product.back")}
        </Link>

        <div className="mt-6 flex items-start justify-between gap-4">
          <h1 className="font-display text-3xl">{pick(product.name_en, product.name_es)}</h1>
          <span className="font-display text-2xl text-primary tabular-nums">
            {formatMoney(product.price, locale)}
          </span>
        </div>
        <p className="mt-3 text-muted-foreground">
          {pick(product.description_en, product.description_es)}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {product.is_vegan && <Badge variant="outline">{t("tag.vegan")}</Badge>}
          {product.is_vegetarian && !product.is_vegan && (
            <Badge variant="outline">{t("tag.vegetarian")}</Badge>
          )}
        </div>

        {product.is_curry && (
          <p className="mt-6 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm">
            {t("product.spiceNote")}
          </p>
        )}

        <div className="mt-8 space-y-6">
          {product.groups.map((group) => (
            <section key={group.id} className="surface-card p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg">{pick(group.name_en, group.name_es)}</h2>
                {group.is_required && <Badge>{t("product.required")}</Badge>}
              </div>

              {group.max_select === 1 ? (
                <RadioGroup
                  className="mt-4 space-y-2"
                  value={selection[group.slug]?.[0] ?? ""}
                  onValueChange={(value) => toggle(group, value, true)}
                >
                  {group.modifiers.map((modifier) => (
                    <div key={modifier.id} className="flex items-center gap-3">
                      <RadioGroupItem value={modifier.slug} id={`${group.slug}-${modifier.slug}`} />
                      <Label
                        htmlFor={`${group.slug}-${modifier.slug}`}
                        className="flex flex-1 justify-between font-normal"
                      >
                        <span>{pick(modifier.name_en, modifier.name_es)}</span>
                        {modifier.price_delta > 0 && (
                          <span className="text-muted-foreground tabular-nums">
                            +{formatMoney(modifier.price_delta, locale)}
                          </span>
                        )}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <div className="mt-4 space-y-2">
                  {group.modifiers.map((modifier) => (
                    <div key={modifier.id} className="flex items-center gap-3">
                      <Checkbox
                        id={`${group.slug}-${modifier.slug}`}
                        checked={(selection[group.slug] ?? []).includes(modifier.slug)}
                        onCheckedChange={(checked) =>
                          toggle(group, modifier.slug, checked === true)
                        }
                      />
                      <Label
                        htmlFor={`${group.slug}-${modifier.slug}`}
                        className="flex flex-1 justify-between font-normal"
                      >
                        <span>{pick(modifier.name_en, modifier.name_es)}</span>
                        {modifier.price_delta > 0 && (
                          <span className="text-muted-foreground tabular-nums">
                            +{formatMoney(modifier.price_delta, locale)}
                          </span>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}

          <section className="surface-card p-5">
            <Label htmlFor="instructions">{t("product.instructions")}</Label>
            <Textarea
              id="instructions"
              className="mt-2"
              maxLength={200}
              placeholder={t("product.instructionsPlaceholder")}
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
            />
          </section>
        </div>

        <div className="sticky bottom-4 mt-8 flex items-center gap-3 rounded-xl border border-border bg-card/95 p-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              aria-label={t("product.quantity")}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              <Minus className="size-4" />
            </Button>
            <span className="w-6 text-center tabular-nums">{quantity}</span>
            <Button
              size="icon"
              variant="outline"
              aria-label={t("product.quantity")}
              onClick={() => setQuantity((q) => q + 1)}
            >
              <Plus className="size-4" />
            </Button>
          </div>
          <Button className="flex-1" size="lg" disabled={!product.is_available} onClick={handleAdd}>
            {t("product.add")} · {formatMoney(unitPrice * quantity, locale)}
          </Button>
        </div>
      </div>
    </SiteLayout>
  );
}

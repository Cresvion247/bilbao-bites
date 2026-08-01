import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/format";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import type { Product } from "@/lib/menu";

const tagKeys: Record<string, TranslationKey> = {
  bestseller: "tag.bestseller",
  recommended: "tag.recommended",
  popular: "tag.popular",
  mild: "tag.mild",
  vegetarian: "tag.vegetarian",
  vegan: "tag.vegan",
};

export function ProductCard({ product }: { product: Product }) {
  const { t, pick, locale } = useI18n();

  return (
    <Link
      to="/menu/$slug"
      params={{ slug: product.slug }}
      className="group surface-card flex flex-col gap-3 p-5 transition-transform duration-200 hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg leading-tight">
          {pick(product.name_en, product.name_es)}
        </h3>
        <span className="shrink-0 font-semibold text-primary tabular-nums">
          {formatMoney(product.price, locale)}
        </span>
      </div>

      <p className="line-clamp-3 text-sm text-muted-foreground">
        {pick(product.description_en, product.description_es)}
      </p>

      <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
        {product.tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-[11px]">
            {tagKeys[tag] ? t(tagKeys[tag]) : tag}
          </Badge>
        ))}
        {product.is_vegan && <Badge variant="outline">{t("tag.vegan")}</Badge>}
        {product.is_vegetarian && !product.is_vegan && (
          <Badge variant="outline">{t("tag.vegetarian")}</Badge>
        )}
        {!product.is_available && <Badge variant="destructive">{t("menu.unavailable")}</Badge>}
      </div>
    </Link>
  );
}

import { Link } from "@tanstack/react-router";
import { ShoppingBag, Menu as MenuIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { settingsQuery } from "@/lib/menu";
import { useAuth } from "@/hooks/useAuth";

function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  return (
    <div className="flex items-center rounded-full border border-border p-0.5 text-xs">
      {(["en", "es"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          className={
            "rounded-full px-2.5 py-1 uppercase tracking-wide transition-colors " +
            (locale === code
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground")
          }
        >
          {code}
        </button>
      ))}
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useI18n();
  const { isAdmin, isKitchen, user } = useAuth();
  const linkClass = "text-sm text-muted-foreground transition-colors hover:text-foreground";
  return (
    <>
      <Link to="/" className={linkClass} onClick={onNavigate}>
        {t("nav.home")}
      </Link>
      <Link to="/menu" className={linkClass} onClick={onNavigate}>
        {t("nav.menu")}
      </Link>
      {user && (
        <Link to="/account/orders" className={linkClass} onClick={onNavigate}>
          {t("nav.account")}
        </Link>
      )}
      {isKitchen && (
        <Link to="/kitchen" className={linkClass} onClick={onNavigate}>
          {t("nav.kitchen")}
        </Link>
      )}
      {isAdmin && (
        <Link to="/admin" className={linkClass} onClick={onNavigate}>
          {t("nav.admin")}
        </Link>
      )}
    </>
  );
}

export function Header() {
  const { t } = useI18n();
  const { count } = useCart();
  const { user, signOut } = useAuth();
  const { data: settings } = useQuery(settingsQuery());

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link to="/" className="font-display text-lg font-semibold tracking-tight">
          <span className="text-gradient-warm">{settings?.restaurant_name ?? "Bilbao Spice"}</span>
        </Link>

        <nav className="ml-6 hidden items-center gap-6 md:flex">
          <NavLinks />
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
          {user ? (
            <Button variant="ghost" size="sm" onClick={() => void signOut()}>
              {t("nav.signOut")}
            </Button>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth">{t("nav.signIn")}</Link>
            </Button>
          )}
          <Button size="sm" asChild>
            <Link to="/basket">
              <ShoppingBag className="size-4" />
              <span className="tabular-nums">{count}</span>
            </Link>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <MenuIcon className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <nav className="mt-10 flex flex-col gap-4 px-4">
                <NavLinks />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

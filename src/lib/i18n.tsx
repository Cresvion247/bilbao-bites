import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Locale = "en" | "es";

const STORAGE_KEY = "bs.locale";

/** All user-facing copy lives here — never hardcode strings in components. */
const dictionary = {
  en: {
    "nav.menu": "Menu",
    "nav.basket": "Basket",
    "nav.account": "My orders",
    "nav.signIn": "Sign in",
    "nav.signOut": "Sign out",
    "nav.kitchen": "Kitchen",
    "nav.admin": "Admin",
    "nav.home": "Home",

    "home.eyebrow": "Indian takeaway · Bilbao",
    "home.title": "Slow-cooked Indian, delivered across Bilbao",
    "home.subtitle":
      "Tandoor breads, hand-ground masalas and curries built to your spice level. Ready in 30 minutes.",
    "home.cta": "Order now",
    "home.ctaSecondary": "See the menu",
    "home.bestsellers": "Signature dishes",
    "home.bestsellersSub": "The plates Bilbao keeps coming back for.",
    "home.zones": "Delivery zones",
    "home.zonesSub": "Fast delivery across central Bilbao.",
    "home.minutes": "min",

    "menu.title": "Menu",
    "menu.subtitle": "Every curry is cooked to order.",
    "menu.all": "All",
    "menu.unavailable": "Unavailable",

    "product.add": "Add to basket",
    "product.added": "Added to basket",
    "product.instructions": "Special instructions",
    "product.instructionsPlaceholder": "No coriander, extra crispy…",
    "product.quantity": "Quantity",
    "product.required": "Required",
    "product.chooseSpice": "Please choose a spice level",
    "product.back": "Back to menu",
    "product.spiceNote":
      "Spice Level: Mild (Default). Authentic Indian spice is available on request.",

    "tag.bestseller": "Bestseller",
    "tag.recommended": "Recommended",
    "tag.popular": "Popular",
    "tag.mild": "Mild",
    "tag.vegetarian": "Vegetarian",
    "tag.vegan": "Vegan",

    "basket.title": "Your basket",
    "basket.empty": "Your basket is empty.",
    "basket.browse": "Browse the menu",
    "basket.subtotal": "Subtotal",
    "basket.delivery": "Delivery",
    "basket.tax": "Tax",
    "basket.total": "Total",
    "basket.checkout": "Go to checkout",
    "basket.remove": "Remove",
    "basket.clear": "Clear basket",

    "checkout.title": "Checkout",
    "checkout.details": "Your details",
    "checkout.name": "Full name",
    "checkout.phone": "Phone number",
    "checkout.email": "Email",
    "checkout.address": "Delivery address",
    "checkout.postcode": "Postcode",
    "checkout.zone": "Delivery zone",
    "checkout.selectZone": "Select a zone",
    "checkout.fulfilment": "Delivery or collection",
    "checkout.delivery": "Delivery",
    "checkout.collection": "Collection",
    "checkout.payment": "Payment method",
    "checkout.notes": "Order notes",
    "checkout.place": "Place order",
    "checkout.placing": "Placing order…",
    "checkout.required": "Please complete all required fields.",
    "checkout.summary": "Order summary",

    "confirm.title": "Order confirmed",
    "confirm.thanks": "Thank you — the kitchen has your order.",
    "confirm.number": "Order number",
    "confirm.status": "Status",
    "confirm.eta": "Estimated time",
    "confirm.again": "Order again",

    "auth.title": "Sign in",
    "auth.subtitle": "Track your orders and reorder in one tap.",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.signIn": "Sign in",
    "auth.signUp": "Create account",
    "auth.toggleToSignUp": "New here? Create an account",
    "auth.toggleToSignIn": "Already have an account? Sign in",
    "auth.google": "Continue with Google",
    "auth.checkEmail": "Check your email to confirm your account.",

    "orders.title": "My orders",
    "orders.empty": "No orders yet.",
    "orders.items": "items",

    "kitchen.title": "Kitchen dashboard",
    "kitchen.noOrders": "No orders right now.",
    "kitchen.order": "Order",
    "kitchen.print": "Print receipt",
    "kitchen.customerNotes": "Customer notes",

    "status.new": "New",
    "status.accepted": "Accepted",
    "status.preparing": "Preparing",
    "status.ready": "Ready",
    "status.completed": "Completed",
    "status.cancelled": "Cancelled",

    "admin.title": "Admin",
    "admin.settings": "Restaurant settings",
    "admin.menu": "Menu",
    "admin.delivery": "Delivery",
    "admin.payments": "Payments",
    "admin.users": "Users",
    "admin.save": "Save",
    "admin.saved": "Saved",
    "admin.name": "Restaurant name",
    "admin.logo": "Logo URL",
    "admin.phone": "Contact phone",
    "admin.emailField": "Contact email",
    "admin.addressField": "Address",
    "admin.taxRate": "Tax rate (0–1)",
    "admin.price": "Price",
    "admin.available": "Available",
    "admin.fee": "Delivery fee",
    "admin.eta": "Estimated minutes",
    "admin.enabled": "Enabled",
    "admin.provider": "Payment provider",
    "admin.merchantNote":
      "Merchant credentials are stored server-side as environment variables and never in the database.",
    "admin.roleUserId": "User ID",
    "admin.grant": "Grant role",
    "admin.staff": "Staff",

    "common.loading": "Loading…",
    "common.error": "Something went wrong.",
    "common.currencyNote": "Prices include VAT where applicable.",
    "footer.rights": "All rights reserved.",
    "footer.hours": "Opening hours",
    "footer.contact": "Contact",
  },
  es: {
    "nav.menu": "Carta",
    "nav.basket": "Cesta",
    "nav.account": "Mis pedidos",
    "nav.signIn": "Iniciar sesión",
    "nav.signOut": "Cerrar sesión",
    "nav.kitchen": "Cocina",
    "nav.admin": "Admin",
    "nav.home": "Inicio",

    "home.eyebrow": "Comida india para llevar · Bilbao",
    "home.title": "Cocina india a fuego lento, a domicilio en Bilbao",
    "home.subtitle":
      "Panes de tandoor, masalas molidas a mano y currys al nivel de picante que elijas. Listo en 30 minutos.",
    "home.cta": "Pedir ahora",
    "home.ctaSecondary": "Ver la carta",
    "home.bestsellers": "Platos estrella",
    "home.bestsellersSub": "Los platos por los que Bilbao vuelve.",
    "home.zones": "Zonas de reparto",
    "home.zonesSub": "Entrega rápida en el centro de Bilbao.",
    "home.minutes": "min",

    "menu.title": "Carta",
    "menu.subtitle": "Cada curry se cocina al momento.",
    "menu.all": "Todo",
    "menu.unavailable": "No disponible",

    "product.add": "Añadir a la cesta",
    "product.added": "Añadido a la cesta",
    "product.instructions": "Instrucciones especiales",
    "product.instructionsPlaceholder": "Sin cilantro, muy crujiente…",
    "product.quantity": "Cantidad",
    "product.required": "Obligatorio",
    "product.chooseSpice": "Elige un nivel de picante",
    "product.back": "Volver a la carta",
    "product.spiceNote":
      "Nivel de picante: Suave (por defecto). El picante indio auténtico está disponible bajo petición.",

    "tag.bestseller": "Más vendido",
    "tag.recommended": "Recomendado",
    "tag.popular": "Popular",
    "tag.mild": "Suave",
    "tag.vegetarian": "Vegetariano",
    "tag.vegan": "Vegano",

    "basket.title": "Tu cesta",
    "basket.empty": "Tu cesta está vacía.",
    "basket.browse": "Ver la carta",
    "basket.subtotal": "Subtotal",
    "basket.delivery": "Envío",
    "basket.tax": "Impuestos",
    "basket.total": "Total",
    "basket.checkout": "Ir al pago",
    "basket.remove": "Quitar",
    "basket.clear": "Vaciar cesta",

    "checkout.title": "Pago",
    "checkout.details": "Tus datos",
    "checkout.name": "Nombre completo",
    "checkout.phone": "Teléfono",
    "checkout.email": "Email",
    "checkout.address": "Dirección de entrega",
    "checkout.postcode": "Código postal",
    "checkout.zone": "Zona de reparto",
    "checkout.selectZone": "Elige una zona",
    "checkout.fulfilment": "Entrega o recogida",
    "checkout.delivery": "Entrega",
    "checkout.collection": "Recogida",
    "checkout.payment": "Método de pago",
    "checkout.notes": "Notas del pedido",
    "checkout.place": "Realizar pedido",
    "checkout.placing": "Procesando…",
    "checkout.required": "Completa todos los campos obligatorios.",
    "checkout.summary": "Resumen del pedido",

    "confirm.title": "Pedido confirmado",
    "confirm.thanks": "Gracias — la cocina ya tiene tu pedido.",
    "confirm.number": "Número de pedido",
    "confirm.status": "Estado",
    "confirm.eta": "Tiempo estimado",
    "confirm.again": "Pedir de nuevo",

    "auth.title": "Iniciar sesión",
    "auth.subtitle": "Sigue tus pedidos y repite con un toque.",
    "auth.email": "Email",
    "auth.password": "Contraseña",
    "auth.signIn": "Entrar",
    "auth.signUp": "Crear cuenta",
    "auth.toggleToSignUp": "¿Nuevo? Crea una cuenta",
    "auth.toggleToSignIn": "¿Ya tienes cuenta? Inicia sesión",
    "auth.google": "Continuar con Google",
    "auth.checkEmail": "Revisa tu email para confirmar la cuenta.",

    "orders.title": "Mis pedidos",
    "orders.empty": "Todavía no hay pedidos.",
    "orders.items": "artículos",

    "kitchen.title": "Panel de cocina",
    "kitchen.noOrders": "No hay pedidos ahora mismo.",
    "kitchen.order": "Pedido",
    "kitchen.print": "Imprimir ticket",
    "kitchen.customerNotes": "Notas del cliente",

    "status.new": "Nuevo",
    "status.accepted": "Aceptado",
    "status.preparing": "En preparación",
    "status.ready": "Listo",
    "status.completed": "Completado",
    "status.cancelled": "Cancelado",

    "admin.title": "Admin",
    "admin.settings": "Ajustes del restaurante",
    "admin.menu": "Carta",
    "admin.delivery": "Reparto",
    "admin.payments": "Pagos",
    "admin.users": "Usuarios",
    "admin.save": "Guardar",
    "admin.saved": "Guardado",
    "admin.name": "Nombre del restaurante",
    "admin.logo": "URL del logo",
    "admin.phone": "Teléfono de contacto",
    "admin.emailField": "Email de contacto",
    "admin.addressField": "Dirección",
    "admin.taxRate": "Tipo impositivo (0–1)",
    "admin.price": "Precio",
    "admin.available": "Disponible",
    "admin.fee": "Coste de envío",
    "admin.eta": "Minutos estimados",
    "admin.enabled": "Activo",
    "admin.provider": "Proveedor de pago",
    "admin.merchantNote":
      "Las credenciales del comercio se guardan en el servidor como variables de entorno, nunca en la base de datos.",
    "admin.roleUserId": "ID de usuario",
    "admin.grant": "Asignar rol",
    "admin.staff": "Personal",

    "common.loading": "Cargando…",
    "common.error": "Algo ha salido mal.",
    "common.currencyNote": "Precios con IVA incluido cuando corresponda.",
    "footer.rights": "Todos los derechos reservados.",
    "footer.hours": "Horario",
    "footer.contact": "Contacto",
  },
} as const;

export type TranslationKey = keyof (typeof dictionary)["en"];

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
  /** Picks the right localised column from a database row. */
  pick: (en?: string | null, es?: string | null) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "es") setLocaleState(stored);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key) => dictionary[locale][key] ?? dictionary.en[key] ?? key,
      pick: (en, es) => (locale === "es" ? (es ?? en ?? "") : (en ?? es ?? "")),
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

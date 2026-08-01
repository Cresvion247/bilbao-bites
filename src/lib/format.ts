import type { Locale } from "./i18n";

export function formatMoney(amount: number, locale: Locale = "en") {
  return new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-IE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function formatTime(iso: string, locale: Locale = "en") {
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-GB", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function round2(value: number) {
  return Math.round(value * 100) / 100;
}

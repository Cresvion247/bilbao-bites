# Bilbao Spice — Online Ordering Platform

White-label ordering platform for a premium Indian takeaway in Bilbao.
React + TypeScript + Tailwind + TanStack Router/Query + Lovable Cloud (Postgres, auth, RLS).

## Structure

```
src/lib/i18n.tsx        EN/ES translations (all user-facing copy)
src/lib/cart.tsx        Persistent basket (localStorage)
src/lib/menu.ts         Typed menu/zones/settings queries
src/lib/payments/       Payment abstraction (Stripe default)
src/lib/printing.ts     Order Printing Service + receipt builder
src/components/site/    Reusable storefront components
src/routes/             Storefront, auth, _authenticated/{kitchen,admin,account}
src/routes/api/public/  Print webhook endpoint
```

## Roles & security

- Roles live in `user_roles` (never on profiles) and are checked by the
  `has_role()` security-definer function inside RLS policies.
- Customer PII lives in `order_contacts`, a separate table. Kitchen staff can read
  `orders`/`order_items` and update status, but **no policy grants them access to
  names, phones, emails or addresses**.
- Admins manage menu, pricing, delivery, payments and role assignment.
- Grant the first admin from the backend: insert `{user_id, role:'admin'}` into `user_roles`.

## Environment variables

See `.env.example`. Backend keys are server-side only; never commit credentials.

## TODO — integrations

- [ ] Stripe: server function creating a Checkout Session on the restaurant's merchant account (`STRIPE_SECRET_KEY`).
- [ ] Redsys: HMAC-SHA256 signed redirect form provider.
- [ ] PayPal: Orders v2 provider.
- [ ] Star Micronics CloudPRNT / Sunmi Cloud Print bridges (see `src/lib/printing.ts`).
- [ ] Courier dispatch APIs for delivery zones.

## Packaging (documentation only)

Recommended: matte-black microwave-safe containers, clear lids for presentation,
and outer delivery packaging designed for a premium unboxing experience.
This has no effect on application functionality.

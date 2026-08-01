/**
 * Payment abstraction layer.
 *
 * Checkout only ever talks to `getPaymentProvider()`. Adding PayPal or Redsys
 * later means implementing `PaymentProvider` and registering it below —
 * no checkout code changes.
 *
 * Credentials are NEVER hardcoded and never live in the database. They are read
 * server-side from environment variables (see .env.example).
 */

export type PaymentIntent = {
  reference: string;
  status: "pending" | "paid" | "failed";
  /** Hosted checkout URL when the provider redirects. */
  redirectUrl?: string;
};

export type PaymentRequest = {
  orderId: string;
  amount: number;
  currency: "EUR";
  customerEmail: string;
};

export interface PaymentProvider {
  id: "stripe" | "paypal" | "redsys" | "cash";
  createPayment(request: PaymentRequest): Promise<PaymentIntent>;
}

/**
 * Stripe provider (default).
 * TODO(stripe): call a server function that creates a Stripe Checkout Session
 * with the restaurant's own merchant account so funds settle directly to them.
 * Requires STRIPE_SECRET_KEY on the server. Until then this returns a mock intent.
 */
const stripeProvider: PaymentProvider = {
  id: "stripe",
  async createPayment({ orderId, amount }) {
    return {
      reference: `mock_stripe_${orderId.slice(0, 8)}_${Math.round(amount * 100)}`,
      status: "pending",
    };
  },
};

/** Pay on delivery / collection — no external provider involved. */
const cashProvider: PaymentProvider = {
  id: "cash",
  async createPayment({ orderId }) {
    return { reference: `cash_${orderId.slice(0, 8)}`, status: "pending" };
  },
};

// TODO(paypal): implement PaymentProvider using PayPal Orders v2.
// TODO(redsys): implement PaymentProvider using Redsys HMAC-SHA256 signed forms.
const providers: Record<string, PaymentProvider> = {
  stripe: stripeProvider,
  cash: cashProvider,
};

export const availableProviders = Object.keys(providers);

export function getPaymentProvider(id: string | undefined): PaymentProvider {
  return providers[id ?? "stripe"] ?? stripeProvider;
}

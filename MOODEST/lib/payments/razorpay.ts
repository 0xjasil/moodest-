/**
 * Razorpay SDK integration for Modest Studio
 */

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayOrder {
  razorpayOrderId: string;
  razorpayKeyId: string;
  amount: number;
  currency?: string;
}

export interface RazorpayPaymentSuccess {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface PaymentVerificationRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  message?: string;
}

export function isRazorpayEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_RAZORPAY_ENABLED === "true" ||
    Boolean(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID)
  );
}

export function getRazorpayKey(): string {
  return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder";
}

export async function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (window.Razorpay) return true;

  return new Promise((resolve) => {
    const existing = document.getElementById("razorpay-checkout-script");
    if (existing) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.id = "razorpay-checkout-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout({
  orderId,
  amount,
  name = "Modest Studio",
  description = "Luxury Abaya & Modest Wears",
  prefill = {},
  onSuccess,
  onDismiss,
}: {
  orderId: string;
  amount: number;
  name?: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  onSuccess: (response: RazorpayPaymentSuccess) => void;
  onDismiss?: () => void;
}): Promise<boolean> {
  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    console.error("Failed to load Razorpay checkout script");
    return false;
  }

  const options = {
    key: getRazorpayKey(),
    amount: Math.round(amount * 100), // paise
    currency: "INR",
    name,
    description,
    image: "/brand/logo-emblem.png",
    order_id: orderId,
    prefill,
    theme: {
      color: "#5C1A24", // Deep burgundy brand color
    },
    modal: {
      ondismiss: () => {
        onDismiss?.();
      },
    },
    handler: (response: RazorpayPaymentSuccess) => {
      onSuccess(response);
    },
  };

  const instance = new window.Razorpay(options);
  instance.open();
  return true;
}


import React, { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Icon } from "@iconify/react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useOrder } from "@/context/OrderContext";
import { useAddress } from "@/context/AddressContext";
import { couponAPI } from "@/lib/api";
import { isRazorpayEnabled } from "@/lib/razorpay";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PaymentModal from "@/components/PaymentModal";
import AddressForm from "@/components/AddressForm";
import AddressList from "@/components/AddressList";
import ShippingSelector from "@/components/ShippingSelector";

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { items, total, reserveCart, clearCart, isLoading: cartLoading } = useCart();
  const { placeOrder } = useOrder();
  const {
    addresses,
    selectedAddress,
    selectedShipping,
    fetchAddresses,
    selectAddress,
    selectShipping,
  } = useAddress();

  const [showPayment, setShowPayment] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<number | string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  // Payment method selection
  const [paymentMethod, setPaymentMethod] = useState<"ONLINE" | "COD">("ONLINE");

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirect=/checkout");
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch addresses on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchAddresses();
    }
  }, [isAuthenticated, fetchAddresses]);

  // Redirect if cart is empty (only after initial auth & cart sync complete)
  useEffect(() => {
    if (!authLoading && !cartLoading && !isProcessing && items.length === 0 && !currentOrderId) {
      router.push("/cart");
    }
  }, [items, router, isProcessing, currentOrderId, authLoading, cartLoading]);

  const handleApplyCoupon = async () => {
    const trimmedCode = couponCode.trim().toUpperCase();
    if (!trimmedCode) return;
    setIsValidatingCoupon(true);
    setCouponMessage(null);
    try {
      const res: any = await couponAPI.validate(trimmedCode, total);
      const discountAmt = Number(res?.discount ?? res?.discountAmount ?? 0);
      if (res?.valid && discountAmt > 0) {
        const clampedDiscount = Math.min(discountAmt, total);
        setCouponDiscount(clampedDiscount);
        setAppliedCoupon(trimmedCode);
        setCouponMessage(`Coupon ${trimmedCode} applied: ₹${clampedDiscount.toLocaleString("en-IN")} off`);
      } else {
        setCouponDiscount(0);
        setAppliedCoupon(null);
        setCouponMessage(res?.message || "Invalid or inapplicable coupon code");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to validate coupon";
      setCouponMessage(msg);
      setCouponDiscount(0);
      setAppliedCoupon(null);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setCouponDiscount(0);
    setAppliedCoupon(null);
    setCouponMessage(null);
  };

  // Exact financial values matching backend OrdersService.placeOrder:
  // subtotal = cart subtotal; shippingAmount = subtotal > 1500 ? 0 : 99; taxAmount = 0 (GST included)
  const privilegeSavings = items.reduce(
    (sum, item) =>
      sum + Math.max(0, (item.product.originalPrice ?? item.product.price) - item.product.price) * item.qty,
    0
  );
  const totalMrp = total + privilegeSavings;
  const effectiveDiscount = appliedCoupon ? Math.min(couponDiscount, total) : 0;
  const shippingCost = total > 1500 ? 0 : 99;
  const finalTotal = Math.max(0, total + shippingCost - effectiveDiscount);
  const freeShippingRemaining = Math.max(0, 1501 - total);

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    setError(null);

    if (!selectedAddress) {
      setError("Please select a delivery address");
      setIsProcessing(false);
      return;
    }

    if (!selectedShipping) {
      setError("Please confirm a shipping method");
      setIsProcessing(false);
      return;
    }

    // Prevent duplicate order creation on payment retry
    if (currentOrderId && paymentMethod === "ONLINE") {
      setPaymentAmount(finalTotal);
      setShowPayment(true);
      setIsProcessing(false);
      return;
    }

    try {
      // Step 1: Reserve inventory via POST /api/cart/reserve
      const reservation = await reserveCart();
      const reservationId = reservation?.reservationId ?? reservation?.id;
      if (!reservationId) {
        throw new Error("Unable to reserve inventory. Please try again.");
      }

      // Step 2: Place verified order via POST /api/orders
      const order = await placeOrder({
        addressId: selectedAddress.id,
        reservationId,
        couponCode: appliedCoupon || undefined,
        paymentMethod: paymentMethod === "COD" ? "COD" : "RAZORPAY",
      });

      setCurrentOrderId(order.id);
      const authoritativeTotal = Number(order.total ?? order.totalAmount ?? finalTotal);

      if (authoritativeTotal === 0 || paymentMethod === "COD") {
        await clearCart();
        router.push(`/orders?success=true&orderId=${order.id}&method=${paymentMethod}`);
        return;
      }

      setPaymentAmount(authoritativeTotal);
      setShowPayment(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create order";
      setError(message);
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = async (paymentId: string) => {
    setShowPayment(false);
    await clearCart();
    router.push(`/orders?success=true&orderId=${currentOrderId}&paymentId=${paymentId}`);
  };

  if (!isAuthenticated && !authLoading) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Checkout | Modest Studio</title>
      </Head>
      <Header />
      <main id="main-content" className="min-h-screen bg-mb-bg py-8 md:py-10">
        <div className="mx-auto max-w-content px-4 md:px-6">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-5">
            <ol className="flex items-center gap-2 text-xs text-mb-muted" role="list">
              <li role="listitem">
                <Link href="/" className="hover:text-mb-primary transition-colors">
                  Home
                </Link>
              </li>
              <li role="listitem" aria-hidden="true" className="text-mb-dusty">/</li>
              <li role="listitem">
                <Link href="/cart" className="hover:text-mb-primary transition-colors">
                  Shopping Bag
                </Link>
              </li>
              <li role="listitem" aria-hidden="true" className="text-mb-dusty">/</li>
              <li role="listitem" className="text-mb-text font-semibold" aria-current="page">
                Checkout
              </li>
            </ol>
          </nav>

          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-mb-text mb-6">
            Checkout
          </h1>

          {error && (
            <div className="mb-6 p-4 bg-mb-error/10 border border-mb-error/30 rounded-[8px] flex items-center gap-2.5">
              <Icon icon="lucide:alert-circle" className="w-5 h-5 text-mb-error shrink-0" />
              <p className="text-sm text-mb-error font-medium">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
            {/* Left Column: Address, Shipping, Offers & Payment, Bag Review */}
            <div className="space-y-6">
              {/* Delivery Address */}
              <section className="bg-mb-surface rounded-[6px] md:rounded-[8px] p-5 sm:p-6 border border-mb-border shadow-card">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-mb-border-lite">
                  <div className="flex items-center gap-2">
                    <Icon icon="lucide:map-pin" className="w-5 h-5 text-mb-primary" />
                    <h2 className="font-serif text-lg font-semibold text-mb-text">
                      Delivery Address
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(!showAddressForm)}
                    className="inline-flex items-center gap-1 text-xs sm:text-sm text-mb-primary hover:text-mb-primary-hover font-semibold transition-colors"
                  >
                    <Icon icon={showAddressForm ? "lucide:x" : "lucide:plus"} className="w-4 h-4" />
                    <span>{showAddressForm ? "Cancel" : "Add New Address"}</span>
                  </button>
                </div>

                {showAddressForm && (
                  <div className="mb-5 p-4 bg-mb-surface rounded-[8px] border border-mb-border">
                    <AddressForm
                      onSuccess={(addr) => {
                        setShowAddressForm(false);
                        selectAddress(addr);
                        fetchAddresses();
                      }}
                      onCancel={() => setShowAddressForm(false)}
                    />
                  </div>
                )}

                {addresses.length > 0 ? (
                  <AddressList
                    onSelect={(addr) => selectAddress(addr)}
                    selectedId={selectedAddress?.id}
                  />
                ) : (
                  <div className="p-4 bg-mb-bg border border-mb-border rounded-[8px]">
                    <p className="text-sm text-mb-body">
                      No saved addresses found. Add a delivery address above to continue.
                    </p>
                  </div>
                )}
              </section>

              {/* Shipping Method */}
              {selectedAddress && (
                <section className="bg-mb-surface rounded-[6px] md:rounded-[8px] p-5 sm:p-6 border border-mb-border shadow-card">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-mb-border-lite">
                    <Icon icon="lucide:truck" className="w-5 h-5 text-mb-primary" />
                    <h2 className="font-serif text-lg font-semibold text-mb-text">
                      Shipping Method
                    </h2>
                  </div>
                  <ShippingSelector
                    pincode={selectedAddress.pincode}
                    subtotal={total}
                    onSelect={(option) => selectShipping(option)}
                  />
                </section>
              )}

              {/* Offers & Payment Method */}
              <section className="bg-mb-surface rounded-[6px] md:rounded-[8px] p-5 sm:p-6 border border-mb-border shadow-card space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-mb-border-lite">
                  <Icon icon="lucide:credit-card" className="w-5 h-5 text-mb-primary" />
                  <h2 className="font-serif text-lg font-semibold text-mb-text">
                    Offers & Payment
                  </h2>
                </div>

                {/* Coupon Code Input */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.06em] text-mb-body mb-1.5">
                    Promo / Coupon Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="ENTER CODE"
                      disabled={!!appliedCoupon}
                      className="flex-1 px-3.5 py-2.5 bg-mb-bg border border-mb-border rounded-[8px] text-sm text-mb-text placeholder:text-mb-muted uppercase tracking-wider focus:border-mb-primary focus:outline-none focus:ring-1 focus:ring-mb-accent disabled:opacity-70"
                    />
                    {appliedCoupon ? (
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="px-4 py-2.5 border border-mb-error/40 text-mb-error rounded-[8px] text-sm font-semibold hover:bg-mb-error/10 transition-colors"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={isValidatingCoupon || !couponCode.trim()}
                        className="px-5 py-2.5 bg-mb-primary hover:bg-mb-primary-hover text-mb-bg rounded-[8px] text-sm font-semibold disabled:opacity-50 transition-colors"
                      >
                        {isValidatingCoupon ? "Checking..." : "Apply"}
                      </button>
                    )}
                  </div>
                  {couponMessage && (
                    <p
                      className={`text-xs mt-1.5 font-medium ${
                        appliedCoupon ? "text-mb-success" : "text-mb-error"
                      }`}
                    >
                      {couponMessage}
                    </p>
                  )}
                </div>

                {/* Payment Method Selector */}
                <div className="pt-4 border-t border-mb-border-lite">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-mb-body mb-3">
                    Select Payment Method
                  </h3>
                  <div className="space-y-2.5">
                    <label
                      className={`flex items-start gap-3 p-4 border-2 rounded-[8px] cursor-pointer transition-all ${
                        paymentMethod === "ONLINE"
                          ? "border-mb-primary bg-mb-bg"
                          : "border-mb-border-lite hover:border-mb-accent bg-mb-surface"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="ONLINE"
                        checked={paymentMethod === "ONLINE"}
                        onChange={() => setPaymentMethod("ONLINE")}
                        className="mt-1 accent-mb-primary"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-mb-text flex items-center gap-2">
                          <Icon icon="lucide:shield-check" className="w-4 h-4 text-mb-primary" />
                          <span>
                            {isRazorpayEnabled()
                              ? "Online Payment (Razorpay)"
                              : "Online Payment (Card / UPI / NetBanking)"}
                          </span>
                        </p>
                        <p className="text-xs text-mb-muted mt-0.5">
                          {isRazorpayEnabled()
                            ? "UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, NetBanking"
                            : "Credit/Debit Cards, NetBanking, and Encrypted Payment Gateway"}
                        </p>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-3 p-4 border-2 rounded-[8px] cursor-pointer transition-all ${
                        paymentMethod === "COD"
                          ? "border-mb-primary bg-mb-bg"
                          : "border-mb-border-lite hover:border-mb-accent bg-mb-surface"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="COD"
                        checked={paymentMethod === "COD"}
                        onChange={() => setPaymentMethod("COD")}
                        className="mt-1 accent-mb-primary"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-mb-text flex items-center gap-2">
                          <Icon icon="lucide:banknote" className="w-4 h-4 text-mb-primary" />
                          <span>Cash on Delivery (COD)</span>
                        </p>
                        <p className="text-xs text-mb-muted mt-0.5">
                          Pay securely in cash upon doorstep delivery
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </section>

              {/* Bag Items Review */}
              <section className="bg-mb-surface rounded-[6px] md:rounded-[8px] p-5 sm:p-6 border border-mb-border shadow-card">
                <h2 className="font-serif text-lg font-semibold text-mb-text mb-4 pb-3 border-b border-mb-border-lite">
                  Items in Your Order ({items.reduce((sum, i) => sum + i.qty, 0)})
                </h2>
                <div className="divide-y divide-mb-border-lite">
                  {items.map((item) => (
                    <div key={item.product.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center gap-4">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-16 h-16 object-contain rounded-[6px] bg-mb-bg border border-mb-border-lite p-1 shrink-0"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.src.includes("/abaya/products/abaya-1.jpg")) {
                            target.src = "/abaya/products/abaya-1.jpg";
                          }
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mb-muted">
                          {item.product.brand}
                        </p>
                        <p className="font-serif text-sm sm:text-base font-semibold text-mb-text truncate">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-mb-body mt-0.5">
                          Qty: {item.qty} × ₹{item.product.price.toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-mb-text">
                          ₹{(item.product.price * item.qty).toLocaleString("en-IN")}
                        </p>
                        {item.product.originalPrice && item.product.originalPrice > item.product.price && (
                          <p className="text-xs text-mb-muted line-through">
                            ₹{(item.product.originalPrice * item.qty).toLocaleString("en-IN")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right Sidebar: Accurate Price Breakdown & Place Order */}
            <aside aria-label="Order summary" className="lg:sticky lg:top-[120px]">
              <div className="bg-mb-surface rounded-[6px] md:rounded-[8px] p-6 border border-mb-border shadow-card">
                <h2 className="font-serif text-lg font-semibold text-mb-text mb-4 pb-3 border-b border-mb-border-lite">
                  Order Summary
                </h2>

                {/* Readiness Checklist */}
                <div className="space-y-2 mb-5 p-3.5 bg-mb-bg border border-mb-border-lite rounded-[8px]">
                  <div className={`flex items-center gap-2 text-xs font-medium ${selectedAddress ? "text-mb-success" : "text-mb-muted"}`}>
                    <Icon icon={selectedAddress ? "lucide:check-circle-2" : "lucide:circle"} className="w-4 h-4 shrink-0" />
                    <span>{selectedAddress ? `Delivering to ${selectedAddress.city}, ${selectedAddress.pincode}` : "Select delivery address"}</span>
                  </div>
                  <div className={`flex items-center gap-2 text-xs font-medium ${selectedShipping ? "text-mb-success" : "text-mb-muted"}`}>
                    <Icon icon={selectedShipping ? "lucide:check-circle-2" : "lucide:circle"} className="w-4 h-4 shrink-0" />
                    <span>{selectedShipping ? `${selectedShipping.name} selected` : "Select shipping method"}</span>
                  </div>
                </div>

                {/* Accurate Price Breakdown */}
                <dl className="space-y-2.5 text-sm text-mb-body">
                  {privilegeSavings > 0 && (
                    <>
                      <div className="flex justify-between">
                        <dt>Total MRP</dt>
                        <dd className="font-medium text-mb-text">₹{totalMrp.toLocaleString("en-IN")}</dd>
                      </div>
                      <div className="flex justify-between text-mb-success font-semibold">
                        <dt>Privilege Savings</dt>
                        <dd>−₹{privilegeSavings.toLocaleString("en-IN")}</dd>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <dt>Bag Subtotal</dt>
                    <dd className="font-medium text-mb-text">₹{total.toLocaleString("en-IN")}</dd>
                  </div>
                  {effectiveDiscount > 0 && (
                    <div className="flex justify-between text-mb-success font-semibold">
                      <dt>Coupon ({appliedCoupon})</dt>
                      <dd>−₹{effectiveDiscount.toLocaleString("en-IN")}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt>Shipping</dt>
                    <dd className={shippingCost === 0 ? "text-mb-success font-semibold" : "font-medium text-mb-text"}>
                      {shippingCost === 0 ? "Free" : `₹${shippingCost.toLocaleString("en-IN")}`}
                    </dd>
                  </div>
                  <div className="flex justify-between text-xs text-mb-muted">
                    <dt>Taxes (GST)</dt>
                    <dd>Included</dd>
                  </div>
                  <div className="flex justify-between items-baseline pt-3.5 border-t border-mb-border-lite">
                    <dt className="font-semibold text-base text-mb-text">Total Payable</dt>
                    <dd className="font-bold text-xl text-mb-primary">
                      ₹{finalTotal.toLocaleString("en-IN")}
                    </dd>
                  </div>
                </dl>

                {total > 0 && shippingCost > 0 && (
                  <p className="mt-4 text-xs text-mb-body bg-mb-bg border border-mb-border-lite rounded-[8px] px-3 py-2">
                    Add <span className="font-semibold text-mb-primary">₹{freeShippingRemaining.toLocaleString("en-IN")}</span> more for complimentary shipping (orders above ₹1,500).
                  </p>
                )}

                {(privilegeSavings + effectiveDiscount) > 0 && (
                  <p className="mt-3 text-xs text-mb-success font-semibold bg-mb-bg border border-mb-border-lite rounded-[8px] px-3 py-2">
                    Total savings on this order: ₹{(privilegeSavings + effectiveDiscount).toLocaleString("en-IN")}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={isProcessing || cartLoading || !selectedAddress || !selectedShipping || items.length === 0 || total <= 0}
                  className="mt-5 w-full py-3.5 bg-mb-primary hover:bg-mb-primary-hover text-mb-bg font-semibold text-sm rounded-[10px] shadow-sm disabled:opacity-50 transition-all mb-2.5"
                >
                  {cartLoading
                    ? "Syncing Bag & Prices..."
                    : isProcessing
                    ? "Reserving & Creating Order..."
                    : paymentMethod === "COD"
                    ? `Place Order (COD ₹${finalTotal.toLocaleString("en-IN")})`
                    : `Proceed to Pay ₹${finalTotal.toLocaleString("en-IN")}`}
                </button>

                <Link
                  href="/cart"
                  className="block text-center py-2.5 border border-mb-border text-mb-text text-sm font-semibold rounded-[10px] hover:bg-mb-bg transition-colors"
                >
                  Back to Shopping Bag
                </Link>

                {/* Trust Guarantees */}
                <div className="mt-6 pt-5 border-t border-mb-border-lite space-y-2 text-xs text-mb-muted">
                  <div className="flex items-center gap-2">
                    <Icon icon="lucide:check" className="w-4 h-4 text-mb-success shrink-0" />
                    <span>Real-time inventory reservation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon icon="lucide:check" className="w-4 h-4 text-mb-success shrink-0" />
                    <span>Authentic Modest Studio craftsmanship</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon icon="lucide:check" className="w-4 h-4 text-mb-success shrink-0" />
                    <span>Easy returns & live order tracking</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>

        {/* Payment Modal */}
        {showPayment && currentOrderId && (
          <PaymentModal
            amount={paymentAmount}
            type="order"
            orderId={currentOrderId}
            onSuccess={handlePaymentSuccess}
            onClose={() => {
              setShowPayment(false);
              setIsProcessing(false);
            }}
          />
        )}
      </main>
      <Footer />
    </>
  );
}

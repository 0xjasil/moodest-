import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useOrder } from "@/context/OrderContext";
import { useAddress } from "@/context/AddressContext";
import { useWallet } from "@/context/WalletContext";
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
  const { items, total, reserveCart, clearCart } = useCart();
  const { placeOrder } = useOrder();
  const { balance: walletBalance } = useWallet();
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
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  // Wallet usage state
  const [applyWallet, setApplyWallet] = useState(false);

  // Payment method selection
  const [paymentMethod, setPaymentMethod] = useState<'ONLINE' | 'COD'>('ONLINE');

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch addresses on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchAddresses();
    }
  }, [isAuthenticated, fetchAddresses]);

  // Redirect if cart is empty
  useEffect(() => {
    if (!isProcessing && items.length === 0 && !currentOrderId) {
      router.push("/cart");
    }
  }, [items, router, isProcessing, currentOrderId]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsValidatingCoupon(true);
    setCouponMessage(null);
    try {
      const res = await couponAPI.validate(couponCode.trim().toUpperCase(), total);
      if (res.valid) {
        setCouponDiscount(res.discount);
        setAppliedCoupon(couponCode.trim().toUpperCase());
        setCouponMessage(`Coupon applied: ₹${res.discount} discount`);
      } else {
        setCouponDiscount(0);
        setAppliedCoupon(null);
        setCouponMessage("Invalid coupon code");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to apply coupon";
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

  const shippingCost = selectedShipping?.cost || 0;
  const grossTotal = Math.max(0, total - couponDiscount) + shippingCost;
  const walletDeduction = applyWallet ? Math.min(walletBalance, grossTotal) : 0;
  const finalTotal = Math.max(0, grossTotal - walletDeduction);

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    setError(null);

    // Validate address and shipping
    if (!selectedAddress) {
      setError("Please select a delivery address");
      setIsProcessing(false);
      return;
    }

    if (!selectedShipping) {
      setError("Please select a shipping method");
      setIsProcessing(false);
      return;
    }

    // Prevent duplicate order creation on payment retry: if order already placed and reopening modal
    if (currentOrderId && paymentMethod === 'ONLINE') {
      setPaymentAmount(finalTotal);
      setShowPayment(true);
      setIsProcessing(false);
      return;
    }

    try {
      // Step 1: Call verified reservation endpoint POST /api/cart/reserve to lock stock & obtain reservationId
      const reservation = await reserveCart();
      if (!reservation || !reservation.reservationId) {
        throw new Error("Unable to reserve inventory. Please try again.");
      }

      // Step 2: Call verified order placement endpoint POST /api/orders
      const order = await placeOrder({
        addressId: selectedAddress.id,
        reservationId: reservation.reservationId,
        couponCode: appliedCoupon || undefined,
        walletAmountUsed: applyWallet && walletDeduction > 0 ? walletDeduction : undefined,
      });

      setCurrentOrderId(order.id);

      // If final amount is zero (e.g. 100% wallet or full discount) OR payment method is COD
      if (order.total === 0 || finalTotal === 0 || paymentMethod === 'COD') {
        await clearCart();
        router.push(`/orders?success=true&orderId=${order.id}&method=${paymentMethod}`);
        return;
      }

      setPaymentAmount(order.total || finalTotal);
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
    // Redirect to orders page with success banner
    router.push(`/orders?success=true&orderId=${currentOrderId}&paymentId=${paymentId}`);
  };

  if (!isAuthenticated && !authLoading) {
    return null;
  }

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-[#F4F4F4]">
        <div className="mx-auto max-w-content px-4 md:px-6 py-12">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-1.5 text-xs text-[#595E63]" role="list">
              <li role="listitem">
                <Link href="/" className="hover:text-[#E80071] hover:underline">
                  Home
                </Link>
              </li>
              <li role="listitem" aria-hidden="true">/</li>
              <li role="listitem">
                <Link href="/cart" className="hover:text-[#E80071] hover:underline">
                  Cart
                </Link>
              </li>
              <li role="listitem" aria-hidden="true">/</li>
              <li role="listitem" aria-current="page">
                Checkout
              </li>
            </ol>
          </nav>

          <h1 className="text-2xl font-semibold text-[#000000] mb-6">Checkout</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="md:col-span-2">
              {/* Delivery Address */}
              <div className="bg-white rounded-lg p-6 mb-6 border border-[#CDD3D8]">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-[#000000]">Delivery Address</h2>
                  <button
                    onClick={() => setShowAddressForm(!showAddressForm)}
                    className="text-sm text-[#E80071] hover:underline font-medium"
                  >
                    {showAddressForm ? "Cancel" : "+ Add New"}
                  </button>
                </div>

                {showAddressForm && (
                  <div className="mb-6 p-4 bg-[#F4F4F4] rounded-lg border border-[#CDD3D8]">
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
                  <div className="p-4 bg-[#FDE8F0] border border-[#E80071] rounded-lg">
                    <p className="text-sm text-[#E80071]">
                      No addresses available. Please add a delivery address.
                    </p>
                  </div>
                )}
              </div>

              {/* Shipping Method */}
              {selectedAddress && (
                <div className="bg-white rounded-lg p-6 mb-6 border border-[#CDD3D8]">
                  <h2 className="text-lg font-semibold text-[#000000] mb-4">Shipping Method</h2>
                  <ShippingSelector
                    pincode={selectedAddress.pincode}
                    onSelect={(option) => selectShipping(option)}
                  />
                </div>
              )}

              {/* Coupons & Wallet Section */}
              <div className="bg-white rounded-lg p-6 mb-6 border border-[#CDD3D8] space-y-4">
                <h2 className="text-lg font-semibold text-[#000000]">Offers & Wallet</h2>
                
                {/* Coupon Code Input */}
                <div>
                  <label className="block text-xs font-semibold text-[#595E63] mb-1">Coupon Code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="ENTER CODE"
                      disabled={!!appliedCoupon}
                      className="flex-1 px-3 py-2 border border-[#CDD3D8] rounded-md text-sm uppercase tracking-wider"
                    />
                    {appliedCoupon ? (
                      <button
                        onClick={handleRemoveCoupon}
                        className="px-4 py-2 border border-red-300 text-red-600 rounded-md text-sm font-medium hover:bg-red-50"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        onClick={handleApplyCoupon}
                        disabled={isValidatingCoupon || !couponCode.trim()}
                        className="px-4 py-2 bg-[#000000] text-white rounded-md text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
                      >
                        {isValidatingCoupon ? "Checking..." : "Apply"}
                      </button>
                    )}
                  </div>
                  {couponMessage && (
                    <p className={`text-xs mt-1.5 ${appliedCoupon ? "text-green-600 font-medium" : "text-red-500"}`}>
                      {couponMessage}
                    </p>
                  )}
                </div>

                {/* Wallet Balance Checkbox */}
                {walletBalance > 0 && (
                  <div className="pt-3 border-t border-[#CDD3D8] flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-[#000000]">
                      <input
                        type="checkbox"
                        checked={applyWallet}
                        onChange={(e) => setApplyWallet(e.target.checked)}
                        className="w-4 h-4 text-[#E80071] rounded border-[#CDD3D8]"
                      />
                      <span>Use Modest Studio Wallet Balance (Available: ₹{walletBalance.toLocaleString("en-IN")})</span>
                    </label>
                    {applyWallet && walletDeduction > 0 && (
                      <span className="text-sm font-semibold text-green-600">-₹{walletDeduction.toLocaleString("en-IN")}</span>
                    )}
                  </div>
                )}

                {/* Payment Method Selector */}
                <div className="pt-4 border-t border-[#CDD3D8]">
                  <h3 className="text-sm font-semibold text-[#000000] mb-3">Payment Method</h3>
                  <div className="space-y-2">
                    <label
                      className={`flex items-start gap-3 p-3.5 border-2 rounded-lg cursor-pointer transition-all ${
                        paymentMethod === 'ONLINE'
                          ? 'border-[#E80071] bg-[#FFF0F6]'
                          : 'border-[#CDD3D8] hover:border-[#E80071] bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="ONLINE"
                        checked={paymentMethod === 'ONLINE'}
                        onChange={() => setPaymentMethod('ONLINE')}
                        className="mt-0.5 text-[#E80071]"
                      />
                      <div>
                        <p className="font-medium text-sm text-[#000000]">
                          {isRazorpayEnabled() ? "Online Payment (Razorpay)" : "Online Payment (Card / Digital Pay)"}
                        </p>
                        <p className="text-xs text-[#595E63] mt-0.5">
                          {isRazorpayEnabled()
                            ? "UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, NetBanking"
                            : "Credit/Debit Cards, NetBanking, and Secure Gateway"}
                        </p>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-3 p-3.5 border-2 rounded-lg cursor-pointer transition-all ${
                        paymentMethod === 'COD'
                          ? 'border-[#E80071] bg-[#FFF0F6]'
                          : 'border-[#CDD3D8] hover:border-[#E80071] bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="COD"
                        checked={paymentMethod === 'COD'}
                        onChange={() => setPaymentMethod('COD')}
                        className="mt-0.5 text-[#E80071]"
                      />
                      <div>
                        <p className="font-medium text-sm text-[#000000]">Cash on Delivery (COD)</p>
                        <p className="text-xs text-[#595E63] mt-0.5">Pay in cash upon delivery at your doorstep</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-white rounded-lg p-6 border border-[#CDD3D8]">
                <h2 className="text-lg font-semibold text-[#000000] mb-4">Order Summary</h2>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex justify-between items-center pb-3 border-b border-[#CDD3D8]">
                      <div>
                        <p className="font-medium text-[#000000]">{item.product.name}</p>
                        <p className="text-sm text-[#595E63]">Qty: {item.qty}</p>
                      </div>
                      <p className="font-semibold text-[#000000]">
                        ₹{(item.product.price * item.qty).toLocaleString("en-IN")}
                      </p>
                    </div>
                  ))}

                  <div className="pt-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[#595E63]">Subtotal</span>
                      <span className="text-[#000000]">₹{total.toLocaleString("en-IN")}</span>
                    </div>
                    {couponDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Coupon Discount ({appliedCoupon})</span>
                        <span>-₹{couponDiscount.toLocaleString("en-IN")}</span>
                      </div>
                    )}
                    {selectedShipping && (
                      <div className="flex justify-between">
                        <span className="text-[#595E63]">Shipping ({selectedShipping.name})</span>
                        <span className="text-[#000000]">₹{shippingCost.toLocaleString("en-IN")}</span>
                      </div>
                    )}
                    {applyWallet && walletDeduction > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Wallet Credit Applied</span>
                        <span>-₹{walletDeduction.toLocaleString("en-IN")}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-3 border-t border-[#CDD3D8]">
                      <span className="font-semibold text-[#000000]">Total</span>
                      <span className="font-bold text-[#E80071] text-lg">
                        ₹{finalTotal.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div>
              <div className="bg-white rounded-lg p-6 border border-[#CDD3D8] sticky top-20">
                <h3 className="text-lg font-semibold text-[#000000] mb-4">Order Details</h3>
                
                {/* Status Check */}
                <div className="space-y-2 mb-6 p-3 bg-[#F4F4F4] rounded-lg">
                  <div className={`flex items-center gap-2 ${selectedAddress ? 'text-green-600' : 'text-[#595E63]'}`}>
                    <span>{selectedAddress ? '✓' : '○'}</span>
                    <span className="text-sm font-medium">Address Selected</span>
                  </div>
                  <div className={`flex items-center gap-2 ${selectedShipping ? 'text-green-600' : 'text-[#595E63]'}`}>
                    <span>{selectedShipping ? '✓' : '○'}</span>
                    <span className="text-sm font-medium">Shipping Selected</span>
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing || !selectedAddress || !selectedShipping || items.length === 0}
                  className="w-full py-3 bg-[#E80071] text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors mb-2"
                >
                  {isProcessing
                    ? "Reserving & Creating..."
                    : paymentMethod === 'COD'
                    ? `Place Order (COD ₹${finalTotal.toLocaleString("en-IN")})`
                    : `Proceed to Pay ₹${finalTotal.toLocaleString("en-IN")}`}
                </button>

                <Link
                  href="/cart"
                  className="block text-center py-2.5 border border-[#CDD3D8] text-[#000000] font-medium rounded-lg hover:bg-[#F4F4F4] transition-colors"
                >
                  Continue Shopping
                </Link>

                {/* Info */}
                <div className="mt-6 pt-6 border-t border-[#CDD3D8] space-y-2 text-xs text-[#595E63]">
                  <div className="flex items-start gap-2">
                    <span>✓</span>
                    <span>High-concurrency inventory reservation</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span>✓</span>
                    <span>Secure checkout powered by NestJS API</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span>✓</span>
                    <span>Easy returns & order tracking</span>
                  </div>
                </div>
              </div>
            </div>
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

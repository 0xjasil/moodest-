import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { useOrder } from "@/context/OrderContext";
import { orderAPI } from "@/lib/api";
import { apiFetch } from "@/lib/apiFetch";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { orders, isLoading, error, fetchOrders, cancelOrder } = useOrder();

  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [returningId, setReturningId] = useState<number | null>(null);
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { success, orderId } = router.query;

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch orders on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, fetchOrders]);

  // If orderId is in query params, select it
  useEffect(() => {
    if (orderId) {
      const parsed = parseInt(orderId as string, 10);
      if (!isNaN(parsed)) {
        setSelectedOrderId(parsed);
      }
    }
  }, [orderId]);

  const handleCancelOrder = async (orderIdToCancel: number) => {
    if (!confirm("Are you sure you want to cancel this order?")) {
      return;
    }

    try {
      setCancelingId(orderIdToCancel);
      setActionMessage(null);
      await cancelOrder(orderIdToCancel);
      setActionMessage({ type: "success", text: "Order cancelled successfully." });
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to cancel order." });
    } finally {
      setCancelingId(null);
    }
  };

  const handleRequestReturn = async (orderIdToReturn: number) => {
    if (!confirm("Are you sure you want to request a return for this delivered order?")) {
      return;
    }
    setReturningId(orderIdToReturn);
    setActionMessage(null);
    try {
      await orderAPI.requestReturn(orderIdToReturn);
      await fetchOrders();
      setActionMessage({ type: "success", text: "Return request submitted successfully. Our team will review and process your return." });
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to submit return request." });
    } finally {
      setReturningId(null);
    }
  };

  const handleDownloadInvoice = async (orderIdToDownload: number) => {
    setIsDownloadingInvoice(true);
    setActionMessage(null);
    try {
      const res = await apiFetch(`/api/invoices/${orderIdToDownload}`);
      if (!res.ok) {
        throw new Error("Invoice generation is not available for this order.");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-order-${orderIdToDownload}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      setActionMessage({ type: "success", text: "Invoice downloaded successfully!" });
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to download invoice." });
    } finally {
      setIsDownloadingInvoice(false);
    }
  };

  if (!isAuthenticated && !authLoading) {
    return null;
  }

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-white">
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
              <li role="listitem" aria-current="page">
                My Orders
              </li>
            </ol>
          </nav>

          {/* Success Notification Banner */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-green-800">
                  🎉 Thank you for your order!
                </p>
                <p className="text-xs text-green-700 mt-0.5">
                  Your order {orderId ? `#${orderId}` : ""} has been placed and is being prepared with luxury care.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {actionMessage && (
            <div className={`mb-4 p-3 rounded-lg border flex items-center justify-between ${
              actionMessage.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}>
              <p className="text-sm font-medium">{actionMessage.text}</p>
              <button onClick={() => setActionMessage(null)} className="text-xs hover:underline ml-4">✕</button>
            </div>
          )}

          <h1 className="text-2xl font-semibold text-[#000000] mb-6">My Orders</h1>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-[#595E63]">Loading orders from NestJS backend...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-[#F4F4F4] rounded-lg p-12 text-center border border-[#CDD3D8]">
              <p className="text-[#595E63] mb-4">You haven&apos;t placed any orders yet</p>
              <Link
                href="/"
                className="inline-block px-6 py-2.5 bg-[#E80071] text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {/* Orders List */}
              <div className="md:col-span-2">
                <div className="space-y-4">
                  {orders.map((order) => {
                    const orderTotal = order.totalAmount ?? order.total ?? 0;
                    return (
                      <div
                        key={order.id}
                        className={`border rounded-lg p-4 transition-all cursor-pointer ${
                          selectedOrderId === order.id
                            ? "border-[#E80071] bg-pink-50/20 shadow-sm"
                            : "border-[#CDD3D8] hover:shadow-md"
                        }`}
                        onClick={() => setSelectedOrderId(order.id)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-[#000000]">Order #{order.id}</h3>
                            <p className="text-xs text-[#595E63] mt-0.5">
                              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              STATUS_COLORS[order.status] || "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-3 py-3 border-y border-[#CDD3D8]">
                          <div>
                            <p className="text-xs text-[#595E63]">Items</p>
                            <p className="font-semibold text-[#000000]">{order.items?.length || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-[#595E63]">Total Amount</p>
                            <p className="font-semibold text-[#E80071]">
                              ₹{orderTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>

                        {order.couponCode && (
                          <div className="text-xs text-green-700 font-medium">
                            Coupon Applied: {order.couponCode}
                          </div>
                        )}

                        {order.shippingAddress && (
                          <div className="text-xs text-[#595E63] mt-1 truncate">
                            <span className="font-medium">Deliver to:</span> {order.shippingAddress}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Details Sidebar */}
              <div>
                {selectedOrder ? (
                  <div className="bg-[#F4F4F4] rounded-lg p-6 border border-[#CDD3D8] sticky top-20">
                    <h3 className="text-lg font-semibold text-[#000000] mb-4">Order Details</h3>

                    {/* Order Number & Date */}
                    <div className="mb-4 pb-4 border-b border-[#CDD3D8]">
                      <p className="text-sm text-[#595E63]">Order Number</p>
                      <p className="font-semibold text-[#000000]">#{selectedOrder.id}</p>
                      <p className="text-xs text-[#595E63] mt-2">
                        Placed on {new Date(selectedOrder.createdAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="mb-4 pb-4 border-b border-[#CDD3D8]">
                      <p className="text-sm text-[#595E63]">Status</p>
                      <div className="mt-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            STATUS_COLORS[selectedOrder.status] || "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {selectedOrder.status}
                        </span>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="mb-4 pb-4 border-b border-[#CDD3D8]">
                      <p className="text-sm font-semibold text-[#000000] mb-2">
                        Items ({selectedOrder.items?.length || 0})
                      </p>
                      <div className="space-y-2">
                        {(selectedOrder.items || []).map((item) => (
                          <div key={item.id} className="text-xs flex justify-between">
                            <div>
                              <p className="text-[#000000] font-medium">Variant #{item.variantId}</p>
                              <p className="text-[#595E63]">Qty: {item.quantity}</p>
                            </div>
                            <p className="text-[#595E63] font-semibold">
                              ₹{(item.price * item.quantity).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="mb-4 pb-4 border-b border-[#CDD3D8]">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[#595E63]">Subtotal</span>
                        <span className="font-medium text-[#000000]">
                          ₹{(selectedOrder.subtotal || selectedOrder.total || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      {selectedOrder.discount > 0 && (
                        <div className="flex justify-between text-sm text-green-600 mb-1">
                          <span>Discount</span>
                          <span>-₹{selectedOrder.discount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      {selectedOrder.walletAmountUsed ? (
                        <div className="flex justify-between text-sm text-green-600 mb-1">
                          <span>Wallet Used</span>
                          <span>-₹{selectedOrder.walletAmountUsed.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                        </div>
                      ) : null}
                      <div className="flex justify-between text-sm font-bold text-[#E80071] pt-2 border-t border-[#CDD3D8]">
                        <span>Total</span>
                        <span>₹{(selectedOrder.totalAmount ?? selectedOrder.total ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>

                    {/* Payment Info */}
                    <div className="mb-4 pb-4 border-b border-[#CDD3D8]">
                      <p className="text-sm text-[#595E63]">Payment Status</p>
                      <p className={`text-xs mt-1 font-semibold ${
                        selectedOrder.paymentStatus === "PAID"
                          ? "text-green-600"
                          : "text-yellow-600"
                      }`}>
                        {selectedOrder.paymentStatus === "PAID"
                          ? "✓ Paid"
                          : `Status: ${selectedOrder.paymentStatus || "PENDING"}`}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                      {/* Download Invoice (all placed orders) */}
                      <button
                        type="button"
                        onClick={() => handleDownloadInvoice(selectedOrder.id)}
                        disabled={isDownloadingInvoice}
                        className="w-full py-2 px-3 text-sm font-medium text-[#595E63] border border-[#CDD3D8] rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                      >
                        {isDownloadingInvoice ? "Generating PDF..." : "Download Invoice (PDF)"}
                      </button>

                      {/* Request Return (for DELIVERED orders) */}
                      {selectedOrder.status === "DELIVERED" && (
                        <button
                          type="button"
                          onClick={() => handleRequestReturn(selectedOrder.id)}
                          disabled={returningId === selectedOrder.id}
                          className="w-full py-2 px-3 text-sm font-medium text-amber-800 bg-amber-50 border border-amber-300 rounded-lg hover:bg-amber-100 disabled:opacity-50 transition-colors"
                        >
                          {returningId === selectedOrder.id ? "Submitting Return..." : "Request Return"}
                        </button>
                      )}

                      {/* Cancel Order (for non-delivered, non-cancelled orders) */}
                      {selectedOrder.status !== "DELIVERED" && selectedOrder.status !== "CANCELLED" && (
                        <button
                          type="button"
                          onClick={() => handleCancelOrder(selectedOrder.id)}
                          disabled={cancelingId === selectedOrder.id}
                          className="w-full py-2 px-3 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                        >
                          {cancelingId === selectedOrder.id ? "Cancelling..." : "Cancel Order"}
                        </button>
                      )}
                      <Link
                        href="/"
                        className="block w-full py-2 px-3 text-sm font-medium text-center text-[#E80071] border border-[#E80071] rounded-lg hover:bg-[#FDE8F0] transition-colors"
                      >
                        Continue Shopping
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#F4F4F4] rounded-lg p-6 border border-[#CDD3D8] text-center sticky top-20">
                    <p className="text-sm text-[#595E63]">Select an order to view details</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

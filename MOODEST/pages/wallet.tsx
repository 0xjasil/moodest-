import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function WalletPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { wallet, transactions, isLoading, error, fetchWallet, clearError } = useWallet();

  const [showAddMoneyInfo, setShowAddMoneyInfo] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Fetch wallet on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchWallet();
    }
  }, [isAuthenticated, fetchWallet]);



  if (!isAuthenticated) {
    return null; // Redirect is in progress
  }

  const displayError = error;

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
              <li role="listitem">
                <Link href="/profile" className="hover:text-[#E80071] hover:underline">
                  Profile
                </Link>
              </li>
              <li role="listitem" aria-hidden="true">/</li>
              <li role="listitem" aria-current="page">
                Wallet
              </li>
            </ol>
          </nav>

          {displayError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{displayError}</p>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="md:col-span-2">
              <h1 className="text-2xl font-semibold text-[#000000] mb-6">My Wallet</h1>

              {/* Balance Card */}
              <div className="bg-gradient-to-r from-[#E80071] to-[#d20060] text-white rounded-lg p-6 mb-6 shadow-md">
                <p className="text-sm opacity-90 mb-2">Available Balance</p>
                <h2 className="text-4xl font-bold mb-4">
                  ₹{isLoading ? "..." : (wallet?.balance ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </h2>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAddMoneyInfo(!showAddMoneyInfo)}
                    className="px-4 py-2 bg-white text-[#E80071] font-medium rounded-lg hover:bg-opacity-90 transition-colors text-xs sm:text-sm"
                  >
                    {showAddMoneyInfo ? "Hide Top-Up Info" : "How to Add Money"}
                  </button>
                  <Link
                    href="/"
                    className="px-4 py-2 border border-white rounded-lg font-medium hover:bg-white hover:text-[#E80071] transition-colors text-xs sm:text-sm"
                  >
                    Shop Now
                  </Link>
                </div>
              </div>

              {/* Add Money Policy Notice */}
              {showAddMoneyInfo && (
                <div className="bg-amber-50 rounded-lg p-5 mb-6 border border-amber-200">
                  <h3 className="text-sm font-semibold text-amber-900 mb-1.5 flex items-center gap-1.5">
                    ℹ️ Direct Wallet Deposits are Not Supported
                  </h3>
                  <p className="text-xs text-amber-800 leading-relaxed mb-3">
                    Per Moreylla payment gateway security rules, wallet top-ups cannot be made directly via card or UPI.
                    Wallet credits are automatically issued for:
                  </p>
                  <ul className="text-xs text-amber-800 list-disc list-inside space-y-1 mb-3">
                    <li>Instant refunds for cancelled or returned orders</li>
                    <li>Promotional brand cashbacks and customer loyalty rewards</li>
                    <li>Goodwill customer-care reimbursements credited by administrators</li>
                  </ul>
                  <p className="text-xs text-amber-700">
                    Your available balance is automatically redeemable as a deduction on any future purchase during checkout.
                  </p>
                </div>
              )}

              {/* Wallet Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-[#F4F4F4] rounded-lg p-4 border border-[#CDD3D8]">
                  <p className="text-xs font-medium text-[#595E63] uppercase tracking-wide">Total Spent</p>
                  <p className="text-xl font-bold text-[#000000] mt-1">
                    ₹{isLoading ? "..." : (wallet?.totalSpent ?? 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="bg-[#F4F4F4] rounded-lg p-4 border border-[#CDD3D8]">
                  <p className="text-xs font-medium text-[#595E63] uppercase tracking-wide">Total Earned</p>
                  <p className="text-xl font-bold text-[#E80071] mt-1">
                    ₹{isLoading ? "..." : (wallet?.totalEarned ?? 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="bg-[#F4F4F4] rounded-lg p-4 border border-[#CDD3D8]">
                  <p className="text-xs font-medium text-[#595E63] uppercase tracking-wide">Transactions</p>
                  <p className="text-xl font-bold text-[#000000] mt-1">{transactions.length}</p>
                </div>
              </div>

              {/* Transaction History */}
              <div>
                <h3 className="text-lg font-semibold text-[#000000] mb-4">Transaction History</h3>
                {transactions.length === 0 ? (
                  <div className="bg-[#F4F4F4] rounded-lg p-8 text-center border border-[#CDD3D8]">
                    <p className="text-[#595E63]">No transactions yet</p>
                  </div>
                ) : (
                  <div className="space-y-2 border border-[#CDD3D8] rounded-lg overflow-hidden">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-4 border-b border-[#CDD3D8] last:border-b-0 hover:bg-[#F4F4F4] transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-[#000000]">{tx.description}</p>
                          <p className="text-xs text-[#595E63] mt-0.5">
                            {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-semibold ${
                              tx.type === "CREDIT" ? "text-green-600" : "text-[#000000]"
                            }`}
                          >
                            {tx.type === "CREDIT" ? "+" : "-"}₹{Math.abs(tx.amount).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div>
              <div className="bg-[#F4F4F4] rounded-lg p-6 border border-[#CDD3D8] sticky top-20">
                <h3 className="text-lg font-semibold text-[#000000] mb-4">Quick Links</h3>
                <nav className="space-y-2">
                  <Link
                    href="/orders"
                    className="block px-3 py-2.5 text-sm font-medium text-[#000000] hover:bg-white hover:text-[#E80071] rounded-lg transition-colors"
                  >
                    My Orders
                  </Link>
                  <Link
                    href="/profile"
                    className="block px-3 py-2.5 text-sm font-medium text-[#000000] hover:bg-white hover:text-[#E80071] rounded-lg transition-colors"
                  >
                    Profile Settings
                  </Link>
                  <Link
                    href="/wishlist"
                    className="block px-3 py-2.5 text-sm font-medium text-[#000000] hover:bg-white hover:text-[#E80071] rounded-lg transition-colors"
                  >
                    My Wishlist
                  </Link>
                  <Link
                    href="/cart"
                    className="block px-3 py-2.5 text-sm font-medium text-[#000000] hover:bg-white hover:text-[#E80071] rounded-lg transition-colors"
                  >
                    Shopping Cart
                  </Link>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

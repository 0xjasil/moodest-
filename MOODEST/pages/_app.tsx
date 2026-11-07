import type { AppProps } from "next/app";
import { useEffect } from "react";
import { useRouter } from "next/router";
import "@/styles/globals.css";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { AuthProvider } from "@/context/AuthContext";
import { WalletProvider } from "@/context/WalletContext";
import { OrderProvider } from "@/context/OrderContext";
import { AddressProvider } from "@/context/AddressContext";
import { SearchProvider } from "@/context/SearchContext";
import { AnalyticsProvider, useAnalytics } from "@/context/AnalyticsContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { RecommendationProvider } from "@/context/RecommendationContext";

function AppWithAnalytics({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const analytics = useAnalytics();

  useEffect(() => {
    // Start session on app mount
    analytics.startSession();

    return () => {
      // End session on unmount
      analytics.endSession();
    };
  }, []);

  useEffect(() => {
    // Track page views on route change
    const handleRouteChange = (url: string) => {
      analytics.trackPageView(url);
      analytics.trackEvent("page_view", {
        path: url,
        timestamp: new Date().toISOString(),
      });
    };

    router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events, analytics]);

  return (
    <NotificationProvider>
      <RecommendationProvider>
        <AuthProvider>
          <SearchProvider>
            <AddressProvider>
              <WalletProvider>
                <OrderProvider>
                  <CartProvider>
                    <WishlistProvider>
                      <Component {...pageProps} />
                    </WishlistProvider>
                  </CartProvider>
                </OrderProvider>
              </WalletProvider>
            </AddressProvider>
          </SearchProvider>
        </AuthProvider>
      </RecommendationProvider>
    </NotificationProvider>
  );
}

export default function App(props: AppProps) {
  return (
    <AnalyticsProvider>
      <AppWithAnalytics {...props} />
    </AnalyticsProvider>
  );
}

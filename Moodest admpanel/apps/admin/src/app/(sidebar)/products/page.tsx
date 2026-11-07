import CommerceoProductList from "@/components/product/CommerceoProductList";

export const metadata = {
  title: "Products - Commerce Admin",
  description: "Manage products, stock status, pricing, categories and catalog",
};

export default function ProductPage() {
  return (
    <div className="flex flex-1 flex-col py-2 sm:py-4">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Products
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          Manage product catalog, real-time stock toggles, pricing, and fulfillment status.
        </p>
      </div>

      <CommerceoProductList />
    </div>
  );
}

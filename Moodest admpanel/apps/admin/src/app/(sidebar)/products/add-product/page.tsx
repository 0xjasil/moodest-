import ProductFormLayout from "@/components/product/ConfigProductFormLayout";

export default function AddProductPage() {
  return (
    <div className="flex flex-1 flex-col min-h-screen">
      <div className="container flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 md:gap-6 py-4 md:py-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Add New Product
            </h1>
            <p className="text-muted-foreground">
              Fill in the details below to create a new product. Add variants if needed.
            </p>
          </div>

          {/* Product Form */}
          <ProductFormLayout />
        </div>
      </div>
    </div>
  );
}

import EditProductLayout from "@/components/product/EditProductLayout";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function AddConfigurableProductPage({ params }: EditProductPageProps) {
  const { id } = await params;

  return (
    <div className="flex flex-1 flex-col min-h-screen">
      <div className="container flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 md:gap-6 py-4 md:py-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Edit Product
              </h1>
              <p className="text-muted-foreground">
                Edit the details below to edit the product
              </p>
            </div>
          </div>

          {/* Product Form */}
          <EditProductLayout productId={id} />
        </div>
      </div>
    </div>
  );
}
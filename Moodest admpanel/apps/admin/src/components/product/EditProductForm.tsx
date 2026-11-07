"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEditProduct } from "@/context/EcitProductContext";
import { cn } from "@/lib/utils";

export default function EditProductFormSection() {
  const { baseProduct, updateBaseProduct } = useEditProduct();

  // Handle numeric inputs safely
  const handleNumericChange = (key: keyof typeof baseProduct, value: string) => {
    const numValue = value === "" ? 0 : parseFloat(value);
    if (!isNaN(numValue)) {
      updateBaseProduct({ [key]: numValue });
    }
  };

  // Compute stock status dynamically
  const getStockStatus = () => {
    if (baseProduct.baseQuantity === 0) return "Out of Stock";
    if (baseProduct.baseQuantity < 10) return "Low Stock";
    return "In Stock";
  };

  // Determine stock status color for quick visual feedback
  const stockColor = {
    "In Stock": "text-green-600",
    "Low Stock": "text-yellow-600",
    "Out of Stock": "text-red-600",
  }[getStockStatus()];

  return (
    <Card className="space-y-4 w-full h-full">
      {/* Basic Details */}
      <Card className="shadow-none border-none">
        <CardHeader>
          <CardTitle>Basic Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-2">
            <Label htmlFor="productName">
              Product Name <span className="text-red-500">*</span>
            </Label>
            <Input
              required
              id="productName"
              value={baseProduct.name}
              onChange={(e) =>
                updateBaseProduct({ name: e.target.value })
              }
              placeholder="Enter product name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Product Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              required
              id="description"
              value={baseProduct.description}
              onChange={(e) =>
                updateBaseProduct({ description: e.target.value })
              }
              className="min-h-[140px]"
              placeholder="Enter product description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fabric">Fabric / Material (Optional)</Label>
            <Input
              id="fabric"
              value={baseProduct.fabric || ""}
              onChange={(e) =>
                updateBaseProduct({ fabric: e.target.value })
              }
              placeholder="e.g. Nida, Premium Crepe, Linen, Chiffon"
            />
          </div>

          <div className="pt-2">
            <Label className="text-sm font-medium mb-3 block">Collection Tags</Label>
            <div className="grid grid-cols-2 gap-4">
              <div 
                className={cn(
                  "flex items-center space-x-2 border rounded-md p-3 cursor-pointer transition-colors",
                  baseProduct.isCustomerFavorite ? "bg-stone-50 border-stone-300" : "bg-white border-gray-200"
                )}
                onClick={() => updateBaseProduct({ isCustomerFavorite: !baseProduct.isCustomerFavorite })}
              >
                <input 
                  type="checkbox" 
                  checked={baseProduct.isCustomerFavorite}
                  onChange={() => {}}
                  className="w-4 h-4 rounded border-gray-300 text-stone-800"
                />
                <span className="text-sm font-medium text-gray-700">Customer Favorite</span>
              </div>
              <div 
                className={cn(
                  "flex items-center space-x-2 border rounded-md p-3 cursor-pointer transition-colors",
                  baseProduct.isNewArrival ? "bg-stone-50 border-stone-300" : "bg-white border-gray-200"
                )}
                onClick={() => updateBaseProduct({ isNewArrival: !baseProduct.isNewArrival })}
              >
                <input 
                  type="checkbox" 
                  checked={baseProduct.isNewArrival}
                  onChange={() => {}}
                  className="w-4 h-4 rounded border-gray-300 text-stone-800"
                />
                <span className="text-sm font-medium text-gray-700">New Arrival</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card className="shadow-none border-none">
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">
              Base Price <span className="text-red-500">*</span>
            </Label>
            <Input
              id="price"
              required
              value={baseProduct.basePrice.toString()}
              onChange={(e) =>
                handleNumericChange("basePrice", e.target.value)
              }
              placeholder="Enter base price"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="discountedPrice">Discounted Price (Optional)</Label>
            <Input
              id="discountedPrice"
              value={baseProduct.baseDiscountPrice.toString()}
              onChange={(e) =>
                handleNumericChange("baseDiscountPrice", e.target.value)
              }
              placeholder="Enter discounted price"
            />
          </div>
        </CardContent>
      </Card>

      {/* Inventory */}
      <Card className="shadow-none border-none">
        <CardHeader>
          <CardTitle>Inventory</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="stockQuantity">
              Base Quantity <span className="text-red-500">*</span>
            </Label>
            <Input
              id="stockQuantity"
              required
              value={baseProduct.baseQuantity.toString()}
              onChange={(e) =>
                handleNumericChange("baseQuantity", e.target.value)
              }
              placeholder="Enter quantity"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stockStatus">Stock Status</Label>
            <div
              id="stockStatus"
              className={cn(
                "border rounded-md px-3 py-2 bg-muted text-sm font-medium select-none",
                stockColor
              )}
            >
              {getStockStatus()}
            </div>
          </div>
        </CardContent>
      </Card>
    </Card>
  );
}

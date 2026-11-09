"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useEditProduct } from "@/context/EcitProductContext";
import { cn } from "@/lib/utils";

export default function EditProductFormSection() {
  const { baseProduct, updateBaseProduct } = useEditProduct();

  return (
    <Card className="space-y-4 w-full h-full shadow-none border-none">
      <CardHeader className="pb-3">
        <CardTitle>Basic Product Details</CardTitle>
        <CardDescription>
          Edit basic information for this abaya. Pricing, SKU, and inventory stock are managed in the Abaya Variants table below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="space-y-2">
            <Label htmlFor="careInstructions">Care Instructions (Optional)</Label>
            <Input
              id="careInstructions"
              value={baseProduct.careInstructions || ""}
              onChange={(e) =>
                updateBaseProduct({ careInstructions: e.target.value })
              }
              placeholder="e.g. Dry clean only, gentle hand wash at 30°C"
            />
          </div>
        </div>

        <div className="pt-2">
          <Label className="text-sm font-medium mb-3 block">Collection Tags</Label>
          <div className="grid grid-cols-2 gap-4">
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
              <span className="text-sm font-medium text-gray-700">New Arrivals</span>
            </div>
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
              <span className="text-sm font-medium text-gray-700">Trending Now</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

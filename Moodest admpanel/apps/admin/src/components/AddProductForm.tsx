"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useConfigurableProduct } from "@/context/ConfigurableProductContext";

export default function ProductFormSection() {
  const { baseProduct, setBaseProduct } = useConfigurableProduct();

  return (
    <Card className="space-y-4 w-full h-full shadow-none border-none">
      <CardHeader className="pb-3">
        <CardTitle>Basic Product Details</CardTitle>
        <CardDescription>
          Enter the essential information for this abaya. Pricing, SKU, and stock quantities are managed in the Abaya Variants table below.
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
              setBaseProduct({ ...baseProduct, name: e.target.value })
            }
            placeholder="e.g. Royal Black Embroidered Abaya"
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
              setBaseProduct({ ...baseProduct, description: e.target.value })
            }
            className="min-h-[140px]"
            placeholder="Describe the fabric cut, silhouette, embroidery details, sleeve finish, and styling recommendations..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fabric">Fabric / Material (Optional)</Label>
            <Input
              id="fabric"
              value={baseProduct.fabric || ""}
              onChange={(e) =>
                setBaseProduct({ ...baseProduct, fabric: e.target.value })
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
                setBaseProduct({ ...baseProduct, careInstructions: e.target.value })
              }
              placeholder="e.g. Dry clean only, gentle hand wash at 30°C"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

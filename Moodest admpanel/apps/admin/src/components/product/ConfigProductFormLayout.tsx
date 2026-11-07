"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import ProductFormSection from "../AddProductForm";
import AbayaVariantsManager from "./AbayaVariantsManager";
import ProductImageAndCategories from "./configurable-product";
import { useRouter } from "next/navigation";
import {
  ConfigurableProductProvider,
  useConfigurableProduct,
} from "@/context/ConfigurableProductContext";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";
import { uploadToCloudinary } from "@/lib/cloudinary";

interface ProductFormContentProps {
  isSimpleProduct: boolean;
  isEdit?: boolean;
  productId?: string;
}

function ProductFormContent({}: ProductFormContentProps) {
  const router = useRouter();
  const { baseProduct, variants, resetBaseProduct } = useConfigurableProduct();
  const [loading, setLoading] = useState(false);
  const [backendSkuError, setBackendSkuError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setBackendSkuError(null);

      // 1. Base Product Validation
      if (!baseProduct.name.trim()) {
        toast.error("Product name is required");
        return;
      }

      if (!baseProduct.description.trim()) {
        toast.error("Product description is required");
        return;
      }

      if (!baseProduct.brandId) {
        toast.error("Brand is required");
        return;
      }

      if (!baseProduct.categoryId) {
        toast.error("Category is required");
        return;
      }

      if (!baseProduct.subCategoryId) {
        toast.error("Sub-category is required");
        return;
      }

      if (!baseProduct.mainImage) {
        toast.error("Main product image is required");
        return;
      }

      if (baseProduct.thumbnails.length === 0) {
        toast.error("At least one thumbnail is required");
        return;
      }

      // 2. Variant Requirements: At least one valid variant is required for a sellable product
      if (variants.length === 0) {
        toast.error("At least one valid variant is required for a sellable product.");
        return;
      }

      // 3. Form-level Duplicate SKU Check
      const skuMap = new Map<string, number>();
      for (const v of variants) {
        const cleanSku = (v.sku || "").trim().toUpperCase();
        if (!cleanSku) {
          toast.error("All variants must have a non-empty SKU");
          return;
        }
        skuMap.set(cleanSku, (skuMap.get(cleanSku) || 0) + 1);
      }
      const duplicateSkus: string[] = [];
      skuMap.forEach((count, sku) => {
        if (count > 1) duplicateSkus.push(sku);
      });
      if (duplicateSkus.length > 0) {
        const errMsg = `Duplicate SKUs found in form: ${duplicateSkus.join(", ")}. Please ensure each variant has a unique SKU.`;
        setBackendSkuError(errMsg);
        toast.error(errMsg);
        return;
      }

      // 4. Duplicate Size/Color combination check
      const comboSet = new Set<string>();
      for (const v of variants) {
        const comboKey = `${v.size.trim()}|${(v.color || "").trim().toLowerCase()}`;
        if (comboSet.has(comboKey)) {
          const errMsg = `Duplicate combination for Size "${v.size}" and Color "${v.color || "None"}" found.`;
          setBackendSkuError(errMsg);
          toast.error(errMsg);
          return;
        }
        comboSet.add(comboKey);
      }

      // 5. Individual Variant Field Validations
      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        if (!v.size) {
          toast.error(`Variant #${i + 1}: Size is required.`);
          return;
        }
        const priceNum = typeof v.price === "number" ? v.price : parseFloat(String(v.price));
        if (isNaN(priceNum) || priceNum <= 0) {
          toast.error(`Variant #${i + 1} (${v.sku}): Price must be greater than 0.`);
          return;
        }
        if (v.offerPrice != null && String(v.offerPrice).trim() !== "") {
          const offerNum = typeof v.offerPrice === "number" ? v.offerPrice : parseFloat(String(v.offerPrice));
          if (isNaN(offerNum) || offerNum < 0) {
            toast.error(`Variant #${i + 1} (${v.sku}): Offer price cannot be negative.`);
            return;
          }
          if (offerNum >= priceNum) {
            toast.error(`Variant #${i + 1} (${v.sku}): Offer price must be less than regular price.`);
            return;
          }
        }
        const qtyNum = typeof v.qty === "number" ? v.qty : parseInt(String(v.qty), 10);
        if (isNaN(qtyNum) || qtyNum < 0) {
          toast.error(`Variant #${i + 1} (${v.sku}): Stock quantity must be a non-negative whole integer.`);
          return;
        }
      }

      // 6. Upload Main Image and Thumbnails to Cloudinary CDN
      let mainImageUrl = "";
      const rawMain: any = baseProduct.mainImage;
      if (rawMain instanceof File) {
        toast.loading("Uploading main product image to Cloudinary...", { id: "product-save" });
        mainImageUrl = await uploadToCloudinary(rawMain, "moodest/products/main");
      } else if (typeof rawMain === "string" && rawMain.startsWith("data:")) {
        toast.loading("Uploading main product image to Cloudinary...", { id: "product-save" });
        mainImageUrl = await uploadToCloudinary(rawMain, "moodest/products/main");
      } else if (typeof rawMain === "string") {
        mainImageUrl = rawMain;
      }

      const uploadedThumbnailUrls: string[] = [];
      for (let i = 0; i < baseProduct.thumbnails.length; i++) {
        const thumb: any = baseProduct.thumbnails[i];
        if (thumb instanceof File) {
          toast.loading(`Uploading thumbnail ${i + 1}/${baseProduct.thumbnails.length} to Cloudinary...`, { id: "product-save" });
          const thumbUrl = await uploadToCloudinary(thumb, "moodest/products/thumbnails");
          uploadedThumbnailUrls.push(thumbUrl);
        } else if (typeof thumb === "string" && thumb.startsWith("data:")) {
          toast.loading(`Uploading thumbnail ${i + 1}/${baseProduct.thumbnails.length} to Cloudinary...`, { id: "product-save" });
          const thumbUrl = await uploadToCloudinary(thumb, "moodest/products/thumbnails");
          uploadedThumbnailUrls.push(thumbUrl);
        } else if (typeof thumb === "string") {
          uploadedThumbnailUrls.push(thumb);
        }
      }

      toast.loading("Publishing product to database...", { id: "product-save" });

      const allImages = [mainImageUrl, ...uploadedThumbnailUrls].filter(Boolean);
      if (allImages.length === 0) {
        allImages.push("https://res.cloudinary.com/dsaegpb70/image/upload/v1758345272/Banner_npoe1w.jpg");
      }

      // 7. Format Clean Decimal Serialized Product Payload
      const slug =
        baseProduct.name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") || `prod-${Date.now()}`;

      // Calculate lowest price for basePrice fallback if needed
      const minPrice = Math.min(...variants.map((v) => Number(v.price) || 0));

      const payload = {
        name: baseProduct.name.trim(),
        slug,
        description: baseProduct.description.trim(),
        fabric: baseProduct.fabric ? baseProduct.fabric.trim() : null,
        brandId: baseProduct.brandId ? String(baseProduct.brandId) : null,
        categoryId: baseProduct.categoryId ? String(baseProduct.categoryId) : null,
        subCategoryId: baseProduct.subCategoryId ? String(baseProduct.subCategoryId) : null,
        basePrice: minPrice,
        image: mainImageUrl || allImages[0],
        images: allImages,
        isCustomerFavorite: Boolean(baseProduct.isCustomerFavorite),
        isNewArrival: Boolean(baseProduct.isNewArrival),
        variants: variants.map((v) => ({
          size: v.size,
          color: v.color || "",
          colorHex: v.colorHex || null,
          sku: v.sku.trim(),
          price: Number(v.price).toFixed(2),
          offerPrice:
            v.offerPrice != null && Number(v.offerPrice) > 0
              ? Number(v.offerPrice).toFixed(2)
              : null,
          qty: Math.max(0, Math.floor(Number(v.qty || 0))),
          isActive: v.isActive !== false,
        })),
      };

      // 7. Send Request through API Client
      const response = await apiFetch(`/products`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message =
          errorData.message ||
          errorData.error ||
          `HTTP Error ${response.status} from backend`;

        // Check if error is related to duplicate SKU
        if (
          typeof message === "string" &&
          (message.toLowerCase().includes("sku") ||
            message.toLowerCase().includes("unique constraint"))
        ) {
          setBackendSkuError(`Backend validation error: ${message}`);
        }

        throw new Error(message);
      }

      const createdProduct = await response.json();
      const prodId = createdProduct?.id || createdProduct?.data?.id;

      // In case backend separates variant additions into /products/:id/variants
      if (prodId && createdProduct && !createdProduct.variants) {
        for (const v of variants) {
          await apiFetch(`/products/${prodId}/variants`, {
            method: "POST",
            body: JSON.stringify({
              size: v.size,
              color: v.color || "",
              colorHex: v.colorHex || null,
              sku: v.sku.trim(),
              price: Number(v.price).toFixed(2),
              offerPrice:
                v.offerPrice != null && Number(v.offerPrice) > 0
                  ? Number(v.offerPrice).toFixed(2)
                  : null,
              qty: Math.max(0, Math.floor(Number(v.qty || 0))),
              isActive: v.isActive !== false,
            }),
          }).catch((err) => {
            console.warn("Sub-variant post warning:", err);
          });
        }
      }

      toast.success("Abaya product and Cloudinary CDN images created successfully!", { id: "product-save" });
      resetBaseProduct();
      router.push("/products");
      router.refresh();
    } catch (error) {
      console.error("Error creating product:", error);
      // PRESERVE FORM DATA: Do not reset state on failure!
      toast.error(
        error instanceof Error ? error.message : "Failed to create product"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="h-10 px-5 cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs"
        >
          {loading ? "Saving Product..." : "Create Product & Variants"}
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 w-full items-start">
        <div className="w-full lg:w-1/2">
          <ProductFormSection />
        </div>
        <div className="w-full lg:w-1/2">
          <ProductImageAndCategories />
        </div>
      </div>

      <AbayaVariantsManager mode="create" backendSkuError={backendSkuError} />
    </div>
  );
}

function ProductFormLayout({ isSimpleProduct }: { isSimpleProduct?: boolean }) {
  return (
    <ConfigurableProductProvider>
      <ProductFormContent isSimpleProduct={!!isSimpleProduct} />
    </ConfigurableProductProvider>
  );
}

export default ProductFormLayout;

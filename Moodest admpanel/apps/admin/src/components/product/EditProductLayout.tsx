"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { EditProductProvider, useEditProduct } from "@/context/EcitProductContext";
import type { ProductDetail } from "@/types/product";
import EditProductFormSection from "./EditProductForm";
import EditProductImageAndCategories from "./EditProductImageAndCategories";
import AbayaVariantsManager from "./AbayaVariantsManager";
import { apiFetch } from "@/lib/apiFetch";
import { uploadToCloudinary } from "@/lib/cloudinary";

interface EditProductLayoutProps {
  productId: string;
}

function EditProductFormContent({ productId }: { productId: string }) {
  const {
    baseProduct,
    variants,
    setBaseProduct,
    setVariants,
    deletedVariantIds,
  } = useEditProduct();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [backendSkuError, setBackendSkuError] = useState<string | null>(null);

  // Fetch and populate product data
  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        const response = await apiFetch(`/products/${productId}`);
        const res = await response.json();

        if (response.ok && res) {
          const product: any = res.data || res;

          // Set base product data
          const variantsList = product.variants || [];
          const firstVariant = variantsList[0];
          const totalQty = variantsList.reduce((sum: number, v: any) => sum + (Number(v.qty) || 0), 0);

          // Resolve images from DB (Cloudinary CDN URLs)
          const rawImages: string[] = Array.isArray(product.images)
            ? product.images
            : Array.isArray(product.subimage)
            ? product.subimage
            : [];

          const mainImage = product.image || rawImages[0] || null;
          const hoverImage = product.hoverImage || (rawImages.length > 1 ? rawImages[1] : null);
          const galleryThumbnails = rawImages.length > 2
            ? rawImages.slice(2)
            : rawImages.length === 2 && !product.hoverImage
            ? rawImages.slice(1)
            : [];

          const resolvedCategoryId = product.categoryId
            ? String(product.categoryId)
            : product.category?.id
            ? String(product.category.id)
            : "";

          const resolvedBrandId = product.brandId
            ? String(product.brandId)
            : product.brand?.id
            ? String(product.brand.id)
            : null;

          const resolvedSubCategoryId = product.subCategoryId
            ? String(product.subCategoryId)
            : product.subCategory?.id
            ? String(product.subCategory.id)
            : "";

          setBaseProduct({
            name: product.name || "",
            description: product.description || "",
            fabric: product.fabric || "",
            careInstructions: product.careInstructions || "",
            mainImage,
            hoverImage,
            basePrice: firstVariant ? Number(firstVariant.price) : (Number(product.basePrice || product.price) || 0),
            baseQuantity: totalQty,
            baseDiscountPrice: firstVariant?.offerPrice ? Number(firstVariant.offerPrice) : 0,
            thumbnails: galleryThumbnails,
            brandId: resolvedBrandId,
            categoryId: resolvedCategoryId,
            subCategoryId: resolvedSubCategoryId,
            isCustomerFavorite: Boolean(product.isCustomerFavorite || product.isFeatured),
            isNewArrival: Boolean(product.isNewArrival),
          });

          // Set variants data - preserve existing variant IDs!
          const mappedVariants = variantsList.map((variant: any) => {
            const sizeOption = variant.options?.find(
              (o: any) => o.attribute?.name?.toLowerCase() === "size"
            )?.attributeValue?.value;
            const colorOption = variant.options?.find(
              (o: any) => o.attribute?.name?.toLowerCase() === "color"
            )?.attributeValue?.value;

            return {
              id: String(variant.id),
              productId: String(variant.productId || productId),
              size: variant.size || sizeOption || "54",
              color: variant.color || colorOption || "",
              colorHex: variant.colorHex || null,
              sku: variant.sku || `MDS-${productId}-${variant.id}`,
              price: Number(variant.price) || 0,
              offerPrice: variant.offerPrice != null ? Number(variant.offerPrice) : null,
              qty: typeof variant.qty === "number" ? variant.qty : 0,
              isActive: variant.isActive !== false,
              reservations: variant.reservations,
              image: variant.image || (variant.images?.[0] as any) || null,
              images: variant.images || [],
              isNew: false,
              isModified: false,
            };
          });

          setVariants(mappedVariants);
          setInitialLoadDone(true);
        } else {
          toast.error(res?.message || res?.error || "Failed to load product");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error("Something went wrong while fetching the product.");
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [productId, setBaseProduct, setVariants]);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setBackendSkuError(null);

      // 1. Validation
      if (!baseProduct.name.trim()) {
        toast.error("Product name is required");
        return;
      }

      if (!baseProduct.categoryId) {
        toast.error("Category is required");
        return;
      }

      if (variants.length === 0) {
        toast.error("At least one valid variant is required for a sellable product");
        return;
      }

      // 2. Duplicate SKU Check
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
        const errMsg = `Duplicate SKUs detected: ${duplicateSkus.join(", ")}. Every variant must have a unique SKU.`;
        setBackendSkuError(errMsg);
        toast.error(errMsg);
        return;
      }

      // 3. Duplicate Size/Color combination check
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

      // 4. Individual Variant Field Validations
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

      // 5. Upload any updated images to Cloudinary CDN
      const rawMain: any = baseProduct.mainImage;
      let mainImageUrl = typeof rawMain === "string" ? rawMain : "";
      if (rawMain instanceof File) {
        toast.loading("Uploading main image to Cloudinary...", { id: "edit-prod-save" });
        mainImageUrl = await uploadToCloudinary(rawMain, "moodest/products/main");
      } else if (typeof rawMain === "string" && rawMain.startsWith("data:")) {
        toast.loading("Uploading main image to Cloudinary...", { id: "edit-prod-save" });
        mainImageUrl = await uploadToCloudinary(rawMain, "moodest/products/main");
      }

      const rawHover: any = baseProduct.hoverImage;
      let hoverImageUrl = typeof rawHover === "string" ? rawHover : "";
      if (rawHover instanceof File) {
        toast.loading("Uploading hover thumbnail to Cloudinary...", { id: "edit-prod-save" });
        hoverImageUrl = await uploadToCloudinary(rawHover, "moodest/products/thumbnails");
      } else if (typeof rawHover === "string" && rawHover.startsWith("data:")) {
        toast.loading("Uploading hover thumbnail to Cloudinary...", { id: "edit-prod-save" });
        hoverImageUrl = await uploadToCloudinary(rawHover, "moodest/products/thumbnails");
      }

      const uploadedThumbnailUrls: string[] = [];
      for (let i = 0; i < (baseProduct.thumbnails || []).length; i++) {
        const thumb: any = baseProduct.thumbnails[i];
        if (thumb instanceof File) {
          toast.loading(`Uploading thumbnail ${i + 1} to Cloudinary...`, { id: "edit-prod-save" });
          const thumbUrl = await uploadToCloudinary(thumb, "moodest/products/thumbnails");
          uploadedThumbnailUrls.push(thumbUrl);
        } else if (typeof thumb === "string" && thumb.startsWith("data:")) {
          toast.loading(`Uploading thumbnail ${i + 1} to Cloudinary...`, { id: "edit-prod-save" });
          const thumbUrl = await uploadToCloudinary(thumb, "moodest/products/thumbnails");
          uploadedThumbnailUrls.push(thumbUrl);
        } else if (typeof thumb === "string") {
          uploadedThumbnailUrls.push(thumb);
        }
      }

      // Upload variant images if new files provided
      const processedVariants = [];
      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        let variantImageUrl = typeof v.image === "string" ? v.image : null;
        if (v.image instanceof File) {
          toast.loading(`Uploading variant photo (${v.size}/${v.color || "Default"}) to Cloudinary...`, { id: "edit-prod-save" });
          variantImageUrl = await uploadToCloudinary(v.image, "moodest/products/variants");
        }
        processedVariants.push({
          id: v.isNew ? undefined : v.id, // Preserve existing variant ID
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
          image: variantImageUrl,
          isNew: v.isNew,
          isModified: v.isModified,
        });
      }

      toast.loading("Updating product details...", { id: "edit-prod-save" });

      const allImages = [mainImageUrl, hoverImageUrl, ...uploadedThumbnailUrls].filter(Boolean);

      // 6. Update Product Details via API
      const minPrice = Math.min(...variants.map((v) => Number(v.price) || 0));

      const payload: Record<string, any> = {
        name: baseProduct.name.trim(),
        description: baseProduct.description.trim(),
        fabric: baseProduct.fabric ? baseProduct.fabric.trim() : null,
        brandId: baseProduct.brandId ? String(baseProduct.brandId) : null,
        categoryId: baseProduct.categoryId ? String(baseProduct.categoryId) : null,
        subCategoryId: baseProduct.subCategoryId ? String(baseProduct.subCategoryId) : null,
        basePrice: minPrice,
        isCustomerFavorite: Boolean(baseProduct.isCustomerFavorite),
        isNewArrival: Boolean(baseProduct.isNewArrival),
        variants: processedVariants,
      };

      if (mainImageUrl) {
        payload.image = mainImageUrl;
      }
      if (hoverImageUrl) {
        payload.hoverImage = hoverImageUrl;
      }
      if (allImages.length > 0) {
        payload.images = allImages;
      }

      const response = await apiFetch(`/products/${productId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message =
          errorData.message ||
          errorData.error ||
          `Failed to update product (HTTP ${response.status})`;

        if (
          typeof message === "string" &&
          (message.toLowerCase().includes("sku") ||
            message.toLowerCase().includes("unique constraint"))
        ) {
          setBackendSkuError(`Backend validation error: ${message}`);
        }

        throw new Error(message);
      }

      // 6. Handle variant sub-endpoints for backend configurations
      // Delete removed variants
      for (const varId of deletedVariantIds) {
        await apiFetch(`/products/${productId}/variants/${varId}`, {
          method: "DELETE",
        }).catch((err) => console.warn("Variant delete warning:", err));
      }

      // Create new variants added during edit
      for (const v of variants) {
        if (v.isNew) {
          await apiFetch(`/products/${productId}/variants`, {
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
          }).catch((err) => console.warn("Variant post warning:", err));
        } else if (v.isModified && v.id) {
          // Update modified existing variant preserving ID
          await apiFetch(`/products/${productId}/variants/${v.id}`, {
            method: "PATCH",
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
          }).catch((err) => console.warn("Variant patch warning:", err));
        }
      }

      toast.success("Abaya product and Cloudinary CDN images updated successfully!", { id: "edit-prod-save" });
    } catch (error) {
      console.error("Error updating product:", error);
      // PRESERVE FORM DATA: Form data is maintained so user can correct and retry
      toast.error(
        error instanceof Error ? error.message : "Failed to update product"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin size-6 text-gray-500" />
      </div>
    );
  }

  if (!initialLoadDone) {
    return (
      <div className="text-center text-gray-500 py-10">
        Product not found or failed to load.
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="h-10 px-5 cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs"
        >
          {submitting ? "Saving Changes..." : "Save Product & Variants"}
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 w-full items-start">
        <div className="w-full lg:w-1/2">
          <EditProductFormSection />
        </div>
        <div className="w-full lg:w-1/2">
          <EditProductImageAndCategories />
        </div>
      </div>

      <AbayaVariantsManager mode="edit" backendSkuError={backendSkuError} />
    </div>
  );
}

export default function EditProductLayout({ productId }: EditProductLayoutProps) {
  return (
    <EditProductProvider>
      <EditProductFormContent productId={productId} />
    </EditProductProvider>
  );
}

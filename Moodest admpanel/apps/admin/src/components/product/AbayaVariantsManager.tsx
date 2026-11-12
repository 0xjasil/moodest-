"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@iconify/react";

const makeIcon = (iconName: string) => function VarIcon({ className }: { className?: string }) {
  return <Icon icon={iconName} className={className} />;
};

const Plus = makeIcon("lucide:plus");
const Trash2 = makeIcon("lucide:trash-2");
const Copy = makeIcon("lucide:copy");
const Layers = makeIcon("lucide:layers");
const AlertCircle = makeIcon("lucide:alert-circle");
const Sparkles = makeIcon("lucide:sparkles");
const Edit2 = makeIcon("lucide:pencil");
const RefreshCw = makeIcon("lucide:refresh-cw");
const Package = makeIcon("lucide:package");
const Eye = makeIcon("lucide:eye");
const ExternalLink = makeIcon("lucide:external-link");
const Check = makeIcon("lucide:check");
const X = makeIcon("lucide:x");
const ImageIcon = makeIcon("lucide:image");
const ImagePlus = makeIcon("lucide:image-plus");
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Checkbox from "@/components/ui/checkbox";
import { useConfigurableProduct } from "@/context/ConfigurableProductContext";
import { useEditProduct } from "@/context/EcitProductContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MOCK_ABAYA_PRODUCTS, type VariationProduct } from "@/components/variations/variations.mock";

export const ABAYA_SIZES = ["50", "52", "54", "56", "58", "60", "62"] as const;
export const FLEXIBLE_SIZES = ["Free Size", "Custom Size"] as const;

export const PRESET_COLORS: { name: string; hex: string; code: string }[] = [
  { name: "Black", hex: "#000000", code: "BLK" },
  { name: "Navy Blue", hex: "#0A192F", code: "NVY" },
  { name: "Olive Green", hex: "#4B5320", code: "OLV" },
  { name: "Burgundy", hex: "#800020", code: "BRG" },
  { name: "Taupe", hex: "#8B8589", code: "TPE" },
  { name: "Beige", hex: "#E1C699", code: "BGE" },
  { name: "Dusty Rose", hex: "#DCAE96", code: "ROSE" },
  { name: "White", hex: "#FFFFFF", code: "WHT" },
  { name: "Chocolate Brown", hex: "#3B2219", code: "BRN" },
  { name: "Charcoal Grey", hex: "#36454F", code: "GRY" },
];

export const NO_COLOR_LABEL = "None (Size Only)";
export const NO_COLOR_VALUE = "";

export interface AbayaVariantItem {
  id: string;
  size: string;
  color: string;
  colorHex?: string | null;
  sku: string;
  price: number;
  offerPrice?: number | null;
  qty: number;
  isActive: boolean;
  isNew?: boolean;
  isModified?: boolean;
  image?: File | string | null;
  reservations?: Array<{
    id: string;
    quantity: number;
    status: string;
    expiresAt?: string | Date;
  }>;
}

interface AbayaVariantsManagerProps {
  mode: "create" | "edit";
  backendSkuError?: string | null;
}

// Helper to format currency accurately without float bugs
export function formatMoney(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || amount === "") return "-";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(num);
}

// Derive clean product SKU prefix (e.g., "NOOR")
function getProductSkuPrefix(productName: string): string {
  if (!productName || !productName.trim()) return "PROD";
  const clean = productName
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  if (clean.length === 0) return "PROD";
  return clean[0].slice(0, 6);
}

// Derive color code for SKU (e.g., "BLK", "NVY", or "STD")
function getColorSkuCode(colorName: string): string {
  if (!colorName || colorName === NO_COLOR_VALUE || colorName === NO_COLOR_LABEL || colorName === "-") {
    return "";
  }
  const preset = PRESET_COLORS.find(
    (c) => c.name.toLowerCase() === colorName.trim().toLowerCase()
  );
  if (preset) return preset.code;
  const clean = colorName.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  return clean.slice(0, 3) || "COL";
}

// Build suggested SKU: MDS-[PROD]-[COL]-[SIZE] or MDS-[PROD]-[SIZE]
export function generateSuggestedSku(
  productName: string,
  size: string,
  color: string
): string {
  const brand = "MDS";
  const prod = getProductSkuPrefix(productName);
  const col = getColorSkuCode(color);
  
  let sizePart = (size || "").trim().toUpperCase();
  if (sizePart.includes("FREE")) {
    sizePart = "FREE";
  } else if (sizePart.startsWith("SIZE ") || sizePart.startsWith("SZ ")) {
    sizePart = sizePart.replace(/^(SIZE|SZ)\s*/i, "").trim();
  } else if (!/^[0-9]+$/.test(sizePart)) {
    const numMatch = sizePart.match(/\d+/);
    if (numMatch) {
      sizePart = `CUST${numMatch[0]}`;
    } else {
      sizePart = "CUST";
    }
  }

  if (col) {
    return `${brand}-${prod}-${col}-${sizePart}`;
  }
  return `${brand}-${prod}-${sizePart}`;
}

interface AbayaVariantsManagerUIProps {
  mode: "create" | "edit";
  baseProduct: {
    name: string;
    basePrice: number;
    baseQuantity: number;
    baseDiscountPrice: number;
  };
  variants: AbayaVariantItem[];
  setVariants: (updated: AbayaVariantItem[]) => void;
  onRemoveExistingVariant?: (id: string) => void;
  backendSkuError?: string | null;
}

function AbayaVariantsManagerUI({
  baseProduct,
  variants,
  setVariants,
  onRemoveExistingVariant,
  backendSkuError,
}: AbayaVariantsManagerUIProps) {
  // State for Add / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);

  // Form fields inside modal
  const [formSizeType, setFormSizeType] = useState<"preset" | "custom" | "free">("preset");
  const [formSize, setFormSize] = useState<string>("54");
  const [formCustomSize, setFormCustomSize] = useState<string>("");
  const [formColorType, setFormColorType] = useState<"preset" | "custom" | "none">("preset");
  const [formColor, setFormColor] = useState<string>("Black");
  const [formColorHex, setFormColorHex] = useState<string>("#000000");
  const [formSku, setFormSku] = useState<string>("");
  const [skuManuallyEdited, setSkuManuallyEdited] = useState<boolean>(false);
  const [formPrice, setFormPrice] = useState<string>("");
  const [formOfferPrice, setFormOfferPrice] = useState<string>("");
  const [formQty, setFormQty] = useState<string>("10");
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formImage, setFormImage] = useState<File | string | null>(null);
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // State for Combinations Generator Modal
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [genSelectedSizes, setGenSelectedSizes] = useState<string[]>(["52", "54", "56"]);
  const [genColorMode, setGenColorMode] = useState<"colors" | "sizeOnly">("colors");
  const [genSelectedColors, setGenSelectedColors] = useState<string[]>(["Black", "Navy Blue"]);
  const [genPrice, setGenPrice] = useState<string>("");
  const [genOfferPrice, setGenOfferPrice] = useState<string>("");
  const [genQty, setGenQty] = useState<string>("10");
  const [previewOpen, setPreviewOpen] = useState(false);

  // Confirmation Alert Dialog for Delete / Deactivate
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTargetVariant, setAlertTargetVariant] = useState<AbayaVariantItem | null>(null);
  const [alertAction, setAlertAction] = useState<"delete" | "deactivate">("delete");

  // State for "Products Matching Variant" modal
  const [variantProductsTarget, setVariantProductsTarget] = useState<AbayaVariantItem | null>(null);

  // Filter catalog products matching the selected variant size/color
  const matchingProducts = useMemo(() => {
    if (!variantProductsTarget) return [];
    const targetSize = (variantProductsTarget.size || "").toLowerCase().replace(/size\s*/i, "").trim();
    const targetColor = (variantProductsTarget.color || "").toLowerCase().trim();

    return Object.values(MOCK_ABAYA_PRODUCTS).filter((p) => {
      const prodSize = (p.size || "").toLowerCase().replace(/size\s*/i, "").trim();
      const prodColor = (p.color || "").toLowerCase().trim();
      const sizeMatches = !targetSize || prodSize === targetSize || prodSize.includes(targetSize) || targetSize.includes(prodSize);
      const colorMatches = !targetColor || targetColor === NO_COLOR_LABEL.toLowerCase() || prodColor.includes(targetColor) || targetColor.includes(prodColor);
      return sizeMatches || colorMatches;
    });
  }, [variantProductsTarget]);

  // Detect duplicate SKUs in current form
  const duplicateSkus = useMemo(() => {
    const counts: { [sku: string]: number } = {};
    variants.forEach((v) => {
      const clean = (v.sku || "").trim().toUpperCase();
      if (clean) counts[clean] = (counts[clean] || 0) + 1;
    });
    const set = new Set<string>();
    Object.entries(counts).forEach(([sku, count]) => {
      if (count > 1) set.add(sku);
    });
    return set;
  }, [variants]);

  // Open Add Variant Modal
  const handleOpenAddModal = () => {
    setEditingVariantId(null);
    setFormSizeType("preset");
    setFormCustomSize("");
    setFormSize("54");
    setFormColorType("preset");
    setFormColor("Black");
    setFormColorHex("#000000");
    const suggested = generateSuggestedSku(baseProduct.name, "54", "Black");
    setFormSku(suggested);
    setSkuManuallyEdited(false);
    setFormPrice(baseProduct.basePrice > 0 ? String(baseProduct.basePrice) : "");
    setFormOfferPrice(baseProduct.baseDiscountPrice > 0 ? String(baseProduct.baseDiscountPrice) : "");
    setFormQty(baseProduct.baseQuantity > 0 ? String(baseProduct.baseQuantity) : "10");
    setFormIsActive(true);
    setFormImage(null);
    setFormImagePreview(null);
    setFormErrors({});
    setModalOpen(true);
  };

  // Open Edit Variant Modal
  const handleOpenEditModal = (variant: AbayaVariantItem) => {
    setEditingVariantId(variant.id);
    const isStandardSize = (ABAYA_SIZES as readonly string[]).includes(variant.size);
    const isFree = variant.size.toLowerCase().includes("free");
    if (isStandardSize) {
      setFormSizeType("preset");
      setFormSize(variant.size);
      setFormCustomSize("");
    } else if (isFree) {
      setFormSizeType("free");
      setFormSize("Free Size");
      setFormCustomSize("");
    } else {
      setFormSizeType("custom");
      setFormSize(variant.size);
      setFormCustomSize(variant.size);
    }

    if (!variant.color || variant.color === NO_COLOR_VALUE || variant.color === NO_COLOR_LABEL) {
      setFormColorType("none");
      setFormColor("");
      setFormColorHex("");
    } else {
      const isPreset = PRESET_COLORS.some(
        (c) => c.name.toLowerCase() === variant.color.toLowerCase()
      );
      if (isPreset) {
        setFormColorType("preset");
        setFormColor(variant.color);
        setFormColorHex(variant.colorHex || "#000000");
      } else {
        setFormColorType("custom");
        setFormColor(variant.color);
        setFormColorHex(variant.colorHex || "");
      }
    }
    setFormSku(variant.sku);
    setSkuManuallyEdited(true); // Don't auto-overwrite existing SKU on edit
    setFormPrice(String(variant.price));
    setFormOfferPrice(variant.offerPrice != null ? String(variant.offerPrice) : "");
    setFormQty(String(variant.qty));
    setFormIsActive(variant.isActive);
    if (variant.image) {
      setFormImage(variant.image);
      if (typeof variant.image === "string") {
        setFormImagePreview(variant.image);
      } else if (variant.image instanceof File) {
        setFormImagePreview(URL.createObjectURL(variant.image));
      }
    } else {
      setFormImage(null);
      setFormImagePreview(null);
    }
    setFormErrors({});
    setModalOpen(true);
  };

  // Dynamic SKU updater when size/color changes (if user hasn't manually overridden)
  const updateFormSize = (newSize: string) => {
    setFormSize(newSize);
    if (!skuManuallyEdited) {
      const colorVal = formColorType === "none" ? "" : formColor;
      setFormSku(generateSuggestedSku(baseProduct.name, newSize, colorVal));
    }
  };

  const updateFormColor = (newColor: string, newHex?: string) => {
    setFormColor(newColor);
    if (newHex !== undefined) setFormColorHex(newHex);
    if (!skuManuallyEdited) {
      setFormSku(generateSuggestedSku(baseProduct.name, formSize, newColor));
    }
  };

  // Modal Validation & Save
  const handleSaveModalVariant = () => {
    const errors: { [key: string]: string } = {};

    // 1. Size
    const finalSize = formSizeType === "free" ? "Free Size" : formSize.trim();
    if (!finalSize) {
      errors.size = "Abaya size is required.";
    }

    // 2. Color
    const finalColor = formColorType === "none" ? "" : formColor.trim();
    const finalHex =
      formColorType === "none"
        ? null
        : formColorHex?.trim()
        ? formColorHex.trim()
        : null;

    if (finalHex && !/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(finalHex)) {
      errors.colorHex = "Invalid hex color format (e.g. #000000).";
    }

    // 3. Duplicate Size/Color combination check within the product
    const comboExists = variants.some((v) => {
      if (editingVariantId && v.id === editingVariantId) return false;
      const vColor = v.color ? v.color.trim().toLowerCase() : "";
      const curColor = finalColor.toLowerCase();
      return v.size.trim().toLowerCase() === finalSize.toLowerCase() && vColor === curColor;
    });

    if (comboExists) {
      errors.combo = `Variant for Size "${finalSize}" and Color "${finalColor || "None"}" already exists in this product.`;
    }

    // 4. SKU
    const cleanSku = formSku.trim();
    if (!cleanSku) {
      errors.sku = "SKU cannot be empty.";
    } else {
      const skuExists = variants.some((v) => {
        if (editingVariantId && v.id === editingVariantId) return false;
        return v.sku.trim().toUpperCase() === cleanSku.toUpperCase();
      });
      if (skuExists) {
        errors.sku = "This SKU is already used by another variant in this product.";
      }
    }

    // 5. Price
    const numPrice = parseFloat(formPrice);
    if (isNaN(numPrice) || numPrice <= 0) {
      errors.price = "Regular price must be a positive number greater than 0.";
    }

    // 6. Offer Price (Optional)
    let numOfferPrice: number | null = null;
    if (formOfferPrice.trim()) {
      numOfferPrice = parseFloat(formOfferPrice);
      if (isNaN(numOfferPrice) || numOfferPrice < 0) {
        errors.offerPrice = "Offer price cannot be negative.";
      } else if (!isNaN(numPrice) && numOfferPrice >= numPrice) {
        errors.offerPrice = "Offer price must be less than regular price.";
      }
    }

    // 7. Quantity
    const numQty = parseInt(formQty, 10);
    if (isNaN(numQty) || numQty < 0 || String(numQty) !== formQty.trim()) {
      errors.qty = "Stock quantity must be a non-negative whole integer.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Persist to form state
    if (editingVariantId) {
      const updated = variants.map((v) => {
        if (v.id === editingVariantId) {
          return {
            ...v,
            size: finalSize,
            color: finalColor,
            colorHex: finalHex,
            sku: cleanSku,
            price: numPrice,
            offerPrice: numOfferPrice,
            qty: numQty,
            isActive: formIsActive,
            isModified: !v.isNew,
            image: formImage,
          };
        }
        return v;
      });
      setVariants(updated);
      toast.success("Variant updated");
    } else {
      const newVariant: AbayaVariantItem = {
        id: `temp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        size: finalSize,
        color: finalColor,
        colorHex: finalHex,
        sku: cleanSku,
        price: numPrice,
        offerPrice: numOfferPrice,
        qty: numQty,
        isActive: formIsActive,
        isNew: true,
        image: formImage,
      };
      setVariants([...variants, newVariant]);
      toast.success("Variant added");
    }

    setModalOpen(false);
  };

  // Duplicate Variant
  const handleDuplicateVariant = (source: AbayaVariantItem) => {
    // Generate distinct SKU for the duplicate
    let candidateSku = `${source.sku}-COPY`;
    let counter = 1;
    while (variants.some((v) => v.sku.toUpperCase() === candidateSku.toUpperCase())) {
      candidateSku = `${source.sku}-COPY${counter++}`;
    }

    const duplicated: AbayaVariantItem = {
      id: `temp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      size: source.size,
      color: source.color,
      colorHex: source.colorHex,
      sku: candidateSku,
      price: source.price,
      offerPrice: source.offerPrice,
      qty: source.qty,
      isActive: source.isActive,
      isNew: true,
      image: source.image,
    };

    setVariants([...variants, duplicated]);
    toast.info(`Variant duplicated with new SKU: ${candidateSku}`);
  };

  // Toggle Variant Active status
  const handleToggleActive = (variantId: string) => {
    const updated = variants.map((v) => {
      if (v.id === variantId) {
        return {
          ...v,
          isActive: !v.isActive,
          isModified: !v.isNew,
        };
      }
      return v;
    });
    setVariants(updated);
  };

  // Request Delete / Deactivate confirmation
  const handlePromptDelete = (variant: AbayaVariantItem) => {
    // If it's an unsaved new variant, delete immediately without prompting
    if (variant.isNew || variant.id.startsWith("temp_")) {
      const updated = variants.filter((v) => v.id !== variant.id);
      setVariants(updated);
      toast.success("Unsaved variant removed");
      return;
    }

    // For existing saved variants, prompt to deactivate or remove
    setAlertTargetVariant(variant);
    setAlertAction("deactivate");
    setAlertOpen(true);
  };

  // Execute confirmation action
  const handleConfirmAlert = () => {
    if (!alertTargetVariant) return;

    if (alertAction === "deactivate") {
      // Deactivate variant
      const updated = variants.map((v) => {
        if (v.id === alertTargetVariant.id) {
          return { ...v, isActive: false, isModified: true };
        }
        return v;
      });
      setVariants(updated);
      toast.success("Variant deactivated");
    } else {
      // Hard delete from form state
      if (onRemoveExistingVariant) {
        onRemoveExistingVariant(alertTargetVariant.id);
      } else {
        setVariants(variants.filter((v) => v.id !== alertTargetVariant.id));
      }
      toast.success("Variant removed");
    }

    setAlertOpen(false);
    setAlertTargetVariant(null);
  };

  // Combinations generator preview calculations
  const prospectiveCombinations = useMemo(() => {
    const items: Array<{
      size: string;
      color: string;
      colorHex?: string | null;
      sku: string;
      exists: boolean;
    }> = [];

    const sizes = genSelectedSizes;
    const colors = genColorMode === "sizeOnly" ? [""] : genSelectedColors;

    sizes.forEach((sz) => {
      colors.forEach((col) => {
        const preset = PRESET_COLORS.find(
          (c) => c.name.toLowerCase() === col.toLowerCase()
        );
        const colHex = preset ? preset.hex : null;
        const suggested = generateSuggestedSku(baseProduct.name, sz, col);

        const exists = variants.some((v) => {
          const vColor = v.color ? v.color.trim().toLowerCase() : "";
          const curColor = col ? col.trim().toLowerCase() : "";
          return v.size === sz && vColor === curColor;
        });

        items.push({
          size: sz,
          color: col,
          colorHex: colHex,
          sku: suggested,
          exists,
        });
      });
    });

    return items;
  }, [genSelectedSizes, genColorMode, genSelectedColors, baseProduct.name, variants]);

  const newCombinationsCount = prospectiveCombinations.filter((c) => !c.exists).length;

  // Add generated combinations
  const handleApplyCombinations = () => {
    const priceNum = parseFloat(genPrice) || baseProduct.basePrice || 1000;
    const offerNum = genOfferPrice.trim() ? parseFloat(genOfferPrice) : null;
    const qtyNum = parseInt(genQty, 10) || 10;

    const toAdd: AbayaVariantItem[] = [];

    prospectiveCombinations.forEach((item) => {
      if (item.exists) return; // Do not overwrite existing variants!

      // Ensure distinct SKU in case generated candidate matches existing
      let distinctSku = item.sku;
      let counter = 1;
      while (
        variants.some((v) => v.sku.toUpperCase() === distinctSku.toUpperCase()) ||
        toAdd.some((v) => v.sku.toUpperCase() === distinctSku.toUpperCase())
      ) {
        distinctSku = `${item.sku}-${counter++}`;
      }

      toAdd.push({
        id: `temp_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        size: item.size,
        color: item.color,
        colorHex: item.colorHex,
        sku: distinctSku,
        price: priceNum,
        offerPrice: offerNum,
        qty: qtyNum,
        isActive: true,
        isNew: true,
      });
    });

    if (toAdd.length === 0) {
      toast.info("All selected combinations already exist in this product.");
    } else {
      setVariants([...variants, ...toAdd]);
      toast.success(`Generated ${toAdd.length} new variant${toAdd.length > 1 ? "s" : ""}`);
    }

    setPreviewOpen(false);
    setGeneratorOpen(false);
  };

  return (
    <Card className="w-full shadow-xs border-gray-200 dark:border-white/10">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-3 border-b border-gray-100 dark:border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
              Abaya Product Variants
            </CardTitle>
            <Badge variant="secondary" className="text-xs font-semibold px-2 py-0.5">
              {variants.length} Variant{variants.length === 1 ? "" : "s"}
            </Badge>
          </div>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Configure abaya size lengths (50–62), colorways, SKUs, pricing, and stock inventory.
          </CardDescription>
        </div>

        <div className="flex items-center gap-2">
          {/* Combinations Generator Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setGenPrice(baseProduct.basePrice > 0 ? String(baseProduct.basePrice) : "");
              setGenOfferPrice(baseProduct.baseDiscountPrice > 0 ? String(baseProduct.baseDiscountPrice) : "");
              setGenQty(baseProduct.baseQuantity > 0 ? String(baseProduct.baseQuantity) : "10");
              setGeneratorOpen(true);
            }}
            className="h-9 gap-1.5 rounded-lg border-gray-200 dark:border-white/10 text-xs font-medium text-[#5C1A24] dark:text-[#D29A90] hover:bg-[#F5EDE6]/50"
          >
            <Sparkles className="size-3.5 text-[#C6A477]" />
            Generate Combinations
          </Button>

          {/* Add Single Variant Button */}
          <Button
            type="button"
            size="sm"
            onClick={handleOpenAddModal}
            className="h-9 gap-1.5 rounded-lg bg-[#5C1A24] hover:bg-[#42121B] text-white text-xs font-medium shadow-2xs"
          >
            <Plus className="size-4" />
            Add Variant
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Backend SKU or General Error Banner */}
        {backendSkuError && (
          <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-xl">
            <AlertCircle className="size-4 shrink-0" />
            <span>{backendSkuError}</span>
          </div>
        )}

        {/* Duplicate SKU Warning Banner */}
        {duplicateSkus.size > 0 && (
          <div className="flex items-center gap-2 p-3 text-sm text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 rounded-xl">
            <AlertCircle className="size-4 shrink-0" />
            <span>
              Duplicate SKU detected:{" "}
              <strong>{Array.from(duplicateSkus).join(", ")}</strong>. Every variant SKU must be unique.
            </span>
          </div>
        )}

        {/* Variants Table */}
        {variants.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-gray-200 dark:border-white/10 rounded-2xl bg-gray-50/50 dark:bg-white/[0.01]">
            <Layers className="size-9 text-muted-foreground mx-auto mb-2 opacity-50" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              No variants configured yet
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
              Create individual size/color variants or use the combinations generator to populate abaya sizes 50 to 62.
            </p>
            <div className="flex justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setGeneratorOpen(true)}
                className="text-xs text-[#5C1A24] dark:text-[#D29A90] hover:bg-[#F5EDE6]/50"
              >
                <Sparkles className="size-3.5 mr-1 text-[#C6A477]" />
                Generate Combinations
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleOpenAddModal}
                className="text-xs bg-[#5C1A24] hover:bg-[#42121B] text-white"
              >
                <Plus className="size-3.5 mr-1" />
                Add Single Variant
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.02] text-muted-foreground uppercase tracking-wider font-semibold">
                  <th className="py-3 px-3 min-w-[55px]">Image</th>
                  <th className="py-3 px-3 min-w-[70px]">Size</th>
                  <th className="py-3 px-3 min-w-[120px]">Color</th>
                  <th className="py-3 px-3 min-w-[150px]">SKU</th>
                  <th className="py-3 px-3 min-w-[100px]">Price</th>
                  <th className="py-3 px-3 min-w-[100px]">Offer Price</th>
                  <th className="py-3 px-3 min-w-[90px]">Stock</th>
                  <th className="py-3 px-3 min-w-[80px]">Status</th>
                  <th className="py-3 px-3 text-right min-w-[110px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {variants.map((v) => {
                  const isDuplicateSku = duplicateSkus.has(v.sku.trim().toUpperCase());
                  return (
                    <tr
                      key={v.id}
                      className={cn(
                        "transition-colors hover:bg-gray-50/50 dark:hover:bg-white/[0.01]",
                        !v.isActive && "opacity-60 bg-gray-50/40 dark:bg-white/[0.01]"
                      )}
                    >
                      {/* Variant Image */}
                      <td className="py-3 px-3 align-middle">
                        {v.image ? (
                          <div className="size-8 rounded-md border border-gray-200 dark:border-white/10 overflow-hidden relative bg-white dark:bg-[#141414] flex items-center justify-center shrink-0">
                            <Image
                              src={typeof v.image === "string" ? v.image : URL.createObjectURL(v.image)}
                              alt={v.sku}
                              width={32}
                              height={32}
                              unoptimized
                              className="size-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="size-8 rounded-md border border-dashed border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-300 dark:text-gray-600 shrink-0">
                            <ImageIcon className="size-3.5" />
                          </div>
                        )}
                      </td>

                      {/* Size */}
                      <td className="py-3 px-3 align-middle font-bold text-gray-900 dark:text-white">
                        <span
                          className={cn(
                            "inline-flex items-center justify-center px-2 py-1 rounded-lg text-xs font-semibold border",
                            v.size.toLowerCase().includes("free")
                              ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/40"
                              : v.size.toLowerCase().includes("custom") || v.size.toLowerCase().includes("measure")
                              ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40"
                              : "bg-[#F5EDE6] dark:bg-[#5C1A24]/30 text-[#5C1A24] dark:text-[#D29A90] font-mono border-[#DCC1B9] dark:border-white/10"
                          )}
                        >
                          {v.size.startsWith("Size ") || v.size.toLowerCase().includes("free") || v.size.toLowerCase().includes("custom")
                            ? v.size
                            : `Size ${v.size}`}
                        </span>
                      </td>

                      {/* Color */}
                      <td className="py-3 px-3 align-middle">
                        {v.color ? (
                          <div className="flex items-center gap-2">
                            {v.colorHex && (
                              <span
                                className="size-3.5 rounded-full border border-gray-300 dark:border-white/20 shrink-0 shadow-2xs"
                                style={{ backgroundColor: v.colorHex }}
                              />
                            )}
                            <span className="font-medium text-gray-800 dark:text-gray-200">
                              {v.color}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-[11px]">
                            {NO_COLOR_LABEL}
                          </span>
                        )}
                      </td>

                      {/* SKU */}
                      <td className="py-3 px-3 align-middle">
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={cn(
                              "font-mono font-medium",
                              isDuplicateSku
                                ? "text-red-600 dark:text-red-400 font-bold"
                                : "text-gray-700 dark:text-gray-300"
                            )}
                          >
                            {v.sku}
                          </span>
                          {isDuplicateSku && (
                            <span className="text-[10px] text-red-500 font-sans font-medium">
                              Duplicate SKU
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-3 align-middle font-semibold text-gray-900 dark:text-white">
                        {formatMoney(v.price)}
                      </td>

                      {/* Offer Price */}
                      <td className="py-3 px-3 align-middle">
                        {v.offerPrice != null && v.offerPrice > 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            {formatMoney(v.offerPrice)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>

                      {/* Stock Quantity */}
                      <td className="py-3 px-3 align-middle">
                        <span
                          className={cn(
                            "font-semibold",
                            v.qty > 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-600 dark:text-red-400"
                          )}
                        >
                          {v.qty}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 align-middle">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(v.id)}
                          className="cursor-pointer"
                          title={v.isActive ? "Click to deactivate" : "Click to activate"}
                        >
                          <Badge
                            variant={v.isActive ? "default" : "outline"}
                            className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors",
                              v.isActive
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                                : "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400"
                            )}
                          >
                            {v.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 align-middle text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Matching Products */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setVariantProductsTarget(v)}
                            className="size-7 p-0 rounded-lg text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                            title="Show catalog products with this variant"
                          >
                            <Package className="size-3.5" />
                          </Button>

                          {/* Edit */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditModal(v)}
                            className="size-7 p-0 rounded-lg text-gray-600 hover:text-[#5C1A24] hover:bg-[#F5EDE6] dark:hover:bg-[#5C1A24]/20"
                            title="Edit variant"
                          >
                            <Edit2 className="size-3.5" />
                          </Button>

                          {/* Duplicate */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicateVariant(v)}
                            className="size-7 p-0 rounded-lg text-gray-600 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40"
                            title="Duplicate variant with new SKU"
                          >
                            <Copy className="size-3.5" />
                          </Button>

                          {/* Deactivate or Remove */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePromptDelete(v)}
                            className="size-7 p-0 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                            title={v.isNew ? "Remove unsaved variant" : "Deactivate/Remove variant"}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {/* ========================================================================= */}
      {/* ADD / EDIT SINGLE VARIANT DIALOG                                           */}
      {/* ========================================================================= */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingVariantId ? "Edit Abaya Variant" : "Add Abaya Variant"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure size, color, SKU, price, and stock for this product variant.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Combination Error Alert */}
            {formErrors.combo && (
              <div className="p-2.5 text-xs text-red-600 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900/40 flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{formErrors.combo}</span>
              </div>
            )}

            {/* Size Selector with Flexible Modes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="variant-size" className="text-xs font-semibold">
                  Abaya Size (Length) <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-3 text-xs">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="sizeMode"
                      checked={formSizeType === "preset"}
                      onChange={() => {
                        setFormSizeType("preset");
                        updateFormSize("54");
                      }}
                      className="text-xs"
                    />
                    Preset
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="sizeMode"
                      checked={formSizeType === "custom"}
                      onChange={() => {
                        setFormSizeType("custom");
                        const val = formCustomSize.trim() || "55";
                        setFormCustomSize(val);
                        updateFormSize(val);
                      }}
                      className="text-xs"
                    />
                    Custom
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="sizeMode"
                      checked={formSizeType === "free"}
                      onChange={() => {
                        setFormSizeType("free");
                        updateFormSize("Free Size");
                      }}
                      className="text-xs"
                    />
                    Free Size
                  </label>
                </div>
              </div>

              {formSizeType === "preset" && (
                <Select
                  value={formSize}
                  onValueChange={(val) => {
                    if (val === "Free Size") {
                      setFormSizeType("free");
                      updateFormSize("Free Size");
                    } else if (val === "custom_mode") {
                      setFormSizeType("custom");
                      const valCustom = formCustomSize.trim() || "55";
                      setFormCustomSize(valCustom);
                      updateFormSize(valCustom);
                    } else {
                      updateFormSize(val);
                    }
                  }}
                >
                  <SelectTrigger id="variant-size" className="h-9 text-xs">
                    <SelectValue placeholder="Select abaya size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="header-std" disabled className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Standard Abaya Lengths</SelectItem>
                    {ABAYA_SIZES.map((s) => (
                      <SelectItem key={s} value={s} className="text-xs">
                        Size {s} ({s}&quot; length)
                      </SelectItem>
                    ))}
                    <SelectItem value="header-flex" disabled className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pt-1 border-t">Flexible Sizing</SelectItem>
                    <SelectItem value="Free Size" className="text-xs font-medium text-purple-600 dark:text-purple-400">
                      ✦ Free Size (Universal Flowy Fit)
                    </SelectItem>
                    <SelectItem value="custom_mode" className="text-xs font-medium text-amber-600 dark:text-amber-400">
                      ✎ Custom Size (Specify Custom Inches)...
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}

              {formSizeType === "custom" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      id="variant-custom-size"
                      value={formCustomSize}
                      onChange={(e) => {
                        setFormCustomSize(e.target.value);
                        updateFormSize(e.target.value);
                      }}
                      placeholder="e.g. 55 or Custom (Length 55, Bust 44)"
                      className="h-9 text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormSizeType("preset");
                        updateFormSize("54");
                      }}
                      className="h-9 text-xs shrink-0"
                    >
                      Preset Sizes
                    </Button>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-muted-foreground">Quick:</span>
                    {["53", "55", "57", "59", "Made to Measure", "Petite Cut", "Tall Cut"].map((sugg) => (
                      <button
                        key={sugg}
                        type="button"
                        onClick={() => {
                          setFormCustomSize(sugg);
                          updateFormSize(sugg);
                        }}
                        className="px-2 py-0.5 rounded text-[11px] bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                      >
                        {sugg}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {formSizeType === "free" && (
                <div className="p-2.5 rounded-lg bg-[#F5EDE6]/60 dark:bg-[#5C1A24]/20 border border-[#DCC1B9] dark:border-white/10 text-xs text-[#5C1A24] dark:text-[#D29A90] flex items-center justify-between">
                  <span className="font-medium">Free Size / One Size (Flowy universal fit)</span>
                  <Badge variant="secondary" className="text-[10px] bg-[#EAD9D2] dark:bg-[#5C1A24]/60 text-[#5C1A24] dark:text-[#D29A90]">
                    Flexible Sizing
                  </Badge>
                </div>
              )}

              {formErrors.size && (
                <p className="text-[11px] text-red-500">{formErrors.size}</p>
              )}
            </div>

            {/* Color Option Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Color Selection</Label>
                <div className="flex items-center gap-3 text-xs">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="colorMode"
                      checked={formColorType === "preset"}
                      onChange={() => {
                        setFormColorType("preset");
                        updateFormColor("Black", "#000000");
                      }}
                      className="text-xs"
                    />
                    Preset
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="colorMode"
                      checked={formColorType === "custom"}
                      onChange={() => {
                        setFormColorType("custom");
                        updateFormColor(formColor || "Custom Color", formColorHex || "#333333");
                      }}
                      className="text-xs"
                    />
                    Custom
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="colorMode"
                      checked={formColorType === "none"}
                      onChange={() => {
                        setFormColorType("none");
                        setFormColor("");
                        setFormColorHex("");
                        if (!skuManuallyEdited) {
                          setFormSku(generateSuggestedSku(baseProduct.name, formSize, ""));
                        }
                      }}
                      className="text-xs"
                    />
                    No Color (Size Only)
                  </label>
                </div>
              </div>

              {formColorType === "preset" && (
                <div className="space-y-2">
                  <Select
                    value={formColor}
                    onValueChange={(val) => {
                      const preset = PRESET_COLORS.find((c) => c.name === val);
                      updateFormColor(val, preset ? preset.hex : "#000000");
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRESET_COLORS.map((c) => (
                        <SelectItem key={c.name} value={c.name} className="text-xs">
                          <div className="flex items-center gap-2">
                            <span
                              className="size-3 rounded-full border border-gray-300"
                              style={{ backgroundColor: c.hex }}
                            />
                            <span>{c.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formColorType === "custom" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Color Name</Label>
                    <Input
                      value={formColor}
                      onChange={(e) => updateFormColor(e.target.value)}
                      placeholder="e.g. Sage Green"
                      className="h-9 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Hex Code (Optional)</Label>
                    <div className="flex items-center gap-1.5 mt-1">
                      <input
                        type="color"
                        value={formColorHex || "#000000"}
                        onChange={(e) => setFormColorHex(e.target.value)}
                        className="size-9 rounded-md border border-gray-200 cursor-pointer p-0.5 bg-transparent"
                      />
                      <Input
                        value={formColorHex || ""}
                        onChange={(e) => setFormColorHex(e.target.value)}
                        placeholder="#000000"
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {formErrors.colorHex && (
                <p className="text-[11px] text-red-500">{formErrors.colorHex}</p>
              )}
            </div>

            {/* SKU with Generator */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="variant-sku" className="text-xs font-semibold">
                  SKU <span className="text-red-500">*</span>
                </Label>
                <button
                  type="button"
                  onClick={() => {
                    const col = formColorType === "none" ? "" : formColor;
                    const suggested = generateSuggestedSku(baseProduct.name, formSize, col);
                    setFormSku(suggested);
                    setSkuManuallyEdited(false);
                  }}
                  className="text-[11px] text-[#5C1A24] dark:text-[#D29A90] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  <RefreshCw className="size-3" />
                  Regenerate SKU
                </button>
              </div>
              <Input
                id="variant-sku"
                value={formSku}
                onChange={(e) => {
                  setFormSku(e.target.value);
                  setSkuManuallyEdited(true);
                }}
                placeholder="e.g. MDS-NOOR-BLK-54"
                className="h-9 text-xs font-mono"
              />
              {formErrors.sku && (
                <p className="text-[11px] text-red-500">{formErrors.sku}</p>
              )}
            </div>

            {/* Pricing Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="variant-price" className="text-xs font-semibold">
                  Regular Price <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="variant-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="0.00"
                  className="h-9 text-xs"
                />
                {formErrors.price && (
                  <p className="text-[11px] text-red-500">{formErrors.price}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="variant-offer-price" className="text-xs font-semibold">
                  Offer Price (Optional)
                </Label>
                <Input
                  id="variant-offer-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formOfferPrice}
                  onChange={(e) => setFormOfferPrice(e.target.value)}
                  placeholder="0.00"
                  className="h-9 text-xs"
                />
                {formErrors.offerPrice && (
                  <p className="text-[11px] text-red-500">{formErrors.offerPrice}</p>
                )}
              </div>
            </div>

            {/* Stock Quantity & Active Status */}
            <div className="grid grid-cols-2 gap-3 items-center">
              <div className="space-y-1.5">
                <Label htmlFor="variant-qty" className="text-xs font-semibold">
                  Stock Quantity <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="variant-qty"
                  type="number"
                  step="1"
                  min="0"
                  value={formQty}
                  onChange={(e) => setFormQty(e.target.value)}
                  placeholder="10"
                  className="h-9 text-xs"
                />
                {formErrors.qty && (
                  <p className="text-[11px] text-red-500">{formErrors.qty}</p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-5">
                <Checkbox
                  id="variant-active"
                  checked={formIsActive}
                  onCheckedChange={(checked) => setFormIsActive(Boolean(checked))}
                />
                <Label
                  htmlFor="variant-active"
                  className="text-xs font-medium cursor-pointer"
                >
                  Active for Sale
                </Label>
              </div>
            </div>

            {/* Variant Image (Optional) */}
            <div className="space-y-1.5 pt-1 border-t border-gray-100 dark:border-white/5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">
                  Variant Image <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                </Label>
                {formImage && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormImage(null);
                      setFormImagePreview(null);
                    }}
                    className="text-[11px] text-red-500 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <X className="size-3" />
                    Remove Image
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3 p-2.5 border rounded-xl border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
                <div className="size-14 rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden bg-white dark:bg-[#141414] flex items-center justify-center shrink-0">
                  {formImagePreview ? (
                    <Image
                      src={formImagePreview}
                      alt="Variant preview"
                      width={56}
                      height={56}
                      unoptimized
                      className="size-full object-cover"
                    />
                  ) : (
                    <ImagePlus className="size-5 text-gray-300 dark:text-gray-600" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-[11px] text-muted-foreground">
                    Upload an individual photo for this specific color/size variant.
                  </p>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-md text-xs font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-white/15 transition-colors shadow-2xs">
                    <ImagePlus className="size-3 text-gray-600 dark:text-gray-300" />
                    <span>{formImage ? "Change Image" : "Upload Variant Image"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setFormImage(file);
                          setFormImagePreview(URL.createObjectURL(file));
                        }
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-gray-100 dark:border-white/5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveModalVariant}
              className="text-xs h-9 bg-[#5C1A24] hover:bg-[#42121B] text-white"
            >
              {editingVariantId ? "Update Variant" : "Add Variant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* COMBINATIONS GENERATOR MODAL                                              */}
      {/* ========================================================================= */}
      <Dialog open={generatorOpen} onOpenChange={setGeneratorOpen}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="size-4 text-[#C6A477]" />
              Generate Abaya Variations
            </DialogTitle>
            <DialogDescription className="sr-only">
              Bulk-create variations for sizes and colors without overwriting existing variants.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Sizes Multi-Select */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Select Sizes</Label>
                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setGenSelectedSizes([...ABAYA_SIZES])}
                    className="text-[#5C1A24] dark:text-[#D29A90] font-medium hover:underline cursor-pointer"
                  >
                    Standard Sizes
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => setGenSelectedSizes([...ABAYA_SIZES, ...FLEXIBLE_SIZES])}
                    className="text-[#5C1A24] dark:text-[#D29A90] font-medium hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => setGenSelectedSizes([])}
                    className="text-muted-foreground hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ABAYA_SIZES.map((sz) => {
                  const isSelected = genSelectedSizes.includes(sz);
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setGenSelectedSizes(genSelectedSizes.filter((s) => s !== sz));
                        } else {
                          setGenSelectedSizes([...genSelectedSizes, sz]);
                        }
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors border cursor-pointer",
                        isSelected
                          ? "bg-[#5C1A24] text-white border-[#5C1A24]"
                          : "bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:bg-gray-50"
                      )}
                    >
                      Size {sz}
                    </button>
                  );
                })}

                {/* Flexible Sizing Options */}
                {FLEXIBLE_SIZES.map((sz) => {
                  const isSelected = genSelectedSizes.includes(sz);
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setGenSelectedSizes(genSelectedSizes.filter((s) => s !== sz));
                        } else {
                          setGenSelectedSizes([...genSelectedSizes, sz]);
                        }
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border cursor-pointer",
                        isSelected
                          ? "bg-[#8D414A] text-white border-[#8D414A]"
                          : "bg-[#F5EDE6]/60 dark:bg-white/5 text-[#5C1A24] dark:text-[#D29A90] border-[#DCC1B9] dark:border-white/10 hover:bg-[#F5EDE6]"
                      )}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Mode */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Colors</Label>
                <div className="flex items-center gap-3 text-xs">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="genColorMode"
                      checked={genColorMode === "colors"}
                      onChange={() => setGenColorMode("colors")}
                    />
                    Colorways
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="genColorMode"
                      checked={genColorMode === "sizeOnly"}
                      onChange={() => setGenColorMode("sizeOnly")}
                    />
                    Size Only (No Color)
                  </label>
                </div>
              </div>

              {genColorMode === "colors" && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_COLORS.map((c) => {
                      const isSelected = genSelectedColors.includes(c.name);
                      return (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setGenSelectedColors(genSelectedColors.filter((col) => col !== c.name));
                            } else {
                              setGenSelectedColors([...genSelectedColors, c.name]);
                            }
                          }}
                          className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border cursor-pointer transition-colors",
                            isSelected
                              ? "bg-[#F5EDE6] border-[#5C1A24] text-[#5C1A24] dark:bg-[#5C1A24]/30 dark:text-white font-semibold"
                              : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50"
                          )}
                        >
                          <span
                            className="size-2.5 rounded-full border border-gray-300"
                            style={{ backgroundColor: c.hex }}
                          />
                          <span>{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Default Price and Stock for batch */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div>
                <Label className="text-[11px] font-semibold">Regular Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={genPrice}
                  onChange={(e) => setGenPrice(e.target.value)}
                  placeholder={baseProduct.basePrice ? String(baseProduct.basePrice) : "0.00"}
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-[11px] font-semibold">Offer Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={genOfferPrice}
                  onChange={(e) => setGenOfferPrice(e.target.value)}
                  placeholder="Optional"
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-[11px] font-semibold">Initial Stock</Label>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  value={genQty}
                  onChange={(e) => setGenQty(e.target.value)}
                  placeholder="10"
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-gray-100 dark:border-white/5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setGeneratorOpen(false)}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={genSelectedSizes.length === 0 || (genColorMode === "colors" && genSelectedColors.length === 0)}
              onClick={() => setPreviewOpen(true)}
              className="text-xs h-9 bg-[#5C1A24] hover:bg-[#42121B] text-white font-medium"
            >
              Preview Combinations ({prospectiveCombinations.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* PREVIEW COMBINATIONS DIALOG                                               */}
      {/* ========================================================================= */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center justify-between">
              <span>Preview Combinations</span>
              <Badge variant="outline" className="text-xs font-normal">
                {newCombinationsCount} New · {prospectiveCombinations.length - newCombinationsCount} Existing
              </Badge>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Existing combinations will not be overwritten. Only new variants will be added.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[300px] overflow-y-auto space-y-1.5 py-2 border rounded-xl p-2 bg-gray-50/50 dark:bg-white/[0.01] border-gray-200 dark:border-white/10">
            {prospectiveCombinations.map((c, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center justify-between p-2 rounded-lg text-xs border transition-colors",
                  c.exists
                    ? "bg-gray-100/70 dark:bg-white/5 border-gray-200 dark:border-white/10 opacity-60"
                    : "bg-white dark:bg-[#181818] border-gray-200 dark:border-white/10"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#5C1A24] dark:text-[#D29A90]">
                    Size {c.size}
                  </span>
                  <span>·</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {c.color || NO_COLOR_LABEL}
                  </span>
                  <span>·</span>
                  <span className="font-mono text-muted-foreground">{c.sku}</span>
                </div>

                <div>
                  {c.exists ? (
                    <Badge variant="secondary" className="text-[10px] text-muted-foreground">
                      Already exists (kept)
                    </Badge>
                  ) : (
                    <Badge className="text-[10px] bg-emerald-600 text-white">
                      Will add
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-gray-100 dark:border-white/5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPreviewOpen(false)}
              className="text-xs h-9"
            >
              Back
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={newCombinationsCount === 0}
              onClick={handleApplyCombinations}
              className="text-xs h-9 bg-[#5C1A24] hover:bg-[#42121B] text-white font-medium"
            >
              Confirm &amp; Add ({newCombinationsCount}) Combinations
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* SAFE EDITING / DEACTIVATION ALERT DIALOG                                  */}
      {/* ========================================================================= */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">
              Existing Variant Action
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs space-y-2">
              <p>
                Variant <strong>{alertTargetVariant?.sku}</strong> (Size {alertTargetVariant?.size}{" "}
                {alertTargetVariant?.color ? `/ ${alertTargetVariant.color}` : ""}) already exists in your store.
              </p>
              <p className="text-amber-600 dark:text-amber-400 font-medium">
                Deactivating rather than deleting is recommended to protect existing order history and fulfillment records.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                setAlertAction("delete");
                handleConfirmAlert();
              }}
              className="text-xs"
            >
              Delete Permanently
            </Button>
            <AlertDialogAction
              onClick={() => {
                setAlertAction("deactivate");
                handleConfirmAlert();
              }}
              className="text-xs bg-[#5C1A24] hover:bg-[#42121B] text-white"
            >
              Deactivate Safely
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ========================================================================= */}
      {/* SHOW PRODUCTS MATCHING THIS VARIANT DIALOG                                 */}
      {/* ========================================================================= */}
      <Dialog
        open={Boolean(variantProductsTarget)}
        onOpenChange={(open) => {
          if (!open) setVariantProductsTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-gray-900 dark:text-white">
              <Package className="size-4 text-[#5C1A24]" />
              Products Matching Variant
            </DialogTitle>
            <DialogDescription className="sr-only">
              Showing boutique catalog abayas configured with Size {variantProductsTarget?.size}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 max-h-[380px] overflow-y-auto">
            {matchingProducts.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-xl">
                <Package className="size-8 mx-auto mb-2 text-muted-foreground/50" />
                No other catalog products currently assigned to this variant.
              </div>
            ) : (
              matchingProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] hover:bg-gray-100/50 dark:hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative size-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 dark:border-white/10 shrink-0">
                      <Image
                        src={p.image || "/images/products/1.webp"}
                        alt={p.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-gray-900 dark:text-white">
                        {p.name}
                      </h4>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        {p.sku} • {p.category}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-semibold text-[#5C1A24] dark:text-[#D29A90]">
                          {formatMoney(p.price)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Stock: {p.stock} pcs
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link href={`/products`} target="_blank">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="size-8 p-0 text-gray-600 hover:text-[#5C1A24]"
                      title="View product in catalog"
                    >
                      <ExternalLink className="size-4" />
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </div>

          <DialogFooter className="flex items-center justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setVariantProductsTarget(null)}
              className="text-xs"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Wrapper for Create Mode (inside ConfigurableProductProvider)
function CreateAbayaVariantsWrapper(props: { backendSkuError?: string | null }) {
  const ctx = useConfigurableProduct();
  const variants: AbayaVariantItem[] = useMemo(() => {
    return (ctx.variants || []).map((v) => ({
      id: v.id,
      size: v.size || (v.attributes?.[0]?.value) || "54",
      color: v.color || (v.attributes?.[1]?.value) || "",
      colorHex: v.colorHex || null,
      sku: v.sku || `MDS-TEMP-${v.id}`,
      price: v.price ?? (ctx.baseProduct.basePrice || 0),
      offerPrice: v.offerPrice ?? (ctx.baseProduct.baseDiscountPrice || null),
      qty: v.qty ?? (ctx.baseProduct.baseQuantity || 0),
      isActive: v.isActive !== false,
      isNew: true,
    }));
  }, [ctx.variants, ctx.baseProduct.basePrice, ctx.baseProduct.baseDiscountPrice, ctx.baseProduct.baseQuantity]);

  return (
    <AbayaVariantsManagerUI
      mode="create"
      baseProduct={ctx.baseProduct}
      variants={variants}
      setVariants={(updated) => {
        ctx.setVariants(
          updated.map((u) => ({
            id: u.id,
            size: u.size,
            color: u.color,
            colorHex: u.colorHex,
            sku: u.sku,
            price: u.price,
            offerPrice: u.offerPrice,
            qty: u.qty,
            isActive: u.isActive,
            isNew: true,
            images: [],
            attributes: [
              { attributeId: "size", valueId: u.size, attributeName: "Size", value: u.size },
              ...(u.color ? [{ attributeId: "color", valueId: u.color, attributeName: "Color", value: u.color }] : []),
            ],
          }))
        );
      }}
      onRemoveExistingVariant={(id) => ctx.removeVariant(id)}
      backendSkuError={props.backendSkuError}
    />
  );
}

// Wrapper for Edit Mode (inside EditProductProvider)
function EditAbayaVariantsWrapper(props: { backendSkuError?: string | null }) {
  const ctx = useEditProduct();
  const variants: AbayaVariantItem[] = useMemo(() => {
    return (ctx.variants || []).map((v) => ({
      id: v.id,
      size: v.size || (v.attributes?.[0]?.value) || "54",
      color: v.color || (v.attributes?.[1]?.value) || "",
      colorHex: v.colorHex || null,
      sku: v.sku || `MDS-TEMP-${v.id}`,
      price: v.price ?? (ctx.baseProduct.basePrice || 0),
      offerPrice: v.offerPrice ?? (ctx.baseProduct.baseDiscountPrice || null),
      qty: v.qty ?? (ctx.baseProduct.baseQuantity || 0),
      isActive: v.isActive !== false,
      isNew: v.isNew,
      isModified: v.isModified,
      reservations: v.reservations,
      image: v.image || (v.images?.[0] as any) || null,
    }));
  }, [ctx.variants, ctx.baseProduct.basePrice, ctx.baseProduct.baseDiscountPrice, ctx.baseProduct.baseQuantity]);

  return (
    <AbayaVariantsManagerUI
      mode="edit"
      baseProduct={ctx.baseProduct}
      variants={variants}
      setVariants={(updated) => {
        ctx.setVariants(
          updated.map((u) => ({
            id: u.id,
            size: u.size,
            color: u.color,
            colorHex: u.colorHex,
            sku: u.sku,
            price: u.price,
            offerPrice: u.offerPrice,
            qty: u.qty,
            isActive: u.isActive,
            isNew: !!u.isNew,
            isModified: !u.isNew,
            image: u.image || null,
            images: [],
            reservations: u.reservations,
            attributes: [
              { attributeId: "size", valueId: u.size, attributeName: "Size", value: u.size },
              ...(u.color ? [{ attributeId: "color", valueId: u.color, attributeName: "Color", value: u.color }] : []),
            ],
          }))
        );
      }}
      onRemoveExistingVariant={(id) => ctx.removeVariant(id)}
      backendSkuError={props.backendSkuError}
    />
  );
}

export default function AbayaVariantsManager({
  mode,
  backendSkuError,
}: AbayaVariantsManagerProps) {
  if (mode === "create") {
    return <CreateAbayaVariantsWrapper backendSkuError={backendSkuError} />;
  }
  return <EditAbayaVariantsWrapper backendSkuError={backendSkuError} />;
}

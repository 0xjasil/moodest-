'use client';

import { useEffect, useState, useMemo } from 'react';
import { Plus, RefreshCcw, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Checkbox from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useConfigurableProduct } from '@/context/ConfigurableProductContext';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/apiFetch';

interface Category {
  id: string;
  name: string;
  children?: SubCategory[];
}

interface SubCategory {
  id: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
}

const DEFAULT_BRANDS: Brand[] = [
  { id: "brand-1", name: "Moodest Studio" },
  { id: "brand-2", name: "Noor Dubai" },
  { id: "brand-3", name: "Al-Jawhara" },
  { id: "brand-4", name: "Zahra Couture" },
  { id: "brand-5", name: "Amani Kaftans" },
];

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "cat-1",
    name: "Everyday Abayas",
    children: [
      { id: "sub-1", name: "Front Open Abayas" },
      { id: "sub-2", name: "Pull-over Closed Abayas" },
    ],
  },
  {
    id: "cat-2",
    name: "Hijabs & Stoles",
    children: [
      { id: "sub-3", name: "Malaysian Instant Stoles" },
    ],
  },
  {
    id: "cat-3",
    name: "Occasion & Luxury Abayas",
    children: [
      { id: "sub-4", name: "Hand-Embroidered Luxury" },
      { id: "sub-5", name: "Bridal Velvet Abayas" },
    ],
  },
];

const MAX_GALLERY_IMAGES = 10;

function ProductImageAndCategories() {
  const { baseProduct, updateBaseProduct } = useConfigurableProduct();
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [hoverImagePreview, setHoverImagePreview] = useState<string | null>(null);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [brands, setBrands] = useState<Brand[]>(DEFAULT_BRANDS);
  const [errors, setErrors] = useState({
    mainImage: false,
    hoverImage: false,
    brandId: false,
    categoryId: false,
  });

  // Keep preview in sync with baseProduct
  useEffect(() => {
    if (baseProduct.mainImage) {
      if (baseProduct.mainImage instanceof File) {
        setMainImagePreview(URL.createObjectURL(baseProduct.mainImage));
      } else if (typeof baseProduct.mainImage === 'string') {
        setMainImagePreview(baseProduct.mainImage);
      }
    }
    if (baseProduct.hoverImage) {
      if (baseProduct.hoverImage instanceof File) {
        setHoverImagePreview(URL.createObjectURL(baseProduct.hoverImage));
      } else if (typeof baseProduct.hoverImage === 'string') {
        setHoverImagePreview(baseProduct.hoverImage);
      }
    }
  }, [baseProduct.mainImage, baseProduct.hoverImage]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [categoriesResponse, brandsResponse] = await Promise.all([
          apiFetch(`/categories`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          apiFetch(`/brands`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ]);
        const catList: Category[] = Array.isArray(categoriesResponse)
          ? categoriesResponse
          : Array.isArray(categoriesResponse?.data)
          ? categoriesResponse.data
          : [];
        if (catList.length > 0) {
          setCategories(catList);
        }
        const brandList: Brand[] = Array.isArray(brandsResponse)
          ? brandsResponse
          : Array.isArray(brandsResponse?.data)
          ? brandsResponse.data
          : brandsResponse?.id
          ? [brandsResponse]
          : [];
        if (brandList.length > 0) {
          setBrands(brandList);
        }
      } catch (error) {
        console.warn("[configurable-product] Using default categories and brands:", error);
      }
    };
    fetchDropdownData();
  }, []);

  // Unified Category Options (combines parents and subcategories into 1 clean selector)
  const categoryOptions = useMemo(() => {
    const list: { id: string; label: string; categoryId: string; subCategoryId?: string; isParent: boolean }[] = [];
    categories.forEach((cat) => {
      list.push({
        id: `cat-${cat.id}`,
        label: cat.name,
        categoryId: cat.id,
        isParent: true,
      });
      if (cat.children && cat.children.length > 0) {
        cat.children.forEach((sub) => {
          list.push({
            id: `sub-${sub.id}`,
            label: `${cat.name} › ${sub.name}`,
            categoryId: cat.id,
            subCategoryId: sub.id,
            isParent: false,
          });
        });
      }
    });
    return list;
  }, [categories]);

  const selectedCategoryValue = useMemo(() => {
    if (baseProduct.subCategoryId) {
      return `sub-${baseProduct.subCategoryId}`;
    }
    if (baseProduct.categoryId) {
      return `cat-${baseProduct.categoryId}`;
    }
    return '';
  }, [baseProduct.categoryId, baseProduct.subCategoryId]);

  const handleCategoryChange = (val: string) => {
    const opt = categoryOptions.find((o) => o.id === val);
    if (opt) {
      updateBaseProduct({
        categoryId: opt.categoryId,
        subCategoryId: opt.subCategoryId || '',
      });
      setErrors((prev) => ({ ...prev, categoryId: false }));
    }
  };

  // 1. Thumbnail 1 (Primary / Always Shown) Handlers
  const handleBrowseMain = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainImagePreview(URL.createObjectURL(file));
      updateBaseProduct({ mainImage: file });
      setErrors((prev) => ({ ...prev, mainImage: false }));
    }
    e.target.value = '';
  };

  // 2. Thumbnail 2 (Hover / Shown on Hover) Handlers
  const handleBrowseHover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setHoverImagePreview(URL.createObjectURL(file));
      updateBaseProduct({ hoverImage: file });
      setErrors((prev) => ({ ...prev, hoverImage: false }));
    }
    e.target.value = '';
  };

  // 3. Additional Gallery Images Handlers (More than 1 Option)
  const handleAddGalleryImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList && fileList.length) {
      const newFiles = Array.from(fileList);
      const availableSlots = MAX_GALLERY_IMAGES - baseProduct.thumbnails.length;

      if (availableSlots <= 0) {
        toast.error(`Maximum ${MAX_GALLERY_IMAGES} gallery images allowed`);
        e.target.value = '';
        return;
      }

      const filesToAdd = newFiles.slice(0, availableSlots);
      const newThumbnails = [...baseProduct.thumbnails, ...filesToAdd];
      const newPreviews = [...galleryPreviews, ...filesToAdd.map((file) => URL.createObjectURL(file))];

      setGalleryPreviews(newPreviews);
      updateBaseProduct({ thumbnails: newThumbnails });

      if (newFiles.length > availableSlots) {
        toast.warning(`Only ${availableSlots} image(s) added. Maximum ${MAX_GALLERY_IMAGES} allowed`);
      }
    }
    e.target.value = '';
  };

  const removeGalleryImage = (idx: number) => {
    const newThumbnails = baseProduct.thumbnails.filter((_, i) => i !== idx);
    const newPreviews = galleryPreviews.filter((_, i) => i !== idx);

    setGalleryPreviews(newPreviews);
    updateBaseProduct({ thumbnails: newThumbnails });
  };

  return (
    <Card className="space-y-4 w-full">
      {/* ── Image Upload Section (Dual Hover Thumbnails + Multi-Gallery) ── */}
      <Card className="shadow-none border-none">
        <CardHeader className="py-4">
          <CardTitle>Upload Product Images</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {/* Primary Thumbnail */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                Primary Thumbnail <span className="text-red-500">*</span>
              </Label>
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-full">
                Always Shown
              </span>
            </div>
            <div
              className={`border rounded-lg p-3 bg-white dark:bg-[#141414] relative overflow-hidden flex flex-col justify-between ${
                errors.mainImage ? 'border-red-500' : 'border-gray-200 dark:border-white/10'
              }`}
              style={{ minHeight: 180 }}
            >
              <div className="flex justify-center items-center h-[120px] w-full">
                {mainImagePreview ? (
                  <Image
                    src={mainImagePreview}
                    alt="Primary Thumbnail"
                    width={400}
                    height={400}
                    unoptimized
                    className="max-h-[120px] w-auto object-contain rounded"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-1.5">
                    <ImageIcon size={36} className="stroke-[1.5]" />
                    <span className="text-xs">No primary image selected</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-white/5">
                <label className="flex-1 py-1.5 border border-gray-300 dark:border-white/15 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer flex items-center justify-center gap-2 text-sm font-medium transition-colors">
                  <ImageIcon size={14} />
                  Browse
                  <input type="file" accept="image/*" className="hidden" onChange={handleBrowseMain} />
                </label>
                {mainImagePreview && (
                  <label className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 rounded-lg cursor-pointer flex items-center justify-center gap-2 text-sm font-medium transition-colors">
                    <RefreshCcw size={14} />
                    Replace
                    <input type="file" accept="image/*" className="hidden" onChange={handleBrowseMain} />
                  </label>
                )}
              </div>
            </div>
            {errors.mainImage && <p className="text-xs text-red-500">Primary thumbnail is required</p>}
          </div>

          {/* Hover Thumbnail */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                Hover Thumbnail <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
              </Label>
              <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 dark:bg-indigo-950/50 dark:border-indigo-800 dark:text-indigo-300 px-2.5 py-0.5 rounded-full">
                Revealed on Hover
              </span>
            </div>
            <div
              className="border border-gray-200 dark:border-white/10 rounded-lg p-3 bg-white dark:bg-[#141414] relative overflow-hidden flex flex-col justify-between"
              style={{ minHeight: 180 }}
            >
              <div className="flex justify-center items-center h-[120px] w-full">
                {hoverImagePreview ? (
                  <Image
                    src={hoverImagePreview}
                    alt="Hover Thumbnail"
                    width={400}
                    height={400}
                    unoptimized
                    className="max-h-[120px] w-auto object-contain rounded"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-1.5">
                    <ImageIcon size={36} className="stroke-[1.5]" />
                    <span className="text-xs">No hover image selected</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-white/5">
                <label className="flex-1 py-1.5 border border-gray-300 dark:border-white/15 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer flex items-center justify-center gap-2 text-sm font-medium transition-colors">
                  <ImageIcon size={14} />
                  Browse
                  <input type="file" accept="image/*" className="hidden" onChange={handleBrowseHover} />
                </label>
                {hoverImagePreview && (
                  <>
                    <label className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 rounded-lg cursor-pointer flex items-center justify-center gap-2 text-sm font-medium transition-colors">
                      <RefreshCcw size={14} />
                      Replace
                      <input type="file" accept="image/*" className="hidden" onChange={handleBrowseHover} />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setHoverImagePreview(null);
                        updateBaseProduct({ hoverImage: null });
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg border border-transparent hover:border-red-200 dark:hover:border-red-900 transition-colors"
                      title="Remove hover image"
                    >
                      <X size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── Product Gallery Images (Older Design Horizontal Row) ── */}
          <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-white/5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Gallery Images ({baseProduct.thumbnails.length}/{MAX_GALLERY_IMAGES})
              </Label>
              <span className="text-xs text-muted-foreground">More than 1 image supported</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {galleryPreviews.map((preview, idx) => (
                <div
                  className="relative w-16 h-16 border border-gray-200 dark:border-white/10 rounded-md overflow-hidden bg-gray-50 dark:bg-white/5 flex items-center justify-center"
                  key={idx}
                >
                  <Image
                    src={preview}
                    alt={`Gallery ${idx + 1}`}
                    width={64}
                    height={64}
                    unoptimized
                    className="w-full h-full object-cover rounded"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-0.5 right-0.5 h-4 w-4 p-0.5 bg-white/80 dark:bg-black/80 hover:bg-white text-gray-700 dark:text-gray-200 rounded-full z-10"
                    onClick={() => removeGalleryImage(idx)}
                  >
                    <X size={10} />
                  </Button>
                </div>
              ))}

              {baseProduct.thumbnails.length < MAX_GALLERY_IMAGES && (
                <label className="w-16 h-16 border-2 border-dashed border-gray-300 dark:border-white/20 rounded-md flex flex-col items-center justify-center cursor-pointer bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-center transition-colors">
                  <Plus size={18} className="text-green-600 dark:text-green-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Add</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleAddGalleryImages} />
                </label>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Product Info & Single Category ── */}
      <Card className="shadow-none border-none">
        <CardHeader className="py-2">
          <CardTitle className="text-base font-semibold">Classification & Tags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-1">
          {/* Brand */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Brand <span className="text-red-500">*</span>
            </Label>
            <Select
              value={baseProduct.brandId || ''}
              onValueChange={(value) => {
                updateBaseProduct({ brandId: value });
                setErrors((prev) => ({ ...prev, brandId: false }));
              }}
            >
              <SelectTrigger className={`h-10 w-full rounded-xl text-sm ${errors.brandId ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.brandId && <p className="text-xs text-red-500">Brand is required</p>}
          </div>

          {/* ── SINGLE UNIFIED CATEGORY SELECTOR ── */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Category <span className="text-red-500">*</span>
              </Label>
              <span className="text-[11px] text-muted-foreground">Select main or subcategory</span>
            </div>
            <Select
              value={selectedCategoryValue}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger className={`h-10 w-full rounded-xl text-sm ${errors.categoryId ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {categoryOptions.map((opt) => (
                  <SelectItem
                    key={opt.id}
                    value={opt.id}
                    className={opt.isParent ? "font-semibold text-gray-900 dark:text-gray-100" : "pl-6 text-sm text-gray-600 dark:text-gray-300"}
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && <p className="text-xs text-red-500">Category is required</p>}
          </div>

          {/* Product Flags */}
          <div className="flex flex-wrap gap-6 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="customer-favorites" 
                checked={baseProduct.isCustomerFavorite}
                onCheckedChange={(checked) => {
                  updateBaseProduct({ isCustomerFavorite: !!checked });
                }}
              />
              <Label 
                htmlFor="customer-favorites"
                className="text-xs font-medium leading-none cursor-pointer text-gray-700 dark:text-gray-300"
              >
                Customer Favorites
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="new-arrivals" 
                checked={baseProduct.isNewArrival}
                onCheckedChange={(checked) => {
                  updateBaseProduct({ isNewArrival: !!checked });
                }}
              />
              <Label 
                htmlFor="new-arrivals"
                className="text-xs font-medium leading-none cursor-pointer text-gray-700 dark:text-gray-300"
              >
                New Arrivals
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>
    </Card>
  );
}

export default ProductImageAndCategories;

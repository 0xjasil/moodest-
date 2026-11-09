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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEditProduct } from '@/context/EcitProductContext';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/apiFetch';

interface SubCategory {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  children?: SubCategory[];
}

interface Brand {
  id: string;
  name: string;
}

const MAX_GALLERY_IMAGES = 10;

export default function EditProductImageAndCategories() {
  const { baseProduct, updateBaseProduct, isFileImage } = useEditProduct();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [errors, setErrors] = useState({
    mainImage: false,
    hoverImage: false,
    brandId: false,
    categoryId: false,
  });

  // Get preview URL for main image (handles both File and URL string)
  const getMainImagePreview = () => {
    if (!baseProduct.mainImage) return null;
    if (isFileImage(baseProduct.mainImage)) {
      return URL.createObjectURL(baseProduct.mainImage as File);
    }
    return baseProduct.mainImage as string;
  };

  // Get preview URL for hover image (handles both File and URL string)
  const getHoverImagePreview = () => {
    if (!baseProduct.hoverImage) return null;
    if (isFileImage(baseProduct.hoverImage)) {
      return URL.createObjectURL(baseProduct.hoverImage as File);
    }
    return baseProduct.hoverImage as string;
  };

  // Get preview URL for thumbnail (handles both File and URL string)
  const getThumbnailPreview = (image: File | string) => {
    if (isFileImage(image)) {
      return URL.createObjectURL(image as File);
    }
    return image as string;
  };

  // Fetch dropdown data on mount
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [categoriesRes, brandsRes] = await Promise.all([
          apiFetch(`/categories`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          apiFetch(`/brands`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ]);
        const categoriesData: Category[] = Array.isArray(categoriesRes)
          ? categoriesRes
          : Array.isArray(categoriesRes?.data)
          ? categoriesRes.data
          : [];
        const brandsData: Brand[] = Array.isArray(brandsRes)
          ? brandsRes
          : Array.isArray(brandsRes?.data)
          ? brandsRes.data
          : brandsRes?.id
          ? [brandsRes]
          : [];
        if (categoriesData.length > 0) {
          setCategories(categoriesData);
        }
        if (brandsData.length > 0) {
          setBrands(brandsData);
        }
      } catch (error) {
        console.warn('[EditProductImageAndCategories] Using defaults for dropdown data:', error);
      }
    };
    fetchDropdownData();
  }, []);

  // Unified Category Options
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

  // Handle main image browse / replace
  const handleBrowseMain = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateBaseProduct({ mainImage: file });
      setErrors((prev) => ({ ...prev, mainImage: false }));
    }
    e.target.value = '';
  };

  // Handle hover image browse / replace
  const handleBrowseHover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateBaseProduct({ hoverImage: file });
      setErrors((prev) => ({ ...prev, hoverImage: false }));
    }
    e.target.value = '';
  };

  // Handle adding gallery images
  const handleAddGalleryImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList && fileList.length) {
      const newFiles = Array.from(fileList);
      const availableSlots = MAX_GALLERY_IMAGES - (baseProduct.thumbnails || []).length;

      if (availableSlots <= 0) {
        toast.error(`Maximum ${MAX_GALLERY_IMAGES} gallery images allowed`);
        e.target.value = '';
        return;
      }

      const filesToAdd = newFiles.slice(0, availableSlots);
      const newThumbnails = [...(baseProduct.thumbnails || []), ...filesToAdd];

      updateBaseProduct({ thumbnails: newThumbnails });

      if (newFiles.length > availableSlots) {
        toast.warning(`Only ${availableSlots} image(s) added. Maximum ${MAX_GALLERY_IMAGES} allowed`);
      }
    }
    e.target.value = '';
  };

  // Remove a gallery thumbnail by index
  const removeGalleryImage = (idx: number) => {
    const newThumbnails = (baseProduct.thumbnails || []).filter((_, i) => i !== idx);
    updateBaseProduct({ thumbnails: newThumbnails });
  };

  const mainPreview = getMainImagePreview();
  const hoverPreview = getHoverImagePreview();

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
                {mainPreview ? (
                  <Image
                    src={mainPreview}
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
                {mainPreview && (
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
                {hoverPreview ? (
                  <Image
                    src={hoverPreview}
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
                {hoverPreview && (
                  <>
                    <label className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 rounded-lg cursor-pointer flex items-center justify-center gap-2 text-sm font-medium transition-colors">
                      <RefreshCcw size={14} />
                      Replace
                      <input type="file" accept="image/*" className="hidden" onChange={handleBrowseHover} />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
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

          {/* ── Product Gallery Images (Horizontal Row) ── */}
          <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-white/5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Gallery Images ({(baseProduct.thumbnails || []).length}/{MAX_GALLERY_IMAGES})
              </Label>
              <span className="text-xs text-muted-foreground">More than 1 image supported</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {(baseProduct.thumbnails || []).map((thumb, idx) => {
                const preview = getThumbnailPreview(thumb);
                return (
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
                );
              })}

              {(baseProduct.thumbnails || []).length < MAX_GALLERY_IMAGES && (
                <label className="w-16 h-16 border-2 border-dashed border-gray-300 dark:border-white/20 rounded-md flex flex-col items-center justify-center cursor-pointer bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-center transition-colors">
                  <Plus size={18} className="text-gray-500 dark:text-gray-400" />
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">Add</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleAddGalleryImages}
                  />
                </label>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Info */}
      <Card className="shadow-none border-none">
        <CardHeader className="py-4">
          <CardTitle>Product Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
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

          {/* Single Unified Category Selector */}
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
            {errors.categoryId && (
              <p className="text-xs text-red-500">Category is required</p>
            )}
          </div>
        </CardContent>
      </Card>
    </Card>
  );
}

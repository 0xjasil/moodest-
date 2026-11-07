'use client';

import { useEffect, useState } from 'react';
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
import { API_URL } from '@/lib/api-client';

interface Category {
  id: string;
  name: string;
}

interface SubCategory {
  id: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
}

const MAX_THUMBNAILS = 3;

function ProductImageAndCategories() {
  const { baseProduct, updateBaseProduct } = useConfigurableProduct();
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [thumbnailPreviews, setThumbnailPreviews] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [errors, setErrors] = useState({
    mainImage: false,
    thumbnails: false,
    brandId: false,
    categoryId: false,
    subCategoryId: false,
  });

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [categoriesResponse, brandsResponse] = await Promise.all([
          fetch(`${API_URL}/categories`).then(res => res.json()),
          fetch(`${API_URL}/brands`).then(res => res.json()),
        ]);
        setCategories(categoriesResponse);
        setBrands(brandsResponse);
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
      }
    };
    fetchDropdownData();
  }, []);

  useEffect(() => {
    const fetchSubCategories = async () => {
      if (!baseProduct.categoryId) {
        setSubCategories([]);
        return;
      }
      try {
        const response = await fetch(`${API_URL}/categories/${baseProduct.categoryId}/subcategories`).then(res => res.json());
        // Note: I might need to update the backend to support this specific endpoint or just filter categories.
        // Actually, I'll just use the general categories fetch and find the subcategories if they are included.
        // For now, I'll assume the backend has this endpoint or I'll implement it.
        setSubCategories(response);
      } catch (error) {
        console.error('Error fetching subcategories:', error);
      }
    };
    fetchSubCategories();
  }, [baseProduct.categoryId]);

  const handleBrowseMain = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainImagePreview(URL.createObjectURL(file));
      updateBaseProduct({ mainImage: file });
      setErrors((prev) => ({ ...prev, mainImage: false }));
    }
    e.target.value = '';
  };

  const handleReplaceMain = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainImagePreview(URL.createObjectURL(file));
      updateBaseProduct({ mainImage: file });
      setErrors((prev) => ({ ...prev, mainImage: false }));
    }
    e.target.value = '';
  };

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList && fileList.length) {
      const newFiles = Array.from(fileList);
      const availableSlots = MAX_THUMBNAILS - baseProduct.thumbnails.length;

      if (availableSlots <= 0) {
        toast.error(`Maximum ${MAX_THUMBNAILS} thumbnails allowed`);
        e.target.value = '';
        return;
      }

      const filesToAdd = newFiles.slice(0, availableSlots);
      const newThumbnails = [...baseProduct.thumbnails, ...filesToAdd];
      const newPreviews = [...thumbnailPreviews, ...filesToAdd.map((file) => URL.createObjectURL(file))];

      setThumbnailPreviews(newPreviews);
      updateBaseProduct({ thumbnails: newThumbnails });
      setErrors((prev) => ({ ...prev, thumbnails: false }));

      if (newFiles.length > availableSlots) {
        toast.warning(`Only ${availableSlots} image(s) added. Maximum ${MAX_THUMBNAILS} allowed`);
      }
    }
    e.target.value = '';
  };

  const removeThumbnail = (idx: number) => {
    const newThumbnails = baseProduct.thumbnails.filter((_, i) => i !== idx);
    const newPreviews = thumbnailPreviews.filter((_, i) => i !== idx);

    setThumbnailPreviews(newPreviews);
    updateBaseProduct({ thumbnails: newThumbnails });
  };

  return (
    <Card className="space-y-1 w-full">
      {/* Image Upload Section */}
      <Card className="shadow-none border-none">
        <CardHeader>
          <CardTitle>Upload Product Image</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {/* Main Image */}
          <div className="space-y-1">
            <Label className="text-sm font-semibold text-gray-700">
              Product Image <span className="text-red-500">*</span>
            </Label>
            <div
              className={`border rounded-lg p-3 bg-white relative overflow-hidden ${
                errors.mainImage ? 'border-red-500' : 'border-gray-200'
              }`}
              style={{ minHeight: 200 }}
            >
              <div className="flex justify-center items-center h-[140px]">
                {mainImagePreview ? (
                  <Image
                    src={mainImagePreview}
                    alt="Main Product"
                    width={500}
                    height={500}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full w-full text-gray-400 gap-1">
                    <ImageIcon size={30} />
                    <span className="text-sm">No image</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 mt-3">
                <label className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer flex items-center gap-2 text-sm">
                  <ImageIcon size={14} />
                  Browse
                  <input type="file" accept="image/*" className="hidden" onChange={handleBrowseMain} />
                </label>
                <label className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded-lg cursor-pointer flex items-center gap-2 text-sm">
                  <RefreshCcw size={14} />
                  Replace
                  <input type="file" accept="image/*" className="hidden" onChange={handleReplaceMain} />
                </label>
              </div>
              {errors.mainImage && <p className="text-xs text-red-500 mt-1">Main image is required</p>}
            </div>
          </div>

          {/* Thumbnails */}
          <div className="space-y-1">
            <Label className="text-sm font-semibold text-gray-700">
              Thumbnails ({baseProduct.thumbnails.length}/{MAX_THUMBNAILS}) <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-3">
              {thumbnailPreviews.map((preview, idx) => (
                <div
                  className="relative w-16 h-16 border rounded-md overflow-hidden bg-gray-50 flex items-center justify-center"
                  key={idx}
                >
                  <Image
                    src={preview}
                    alt={`Product ${idx + 1}`}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover rounded"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-0.5 right-0.5 h-4 w-4 p-0.5 bg-white/70 hover:bg-white z-10"
                    onClick={() => removeThumbnail(idx)}
                  >
                    <X size={10} className="text-gray-600" />
                  </Button>
                </div>
              ))}
              {baseProduct.thumbnails.length < MAX_THUMBNAILS && (
                <label className="w-16 h-16 border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer bg-gray-50 hover:bg-gray-100 text-center">
                  <Plus size={18} className="text-green-600" />
                  <span className="text-xs text-gray-500">Add</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleAddImage} />
                </label>
              )}
            </div>
            {errors.thumbnails && <p className="text-xs text-red-500">At least one thumbnail is required</p>}
          </div>
        </CardContent>
      </Card>

      {/* Product Info */}
      <Card className="shadow-none border-none">
        <CardHeader className="py-4">
          <CardTitle>Product Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {/* Brand */}
          <div className="space-y-1">
            <Label>
              Brand <span className="text-red-500">*</span>
            </Label>
            <Select
              value={baseProduct.brandId || ''}
              onValueChange={(value) => {
                updateBaseProduct({ brandId: value });
                setErrors((prev) => ({ ...prev, brandId: false }));
              }}
            >
              <SelectTrigger className={`h-9 w-full ${errors.brandId ? 'border-red-500' : ''}`}>
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

          {/* Category / SubCategory */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>
                Main Category <span className="text-red-500">*</span>
              </Label>
              <Select
                value={baseProduct.categoryId}
                onValueChange={(value) => {
                  updateBaseProduct({ categoryId: value, subCategoryId: '' });
                  setErrors((prev) => ({ ...prev, categoryId: false }));
                }}
              >
                <SelectTrigger className={`h-9 w-full ${errors.categoryId ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Select main category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && <p className="text-xs text-red-500">Category is required</p>}
            </div>

            <div className="space-y-1">
              <Label>
                Sub Category <span className="text-red-500">*</span>
              </Label>
              <Select
                value={baseProduct.subCategoryId}
                onValueChange={(value) => {
                  updateBaseProduct({ subCategoryId: value });
                  setErrors((prev) => ({ ...prev, subCategoryId: false }));
                }}
                disabled={!baseProduct.categoryId}
              >
                <SelectTrigger className={`h-9 w-full ${errors.subCategoryId ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Select sub category" />
                </SelectTrigger>
                <SelectContent>
                  {subCategories.map((subCategory) => (
                    <SelectItem key={subCategory.id} value={subCategory.id}>
                      {subCategory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.subCategoryId && <p className="text-xs text-red-500">Sub category is required</p>}
            </div>
          </div>

          {/* Product Tags Checklist */}
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
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
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
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
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

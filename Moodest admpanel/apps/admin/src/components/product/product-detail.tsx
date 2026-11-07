'use client';

import React, { useEffect, useState, ChangeEvent } from 'react';
import Image from 'next/image';
import { ProductDeleteDialog } from './delete-product-dialog'; 
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Pencil, 
  Trash2, 
  Loader2, 
  Boxes, 
  IndianRupee,
  Info,
  ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { ProductDetail, VariantDetail, AttributeWithValues } from '@/types/product';
import { rupee } from '@/constants/values';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/apiFetch';

interface ProductDetailProps {
   id: string;
}

export default function ProductDetailPage({ id }: ProductDetailProps) {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const router = useRouter();

  const fetchProduct = async () => {
    try {
      const response = await apiFetch(`/products/${id}`);
      const res = await response.json();
      
      if (!response.ok) {
        toast.error(res.error || 'Product not found');
        return;
      }
      if (!res.data) {
        toast.error('Product not found');
        return;
      }
      setProduct(res.data);
      setSelectedImage(res.data.image);
    } catch (error) {
      console.error('Failed to fetch product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const refreshProduct = async () => {
    await fetchProduct();
    router.refresh();
  };

  const getStockStatus = (qty: number) => {
    if (qty === 0) return { text: 'Out of Stock', color: 'text-red-600 bg-red-50 border-red-200' };
    if (qty <= 5) return { text: 'Low Stock', color: 'text-orange-600 bg-orange-50 border-orange-200' };
    return { text: 'In Stock', color: 'text-green-600 bg-green-50 border-green-200' };
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary mx-auto" size={48} />
          <p className="text-muted-foreground">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const totalQty = (product.variants || []).reduce((acc: number, v: VariantDetail) => acc + (v.qty || 0), 0);
  const firstVariantPrice = product.variants?.[0]?.price ?? 0;
  const stockStatus = getStockStatus(totalQty);

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-muted-foreground mt-1">Product ID: {product.id}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/products/edit-product/${product.id}`)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Images Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Product Images
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Main Image */}
            <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted">
              <Image
                src={selectedImage}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
            </div>
            
            {/* Thumbnail Images */}
            {product.subimage && product.subimage.length > 0 && (
              <div className="grid grid-cols-5 gap-2">
                {/* Main image thumbnail */}
                <button
                  onClick={() => setSelectedImage(product.image)}
                  className={`relative aspect-square rounded-md overflow-hidden border-2 transition-colors ${
                    selectedImage === product.image ? 'border-primary' : 'border-muted'
                  }`}
                >
                  <Image
                    src={product.image}
                    alt={`${product.name} main`}
                    fill
                    className="object-cover"
                  />
                </button>
                
                {/* Sub images thumbnails */}
                {product.subimage.map((img: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(img)}
                    className={`relative aspect-square rounded-md overflow-hidden border-2 transition-colors ${
                      selectedImage === img ? 'border-primary' : 'border-muted'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Information Section */}
        <div className="space-y-6">
          {/* Basic Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Product Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                <p className="text-sm leading-relaxed">{product.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Brand</p>
                  <p className="font-semibold">{product.brand?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Category</p>
                  <p className="font-semibold">{product.category?.name || 'N/A'}</p>
                </div>
              </div>
              
              {product.subCategory && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Subcategory</p>
                  <p className="font-semibold">{product.subCategory.name}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pricing and Stock Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IndianRupee className="h-5 w-5" />
                Pricing & Stock
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="text-3xl font-bold">{rupee} {firstVariantPrice.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Stock Status</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${stockStatus.color}`}>
                    {stockStatus.text}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Boxes className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>{totalQty}</strong> units available
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Variants List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Boxes className="h-5 w-5" /> Variants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(product.variants || []).map((v: VariantDetail) => (
                  <VariantRow key={v.id} variant={v} productId={product.id} onUpdate={refreshProduct} />
                ))}
                {(!product.variants || product.variants.length === 0) && (
                  <div className="text-sm text-muted-foreground">No variants yet.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <ProductDeleteDialog
        product={product}
        open={isDeleteDialogOpen}
        setOpen={setIsDeleteDialogOpen}
      />
    </div>
  );
}

interface VariantRowProps {
  variant: VariantDetail;
  productId: string;
  onUpdate: () => Promise<void>;
}

function VariantRow({ variant, productId, onUpdate }: VariantRowProps) {
  const [price, setPrice] = useState(String(variant.price));
  const [qty, setQty] = useState(String(variant.qty));
  const [editingOptions, setEditingOptions] = useState(false);
  const [attributes, setAttributes] = useState<AttributeWithValues[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<{ attributeId: string; valueId: string }[]>([]);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = (variant.options || []).map((o) => ({ 
      attributeId: o.attributeId, 
      valueId: o.valueId 
    }));
    setSelectedOptions(current);
  }, [variant]);

  useEffect(() => {
    if (editingOptions) {
      (async () => {
        await apiFetch(`/categories`);
        // Attributes aren't a dedicated endpoint, categories load fine
        setAttributes([]);
      })();
    }
  }, [editingOptions]);

  const saveBasic = async () => {
    setUpdating(true);
    try {
      const response = await apiFetch(`/products/${productId}/variants/${variant.id}`, {
        method: "PATCH",
        body: JSON.stringify({ stock: Math.max(0, Math.floor(Number(qty))) }),
      });
      if (response.ok) {
        toast.success('Variant stock updated successfully');
        await onUpdate();
      } else {
        toast.error('Failed to update variant stock');
      }
    } catch {
      toast.error('Error updating variant');
    } finally {
      setUpdating(false);
    }
  };

  const saveOptions = async () => {
    toast.info('Variant options are managed through the product edit form.');
    setEditingOptions(false);
  };

  const remove = async () => {
    if (!confirm("Are you sure you want to delete this variant?")) return;
    setDeleting(true);
    try {
      const response = await apiFetch(`/products/${productId}/variants/${variant.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success('Variant deleted successfully');
        await onUpdate();
      } else {
        const res = await response.json().catch(() => ({}));
        toast.error(res.message || res.error || 'Failed to delete variant');
      }
    } catch {
      toast.error('Error deleting variant');
    } finally {
      setDeleting(false);
    }
  };

  const setOption = (attributeId: string, valueId: string) => {
    setSelectedOptions((prev) => {
      const without = prev.filter(o => o.attributeId !== attributeId);
      return [...without, { attributeId, valueId }];
    });
  };

  const handlePriceChange = (e: ChangeEvent<HTMLInputElement>) => setPrice(e.target.value);
  const handleQtyChange = (e: ChangeEvent<HTMLInputElement>) => setQty(e.target.value);
  const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>, attributeId: string) => {
    setOption(attributeId, e.target.value);
  };

  return (
    <div className="flex flex-col gap-2 border-b last:border-0 py-2">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{variant.sku}</div>
          <div className="text-xs text-muted-foreground truncate">
            {variant.size
              ? `Size ${variant.size}${variant.color ? ` · Color: ${variant.color}` : ""}`
              : (variant.options?.map((o) => `${o.attribute?.name}: ${o.attributeValue?.value}`).join(", ") || "-")}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input 
            className="w-24 border rounded px-2 py-1 text-sm" 
            value={price} 
            onChange={handlePriceChange} 
          />
          <input 
            className="w-16 border rounded px-2 py-1 text-sm" 
            value={qty} 
            onChange={handleQtyChange} 
          />
          <Button variant="outline" size="sm" onClick={saveBasic} disabled={updating}>
            Save
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setEditingOptions((s) => !s)}>
            Edit Options
          </Button>
          <Button variant="destructive" size="sm" onClick={remove} disabled={deleting}>
            Delete
          </Button>
        </div>
      </div>

      {editingOptions && (
        <div className="bg-muted/30 rounded p-3 space-y-2">
          {attributes.map(attr => (
            <div key={attr.id} className="flex items-center gap-2">
              <div className="w-28 text-sm text-muted-foreground">{attr.name}</div>
              <select 
                className="border rounded px-2 py-1 text-sm flex-1"
                onChange={(e) => handleSelectChange(e, attr.id)}
                value={selectedOptions.find(o => o.attributeId === attr.id)?.valueId || ''}
              >
                <option value="">Select</option>
                {attr.values.map(v => (
                  <option key={v.id} value={v.id}>{v.value}</option>
                ))}
              </select>
            </div>
          ))}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditingOptions(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={saveOptions} disabled={updating}>
              Save Options
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

import { createContext, useContext, useState } from "react";

export interface EditBaseProductData {
  name: string;
  description: string;
  fabric?: string;
  careInstructions?: string;
  mainImage: File | string | null; // Can be URL (existing) or File (new)
  hoverImage?: File | string | null; // Can be URL (existing) or File (new)
  basePrice: number;
  baseQuantity: number;
  baseDiscountPrice: number;
  thumbnails: (File | string)[]; // Can be URLs (existing) or Files (new)
  brandId: string | null;
  categoryId: string;
  subCategoryId: string;
  isCustomerFavorite: boolean;
  isNewArrival: boolean;
}

export interface EditVariantData {
  id: string;
  productId?: string;
  size: string;
  color: string;
  colorHex?: string | null;
  sku: string;
  price?: number;
  qty?: number;
  offerPrice?: number | null;
  isActive: boolean;
  image?: File | string | null;
  images?: (File | string)[]; // Can be URLs (existing) or Files (new)
  attributes?: {
    attributeId: string;
    valueId: string;
    attributeName: string;
    value: string;
  }[];
  isNew: boolean; // Track if this is a new variant or existing
  isModified: boolean; // Track if existing variant was changed
  reservations?: Array<{
    id: string;
    quantity: number;
    status: string;
    expiresAt?: string | Date;
  }>;
}

interface EditProductContextType {
  baseProduct: EditBaseProductData;
  setBaseProduct: (data: EditBaseProductData) => void;
  updateBaseProduct: (data: Partial<EditBaseProductData>) => void;
  variants: EditVariantData[];
  setVariants: (variants: EditVariantData[]) => void;
  addVariant: (variant: Omit<EditVariantData, 'isNew' | 'isModified'>) => void;
  updateVariant: (id: string, data: Partial<EditVariantData>) => void;
  removeVariant: (id: string) => void;
  deletedVariantIds: string[]; 
  resetBaseProduct: () => void;
  isFileImage: (image: File | string) => boolean;
  getNewImages: (images: (File | string)[]) => File[];
  getExistingImages: (images: (File | string)[]) => string[];
}

const EditProductContext = createContext<EditProductContextType | null>(null);

export function EditProductProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [variants, setVariants] = useState<EditVariantData[]>([]);
  const [deletedVariantIds, setDeletedVariantIds] = useState<string[]>([]);
  const [baseProduct, setBaseProduct] = useState<EditBaseProductData>({
    name: "",
    description: "",
    mainImage: null,
    hoverImage: null,
    basePrice: 0,
    baseQuantity: 0,
    baseDiscountPrice: 0,
    thumbnails: [],
    brandId: null,
    categoryId: "",
    subCategoryId: "",
    isCustomerFavorite: false,
    isNewArrival: false,
  });

  const updateBaseProduct = (data: Partial<EditBaseProductData>) => {
    setBaseProduct((prev) => ({ ...prev, ...data }));
  };

  const addVariant = (variant: Omit<EditVariantData, 'isNew' | 'isModified'>) => {
    const newVariant: EditVariantData = {
      ...variant,
      isNew: true,
      isModified: false,
    };
    setVariants((prev) => [...prev, newVariant]);
  };

  const updateVariant = (id: string, data: Partial<EditVariantData>) => {
    setVariants((prev) =>
      prev.map((v) => {
        if (v.id === id) {
          return {
            ...v,
            ...data,
            isModified: !v.isNew, // Mark as modified only if it's an existing variant
          };
        }
        return v;
      })
    );
  };

  const removeVariant = (id: string) => {
    setVariants((prev) => {
      const variantToRemove = prev.find((v) => v.id === id);
      
      // If it's an existing variant (not new), track it as deleted
      if (variantToRemove && !variantToRemove.isNew) {
        setDeletedVariantIds((prevDeleted) => [...prevDeleted, id]);
      }
      
      return prev.filter((v) => v.id !== id);
    });
  };

  const resetBaseProduct = () => {
    setBaseProduct({
      name: "",
      description: "",
      mainImage: null,
      hoverImage: null,
      basePrice: 0,
      baseQuantity: 0,
      baseDiscountPrice: 0,
      thumbnails: [],
      brandId: null,
      categoryId: "",
      subCategoryId: "",
      isCustomerFavorite: false,
      isNewArrival: false,
    });
    setVariants([]);
    setDeletedVariantIds([]);
  };

  // Helper functions
  const isFileImage = (image: File | string): boolean => {
    return image instanceof File;
  };

  const getNewImages = (images: (File | string)[]): File[] => {
    return images.filter((img) => img instanceof File) as File[];
  };

  const getExistingImages = (images: (File | string)[]): string[] => {
    return images.filter((img) => typeof img === "string") as string[];
  };

  return (
    <EditProductContext.Provider
      value={{
        baseProduct,
        setBaseProduct,
        updateBaseProduct,
        variants,
        setVariants,
        addVariant,
        updateVariant,
        removeVariant,
        deletedVariantIds,
        resetBaseProduct,
        isFileImage,
        getNewImages,
        getExistingImages,
      }}
    >
      {children}
    </EditProductContext.Provider>
  );
}

export const useEditProduct = () => {
  const context = useContext(EditProductContext);
  if (!context) {
    throw new Error(
      "useEditProduct must be used within EditProductProvider"
    );
  }
  return context;
};

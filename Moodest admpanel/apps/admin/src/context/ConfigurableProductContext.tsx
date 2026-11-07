import { createContext, useContext, useState } from "react";

export interface BaseProductData {
  name: string;
  description: string;
  fabric?: string;
  careInstructions?: string;
  mainImage: File | null;
  basePrice: number;
  baseQuantity: number;
  baseDiscountPrice: number;
  thumbnails: File[];
  brandId: string | null;
  categoryId: string;
  subCategoryId: string;
  isCustomerFavorite: boolean;
  isNewArrival: boolean;
}

export interface VariantData {
  id: string;
  size: string;
  color: string;
  colorHex?: string | null;
  sku: string;
  price?: number;
  qty?: number;
  offerPrice?: number | null;
  isActive: boolean;
  isNew?: boolean;
  images?: File[];
  attributes?: {
    attributeId: string;
    valueId: string;
    attributeName: string;
    value: string;
  }[];
}

interface ConfigurableProductContextType {
  baseProduct: BaseProductData;
  setBaseProduct: (data: BaseProductData) => void;
  updateBaseProduct: (data: Partial<BaseProductData>) => void;
  variants: VariantData[];
  setVariants: (variants: VariantData[]) => void;
  addVariant: (variant: VariantData) => void;
  updateVariant: (id: string, data: Partial<VariantData>) => void;
  removeVariant: (id: string) => void;
  resetBaseProduct: () => void;
}

const ConfigurableProductContext =
  createContext<ConfigurableProductContextType | null>(null);

export function ConfigurableProductProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [variants, setVariants] = useState<VariantData[]>([]);
  const [baseProduct, setBaseProduct] = useState<BaseProductData>({
    name: "",
    description: "",
    mainImage: null,
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

  const updateBaseProduct = (data: Partial<BaseProductData>) => {
    setBaseProduct((prev) => ({ ...prev, ...data }));
  };

  const addVariant = (variant: VariantData) => {
    setVariants((prev) => [...prev, variant]);
  };

  const updateVariant = (id: string, data: Partial<VariantData>) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...data } : v))
    );
  };

  const resetBaseProduct = () => {
    setBaseProduct({
      name: "",
      description: "",
      mainImage: null,
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
  };

  const removeVariant = (id: string) => {
    setVariants((prev) => prev.filter((v) => v.id !== id));
  };

  return (
    <ConfigurableProductContext.Provider
      value={{
        baseProduct,
        setBaseProduct,
        updateBaseProduct,
        variants,
        setVariants,
        addVariant,
        updateVariant,
        removeVariant,
        resetBaseProduct,
      }}
    >
      {children}
    </ConfigurableProductContext.Provider>
  );
}

export const useConfigurableProduct = () => {
  const context = useContext(ConfigurableProductContext);
  if (!context) {
    throw new Error(
      "useConfigurableProduct must be used within ConfigurableProductProvider"
    );
  }
  return context;
};

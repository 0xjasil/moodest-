export type VariationCategory =
  | "All"
  | "Apparel"
  | "Footwear"
  | "Home & Living"
  | "Beauty"
  | "Electronics";

export interface VariationValue {
  id: string;
  name: string;
  colorHex?: string;
}

export interface AttributeItem {
  id: string;
  name: string;
  category: "Apparel" | "Footwear" | "Home & Living" | "Beauty" | "Electronics";
  productCount: number;
  status: "active" | "hidden";
  type: "text" | "color" | "button";
  values: VariationValue[];
}

export const CATEGORIES: VariationCategory[] = [
  "All",
  "Apparel",
  "Footwear",
  "Home & Living",
  "Beauty",
  "Electronics",
];

export const INITIAL_ATTRIBUTES: AttributeItem[] = [
  {
    id: "attr-size",
    name: "Size",
    category: "Apparel",
    productCount: 138,
    status: "active",
    type: "button",
    values: [
      { id: "val-xs", name: "XS" },
      { id: "val-s", name: "S" },
      { id: "val-m", name: "M" },
      { id: "val-l", name: "L" },
      { id: "val-xl", name: "XL" },
      { id: "val-xxl", name: "XXL" },
    ],
  },
  {
    id: "attr-color",
    name: "Color",
    category: "Apparel",
    productCount: 184,
    status: "active",
    type: "color",
    values: [
      { id: "val-c1", name: "Onyx Black", colorHex: "#111827" },
      { id: "val-c2", name: "Off-White", colorHex: "#F8FAFC" },
      { id: "val-c3", name: "Olive Green", colorHex: "#4D5D38" },
      { id: "val-c4", name: "Navy", colorHex: "#1E3A8A" },
      { id: "val-c5", name: "Crimson", colorHex: "#DC2626" },
      { id: "val-c6", name: "Sand", colorHex: "#D2B48C" },
    ],
  },
  {
    id: "attr-fit",
    name: "Fit",
    category: "Apparel",
    productCount: 92,
    status: "active",
    type: "text",
    values: [
      { id: "val-f1", name: "Slim" },
      { id: "val-f2", name: "Regular" },
      { id: "val-f3", name: "Relaxed" },
      { id: "val-f4", name: "Oversized" },
    ],
  },
  {
    id: "attr-fabric",
    name: "Fabric",
    category: "Apparel",
    productCount: 65,
    status: "active",
    type: "text",
    values: [
      { id: "val-fb1", name: "Cotton" },
      { id: "val-fb2", name: "Linen" },
      { id: "val-fb3", name: "Silk" },
      { id: "val-fb4", name: "Wool" },
      { id: "val-fb5", name: "Polyester" },
    ],
  },
  {
    id: "attr-shoe-size",
    name: "Shoe size",
    category: "Footwear",
    productCount: 112,
    status: "active",
    type: "button",
    values: [
      { id: "val-ss38", name: "EU 38" },
      { id: "val-ss39", name: "EU 39" },
      { id: "val-ss40", name: "EU 40" },
      { id: "val-ss41", name: "EU 41" },
      { id: "val-ss42", name: "EU 42" },
      { id: "val-ss43", name: "EU 43" },
      { id: "val-ss44", name: "EU 44" },
      { id: "val-ss45", name: "EU 45" },
    ],
  },
  {
    id: "attr-material",
    name: "Material",
    category: "Footwear",
    productCount: 48,
    status: "active",
    type: "text",
    values: [
      { id: "val-mat1", name: "Leather" },
      { id: "val-mat2", name: "Canvas" },
      { id: "val-mat3", name: "Suede" },
      { id: "val-mat4", name: "Mesh" },
      { id: "val-mat5", name: "Rubber" },
    ],
  },
  {
    id: "attr-storage",
    name: "Storage",
    category: "Electronics",
    productCount: 36,
    status: "active",
    type: "text",
    values: [
      { id: "val-st1", name: "128 GB" },
      { id: "val-st2", name: "256 GB" },
      { id: "val-st3", name: "512 GB" },
      { id: "val-st4", name: "1 TB" },
    ],
  },
  {
    id: "attr-case-color",
    name: "Case color",
    category: "Electronics",
    productCount: 24,
    status: "hidden",
    type: "color",
    values: [
      { id: "val-cc1", name: "Space Gray", colorHex: "#4B5563" },
      { id: "val-cc2", name: "Silver", colorHex: "#E5E7EB" },
      { id: "val-cc3", name: "Midnight", colorHex: "#0F172A" },
      { id: "val-cc4", name: "Starlight", colorHex: "#F1EBE4" },
    ],
  },
];

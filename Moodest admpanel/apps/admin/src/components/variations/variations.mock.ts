export type VariationCategory =
  | "All"
  | "Abayas"
  | "Occasion Wear"
  | "Fabrics & Silhouettes"
  | "Custom & Tailored";

export interface VariationProduct {
  id: string;
  name: string;
  category: string;
  sku: string;
  price: number;
  offerPrice?: number | null;
  stock: number;
  image: string;
  inStock: boolean;
  size?: string;
  color?: string;
  fabric?: string;
}

export interface VariationValue {
  id: string;
  name: string;
  colorHex?: string;
  description?: string;
  products?: VariationProduct[];
}

export interface AttributeItem {
  id: string;
  name: string;
  category: "Abayas" | "Occasion Wear" | "Fabrics & Silhouettes" | "Custom & Tailored";
  productCount: number;
  status: "active" | "hidden";
  type: "text" | "color" | "button";
  values: VariationValue[];
  description?: string;
}

export const CATEGORIES: VariationCategory[] = [
  "All",
  "Abayas",
  "Occasion Wear",
  "Fabrics & Silhouettes",
  "Custom & Tailored",
];

// Master Catalog of Boutique Abayas for Variant Previews
export const MOCK_ABAYA_PRODUCTS: Record<string, VariationProduct> = {
  noor: {
    id: "demo-abaya-1",
    name: "Noor Hand-Embroidered Nida Abaya",
    category: "Luxury Occasion",
    sku: "MDS-NOOR-BLK-54",
    price: 4999,
    offerPrice: 4499,
    stock: 45,
    image: "/images/products/1.webp",
    inStock: true,
    size: "54",
    color: "Onyx Black",
    fabric: "Royal Nida",
  },
  medina: {
    id: "demo-abaya-2",
    name: "Medina Minimalist Front-Open Abaya",
    category: "Everyday Essentials",
    sku: "MDS-MED-NVY-56",
    price: 3899,
    offerPrice: null,
    stock: 32,
    image: "/images/products/2.webp",
    inStock: true,
    size: "56",
    color: "Midnight Navy",
    fabric: "Korean Matte Crepe",
  },
  layla: {
    id: "demo-abaya-3",
    name: "Layla Luxury Georgette Kimono Abaya",
    category: "Kimono & Open Front",
    sku: "MDS-LAYLA-OLV-54",
    price: 5499,
    offerPrice: 4999,
    stock: 18,
    image: "/images/products/3.webp",
    inStock: true,
    size: "54",
    color: "Olive Green",
    fabric: "Turkish Chiffon",
  },
  ameera: {
    id: "demo-abaya-4",
    name: "Ameera Royal Velvet Evening Abaya",
    category: "Occasion Wear",
    sku: "MDS-AMEERA-BRG-56",
    price: 6799,
    offerPrice: 5999,
    stock: 14,
    image: "/images/products/4.webp",
    inStock: true,
    size: "56",
    color: "Royal Burgundy",
    fabric: "Luxury Velvet",
  },
  zahra: {
    id: "demo-abaya-5",
    name: "Zahra Pure Organic Linen Summer Abaya",
    category: "Everyday Essentials",
    sku: "MDS-ZAHRA-BGE-54",
    price: 3499,
    offerPrice: 2999,
    stock: 28,
    image: "/images/products/5.webp",
    inStock: true,
    size: "54",
    color: "Warm Beige",
    fabric: "Pure Linen",
  },
  sultana: {
    id: "demo-abaya-6",
    name: "Sultana Beaded Royal Farasha Abaya",
    category: "Luxury Occasion",
    sku: "MDS-SULTANA-BLK-FREE",
    price: 7299,
    offerPrice: null,
    stock: 9,
    image: "/images/products/6.webp",
    inStock: true,
    size: "Free Size",
    color: "Onyx Black",
    fabric: "Medina Silk",
  },
  maryam: {
    id: "demo-abaya-7",
    name: "Maryam Casual Pocket Everyday Abaya",
    category: "Everyday Essentials",
    sku: "MDS-MARYAM-GRY-54",
    price: 3199,
    offerPrice: null,
    stock: 40,
    image: "/images/products/7.webp",
    inStock: true,
    size: "54",
    color: "Charcoal Grey",
    fabric: "Korean Matte Crepe",
  },
  hoor: {
    id: "demo-abaya-8",
    name: "Hoor Tiered Ruffle Chiffon Abaya",
    category: "Kimono & Open Front",
    sku: "MDS-HOOR-ROSE-56",
    price: 4299,
    offerPrice: 3799,
    stock: 22,
    image: "/images/products/8.webp",
    inStock: true,
    size: "56",
    color: "Dusty Rose",
    fabric: "Turkish Chiffon",
  },
  khawlah: {
    id: "demo-abaya-9",
    name: "Khawlah Tailored Bisht Abaya",
    category: "Custom & Tailored",
    sku: "MDS-KHAWLAH-CUST-55",
    price: 5899,
    offerPrice: 5299,
    stock: 12,
    image: "/images/products/9.webp",
    inStock: true,
    size: "Custom Size / Made-to-Measure",
    color: "Desert Taupe",
    fabric: "Royal Nida",
  },
};

export const INITIAL_ATTRIBUTES: AttributeItem[] = [
  {
    id: "attr-size",
    name: "Abaya Size (Length)",
    category: "Abayas",
    productCount: 9,
    status: "active",
    type: "button",
    description: "Standard vertical lengths (50\" to 62\"), Free Size, and Custom Made-to-Measure",
    values: [
      {
        id: "val-sz-50",
        name: "Size 50",
        description: "50\" length — ideal for height 5'0\" to 5'1\"",
        products: [MOCK_ABAYA_PRODUCTS.noor, MOCK_ABAYA_PRODUCTS.zahra],
      },
      {
        id: "val-sz-52",
        name: "Size 52",
        description: "52\" length — ideal for height 5'2\" to 5'3\"",
        products: [
          MOCK_ABAYA_PRODUCTS.noor,
          MOCK_ABAYA_PRODUCTS.medina,
          MOCK_ABAYA_PRODUCTS.layla,
          MOCK_ABAYA_PRODUCTS.maryam,
        ],
      },
      {
        id: "val-sz-54",
        name: "Size 54",
        description: "54\" length — best seller, ideal for height 5'4\" to 5'5\"",
        products: [
          MOCK_ABAYA_PRODUCTS.noor,
          MOCK_ABAYA_PRODUCTS.medina,
          MOCK_ABAYA_PRODUCTS.layla,
          MOCK_ABAYA_PRODUCTS.zahra,
          MOCK_ABAYA_PRODUCTS.maryam,
          MOCK_ABAYA_PRODUCTS.hoor,
        ],
      },
      {
        id: "val-sz-56",
        name: "Size 56",
        description: "56\" length — ideal for height 5'6\" to 5'7\"",
        products: [
          MOCK_ABAYA_PRODUCTS.noor,
          MOCK_ABAYA_PRODUCTS.medina,
          MOCK_ABAYA_PRODUCTS.layla,
          MOCK_ABAYA_PRODUCTS.ameera,
          MOCK_ABAYA_PRODUCTS.zahra,
          MOCK_ABAYA_PRODUCTS.maryam,
          MOCK_ABAYA_PRODUCTS.hoor,
        ],
      },
      {
        id: "val-sz-58",
        name: "Size 58",
        description: "58\" length — ideal for height 5'8\" to 5'9\"",
        products: [
          MOCK_ABAYA_PRODUCTS.noor,
          MOCK_ABAYA_PRODUCTS.medina,
          MOCK_ABAYA_PRODUCTS.ameera,
          MOCK_ABAYA_PRODUCTS.maryam,
        ],
      },
      {
        id: "val-sz-60",
        name: "Size 60",
        description: "60\" length — ideal for height 5'10\"+",
        products: [MOCK_ABAYA_PRODUCTS.noor, MOCK_ABAYA_PRODUCTS.medina],
      },
      {
        id: "val-sz-62",
        name: "Size 62",
        description: "62\" length — extra tall modest cut",
        products: [MOCK_ABAYA_PRODUCTS.noor],
      },
      {
        id: "val-sz-free",
        name: "Free Size",
        description: "Universal flexible flowy cut fitting standard sizes 52-58",
        products: [
          MOCK_ABAYA_PRODUCTS.medina,
          MOCK_ABAYA_PRODUCTS.layla,
          MOCK_ABAYA_PRODUCTS.zahra,
          MOCK_ABAYA_PRODUCTS.sultana,
          MOCK_ABAYA_PRODUCTS.hoor,
        ],
      },
      {
        id: "val-sz-custom",
        name: "Custom / Made-to-Measure",
        description: "Personalized length and bust measurements tailored upon order",
        products: [
          MOCK_ABAYA_PRODUCTS.ameera,
          MOCK_ABAYA_PRODUCTS.sultana,
          MOCK_ABAYA_PRODUCTS.khawlah,
          MOCK_ABAYA_PRODUCTS.hoor,
        ],
      },
    ],
  },
  {
    id: "attr-color",
    name: "Boutique Colorways",
    category: "Abayas",
    productCount: 9,
    status: "active",
    type: "color",
    description: "Signature modest palette dyed for premium drape and sheen",
    values: [
      {
        id: "val-c1",
        name: "Onyx Black",
        colorHex: "#000000",
        description: "Deep luxury jet black",
        products: [
          MOCK_ABAYA_PRODUCTS.noor,
          MOCK_ABAYA_PRODUCTS.layla,
          MOCK_ABAYA_PRODUCTS.ameera,
          MOCK_ABAYA_PRODUCTS.sultana,
        ],
      },
      {
        id: "val-c2",
        name: "Midnight Navy",
        colorHex: "#0A192F",
        description: "Royal dark navy",
        products: [
          MOCK_ABAYA_PRODUCTS.noor,
          MOCK_ABAYA_PRODUCTS.medina,
          MOCK_ABAYA_PRODUCTS.maryam,
        ],
      },
      {
        id: "val-c3",
        name: "Desert Taupe",
        colorHex: "#8B8589",
        description: "Subtle neutral earthy grey-brown",
        products: [
          MOCK_ABAYA_PRODUCTS.medina,
          MOCK_ABAYA_PRODUCTS.zahra,
          MOCK_ABAYA_PRODUCTS.khawlah,
          MOCK_ABAYA_PRODUCTS.hoor,
        ],
      },
      {
        id: "val-c4",
        name: "Olive Green",
        colorHex: "#4B5320",
        description: "Rich botanical olive tone",
        products: [MOCK_ABAYA_PRODUCTS.layla, MOCK_ABAYA_PRODUCTS.medina],
      },
      {
        id: "val-c5",
        name: "Royal Burgundy",
        colorHex: "#800020",
        description: "Majestic deep wine red",
        products: [MOCK_ABAYA_PRODUCTS.ameera, MOCK_ABAYA_PRODUCTS.sultana],
      },
      {
        id: "val-c6",
        name: "Warm Beige",
        colorHex: "#E1C699",
        description: "Desert sand natural tone",
        products: [MOCK_ABAYA_PRODUCTS.zahra, MOCK_ABAYA_PRODUCTS.layla],
      },
      {
        id: "val-c7",
        name: "Dusty Rose",
        colorHex: "#DCAE96",
        description: "Soft modest blush pink",
        products: [MOCK_ABAYA_PRODUCTS.hoor, MOCK_ABAYA_PRODUCTS.layla],
      },
      {
        id: "val-c8",
        name: "Pearl White",
        colorHex: "#FFFFFF",
        description: "Crisp celebratory bridal/hajj tone",
        products: [MOCK_ABAYA_PRODUCTS.zahra],
      },
      {
        id: "val-c9",
        name: "Charcoal Grey",
        colorHex: "#36454F",
        description: "Modern professional neutral",
        products: [MOCK_ABAYA_PRODUCTS.maryam],
      },
    ],
  },
  {
    id: "attr-fabric",
    name: "Fabrics & Materials",
    category: "Fabrics & Silhouettes",
    productCount: 9,
    status: "active",
    type: "text",
    description: "Breathable luxury textiles crafted for all-season comfort",
    values: [
      {
        id: "val-fb-nida",
        name: "Royal Nida (Dubai)",
        description: "Silky-smooth, opaque, premium drape",
        products: [MOCK_ABAYA_PRODUCTS.noor, MOCK_ABAYA_PRODUCTS.khawlah],
      },
      {
        id: "val-fb-crepe",
        name: "Korean Matte Crepe",
        description: "Wrinkle-resistant everyday fabric",
        products: [MOCK_ABAYA_PRODUCTS.medina, MOCK_ABAYA_PRODUCTS.maryam],
      },
      {
        id: "val-fb-chiffon",
        name: "Turkish Chiffon",
        description: "Flowy, lightweight layered elegance",
        products: [MOCK_ABAYA_PRODUCTS.layla, MOCK_ABAYA_PRODUCTS.hoor],
      },
      {
        id: "val-fb-velvet",
        name: "Luxury Velvet",
        description: "Plush evening occasion warmth",
        products: [MOCK_ABAYA_PRODUCTS.ameera],
      },
      {
        id: "val-fb-linen",
        name: "Pure Organic Linen",
        description: "Ultra-breathable hot summer wear",
        products: [MOCK_ABAYA_PRODUCTS.zahra],
      },
      {
        id: "val-fb-silk",
        name: "Medina Silk",
        description: "Lustrous high-grade occasion silk blend",
        products: [MOCK_ABAYA_PRODUCTS.sultana],
      },
    ],
  },
  {
    id: "attr-cut",
    name: "Cut & Silhouette",
    category: "Fabrics & Silhouettes",
    productCount: 9,
    status: "active",
    type: "text",
    description: "Modest draping cuts from classic A-line to royal Farasha",
    values: [
      {
        id: "val-cut-flare",
        name: "Classic A-Line Flare",
        description: "Timeless modest flare from shoulders down",
        products: [
          MOCK_ABAYA_PRODUCTS.noor,
          MOCK_ABAYA_PRODUCTS.zahra,
          MOCK_ABAYA_PRODUCTS.hoor,
        ],
      },
      {
        id: "val-cut-open",
        name: "Front-Open Kimono",
        description: "Versatile snap-button or open cardigan front",
        products: [MOCK_ABAYA_PRODUCTS.medina, MOCK_ABAYA_PRODUCTS.layla],
      },
      {
        id: "val-cut-farasha",
        name: "Farasha / Butterfly",
        description: "Wide sweeping batwing drape",
        products: [MOCK_ABAYA_PRODUCTS.sultana, MOCK_ABAYA_PRODUCTS.layla],
      },
      {
        id: "val-cut-bisht",
        name: "Bisht Silhouette",
        description: "Traditional Gulf royal cloak shape",
        products: [MOCK_ABAYA_PRODUCTS.ameera, MOCK_ABAYA_PRODUCTS.khawlah],
      },
      {
        id: "val-cut-slim",
        name: "Slim Tailored Fit",
        description: "Clean straight silhouette with side slits",
        products: [MOCK_ABAYA_PRODUCTS.maryam],
      },
    ],
  },
  {
    id: "attr-tailoring",
    name: "Custom Fitting & Alterations",
    category: "Custom & Tailored",
    productCount: 5,
    status: "active",
    type: "button",
    description: "Bespoke tailoring options for exact customer measurements",
    values: [
      {
        id: "val-tailor-length",
        name: "Custom Length (50\"-62\")",
        description: "Customized vertical hem for exact heel height",
        products: [
          MOCK_ABAYA_PRODUCTS.khawlah,
          MOCK_ABAYA_PRODUCTS.ameera,
          MOCK_ABAYA_PRODUCTS.sultana,
        ],
      },
      {
        id: "val-tailor-full",
        name: "Made-to-Measure Full Set",
        description: "Custom bust, arm span, and length",
        products: [MOCK_ABAYA_PRODUCTS.khawlah, MOCK_ABAYA_PRODUCTS.sultana],
      },
      {
        id: "val-tailor-free",
        name: "Free Size Flowy Cut",
        description: "No measurement needed — relaxed universal fit",
        products: [
          MOCK_ABAYA_PRODUCTS.sultana,
          MOCK_ABAYA_PRODUCTS.layla,
          MOCK_ABAYA_PRODUCTS.medina,
        ],
      },
    ],
  },
];

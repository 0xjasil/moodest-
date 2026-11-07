import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

// Pre-computed scrypt hash compatible with Better-Auth for password "Admin@123"
const ADMIN_PASSWORD_HASH =
  "9b2633f07ddf502ad7997666b4e00689:879cf3185f19081225b8c21ce1678c39c5d93f8715aba7cc1905d006361def30d43e4dafca5361fdb6ee73a33802eb542630e86b5b3b113dd3fa287f23f267d6";

async function main() {
  console.log("🌱 Starting MORYELLE BEAUTÉ Database Seed...");

  // 1. Clean existing records in foreign-key safe order
  console.log("🧹 Cleaning existing data...");
  await prisma.paymentLog.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.review.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.variantOption.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.attributeValue.deleteMany();
  await prisma.attribute.deleteMany();
  await prisma.subCategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Admin User (Better-Auth compatible)
  console.log("👤 Creating Admin user (Better-Auth compatible)...");
  const adminUser = await prisma.user.create({
    data: {
      name: "Moryelle Admin",
      email: "admin@moryelle.com",
      emailVerified: true,
      role: "admin",
      phone: "+919876543210",
      accounts: {
        create: {
          providerId: "credential",
          accountId: "admin@moryelle.com",
          password: ADMIN_PASSWORD_HASH,
        },
      },
    },
  });

  // 3. Create Categories & Subcategories
  console.log("📁 Creating Categories & Subcategories...");
  const categoriesData = [
    {
      name: "Makeup",
      slug: "makeup",
      image: "https://images-static.nykaa.com/media/catalog/product/tr:w-220,h-220,cm-pad_resize/0/5/05dbaacRAREB00000496_1.jpg",
      subcategories: ["Face", "Lips", "Eyes", "Nails"],
    },
    {
      name: "Skincare",
      slug: "skincare",
      image: "https://images-static.nykaa.com/media/catalog/product/tr:w-220,h-220,cm-pad_resize/c/5/c591c1a8809516795705x_1.jpg",
      subcategories: ["Serums", "Moisturizers", "Sunscreen", "Cleansers"],
    },
    {
      name: "Fragrance",
      slug: "fragrance",
      image: "https://images-static.nykaa.com/media/catalog/product/tr:w-220,h-220,cm-pad_resize/0/8/0843f1eMORAB00000353_1.jpg",
      subcategories: ["Women's Fragrance", "Men's Fragrance"],
    },
    {
      name: "Haircare",
      slug: "haircare",
      image: "https://images-static.nykaa.com/media/catalog/product/tr:w-220,h-220,cm-pad_resize/6/b/6b1ed17INSIG00001372_m01.jpg",
      subcategories: ["Shampoo & Conditioner", "Treatments & Oils"],
    },
  ];

  const categoryMap = new Map<string, any>();
  const subCategoryMap = new Map<string, any>();

  for (const cat of categoriesData) {
    const createdCat = await prisma.category.create({
      data: {
        name: cat.name,
        image: cat.image,
      },
    });
    // Map both exact name and lowercase key for easy lookup
    categoryMap.set(cat.name.toLowerCase(), createdCat);
    categoryMap.set(cat.slug, createdCat);

    for (const subName of cat.subcategories) {
      const createdSub = await prisma.subCategory.create({
        data: {
          name: subName,
          categoryId: createdCat.id,
        },
      });
      subCategoryMap.set(`${cat.name.toLowerCase()}-${subName.toLowerCase()}`, createdSub);
    }
  }

  // 4. Create Brands
  console.log("🏷️ Creating Brands...");
  const brandNames = [
    "Rare",
    "MARS",
    "Swiss",
    "Insight",
    "Innisfree",
    "Faces",
    "Nykaa",
    "MORPHE",
    "Blue",
    "Moryelle Beauté",
  ];

  const brandMap = new Map<string, any>();
  for (const bName of brandNames) {
    const brand = await prisma.brand.create({
      data: { name: bName },
    });
    brandMap.set(bName.toLowerCase(), brand);
  }

  // 5. Load and Import Products from products.json
  console.log("🛍️ Importing 20 products from Morella frontend/products.json...");
  const productsJsonPath = path.resolve(__dirname, "../../../../Morella frontend/products.json");
  let rawProducts: any[] = [];

  if (fs.existsSync(productsJsonPath)) {
    rawProducts = JSON.parse(fs.readFileSync(productsJsonPath, "utf-8"));
  } else {
    console.warn("⚠️ products.json not found at", productsJsonPath);
  }

  let importedCount = 0;
  for (const p of rawProducts) {
    // Find or fallback Brand
    const brandKey = String(p.brand || "Moryelle Beauté").toLowerCase();
    let brand = brandMap.get(brandKey);
    if (!brand) {
      brand = await prisma.brand.create({
        data: { name: p.brand || "Moryelle Beauté" },
      });
      brandMap.set(brandKey, brand);
    }

    // Find or fallback Category
    const catKey = String(p.category || "makeup").toLowerCase();
    const category = categoryMap.get(catKey) || categoryMap.get("makeup");

    const product = await prisma.product.create({
      data: {
        id: String(p.id), // Retains "prod-1", "prod-2", etc.
        name: p.name,
        description: `${p.name} - Luxury cosmetics formulation with rich pigments and nourishing ingredients.`,
        image: p.image,
        subimage: [p.image],
        brandId: brand.id,
        categoryId: category?.id,
        rating: typeof p.rating === "number" ? p.rating : 4.5,
        reviewCount: typeof p.reviewCount === "number" ? p.reviewCount : 12,
        isCustomerFavorite: true,
        isNewArrival: true,
        isPermitted: true,
      },
    });

    // Create primary ProductVariant
    const priceVal = p.price ?? 499;
    const offerPriceVal = p.originalPrice && p.originalPrice > priceVal ? p.originalPrice : null;

    await prisma.productVariant.create({
      data: {
        productId: product.id,
        sku: `SKU-${String(p.id).toUpperCase()}`,
        price: priceVal,
        offerPrice: offerPriceVal,
        qty: 50,
        images: [p.image],
      },
    });

    importedCount++;
  }

  // 6. Create Coupons
  console.log("🎟️ Creating promotional Coupons...");
  await prisma.coupon.create({
    data: {
      code: "MORYELLE20",
      discountType: "PERCENTAGE",
      discountValue: 20.0,
      minCartAmount: 999.0,
      maxDiscount: 500.0,
      usageLimit: 1000,
      isActive: true,
    },
  });

  await prisma.coupon.create({
    data: {
      code: "WELCOME100",
      discountType: "FIXED",
      discountValue: 100.0,
      minCartAmount: 499.0,
      usageLimit: 5000,
      isActive: true,
    },
  });

  console.log("✨ Seed completed successfully!");
  console.log(`📊 Summary:
  - Admin User: admin@moryelle.com (Password: Admin@123)
  - Categories: ${categoriesData.length}
  - Brands: ${brandNames.length}
  - Products Imported: ${importedCount} with active Variants & Stock
  - Coupons: MORYELLE20, WELCOME100
  `);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

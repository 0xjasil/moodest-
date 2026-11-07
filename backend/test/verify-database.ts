import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  console.log('--- NEON DATABASE INTEGRITY VERIFICATION ---');

  // 1. Connection check
  await prisma.$connect();
  console.log('1. Neon PostgreSQL connection: SUCCESS');

  // 2. Query table counts
  const [users, brands, categories, subcategories, products, productImages, variants, coupons, banners] = await Promise.all([
    prisma.user.count(),
    prisma.brand.count(),
    prisma.category.count(),
    prisma.subCategory.count(),
    prisma.product.count(),
    prisma.productImage.count(),
    prisma.productVariant.count(),
    prisma.coupon.count(),
    prisma.banner.count(),
  ]);

  console.log(`2. Record counts:
   - Users: ${users}
   - Brands: ${brands}
   - Categories: ${categories}
   - SubCategories: ${subcategories}
   - Products: ${products}
   - ProductImages: ${productImages}
   - ProductVariants: ${variants}
   - Coupons: ${coupons}
   - Banners: ${banners}`);

  // 3. Relational integrity check (Product with Category, Brand, Images, and Variants)
  const product = await prisma.product.findUnique({
    where: { slug: 'signature-jet-black-nida-abaya' },
    include: {
      brand: true,
      category: true,
      subCategory: true,
      images: { orderBy: { sortOrder: 'asc' } },
      variants: { orderBy: { size: 'asc' } },
    },
  });

  if (product && product.brand && product.category && product.variants.length === 7) {
    console.log('3. Relational integrity verification: SUCCESS');
    console.log(`   Product: "${product.name}"`);
    console.log(`   Brand: "${product.brand.name}"`);
    console.log(`   Category: "${product.category.name}"`);
    console.log(`   Images linked: ${product.images.length}`);
    console.log(`   Variants linked: ${product.variants.length} (${product.variants.map((v) => v.size).join(', ')})`);
    console.log(`   Sample Variant SKU: ${product.variants[0].sku}, Price: ${product.variants[0].price}, OfferPrice: ${product.variants[0].offerPrice}, Qty: ${product.variants[0].qty}`);
  } else {
    throw new Error('Relational check failed');
  }

  // 4. Query PostgreSQL information_schema to verify all tables exist
  const tables: any = await prisma.$queryRaw`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `;
  const tableNames = tables.map((t: any) => t.table_name);
  console.log(`4. Existing PostgreSQL tables (${tableNames.length}):`, tableNames.join(', '));

  console.log('--- ALL VERIFICATIONS PASSED ---');
}

verify()
  .catch((e) => {
    console.error('Verification failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


import { PrismaClient, Role, DiscountType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Moodest database seed...');

  // 1. Strict Admin Seed Security (NO hardcoded credentials or fallbacks)
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const rawAdminPassword = process.env.SEED_ADMIN_PASSWORD?.trim();
  const adminName = process.env.SEED_ADMIN_NAME?.trim() || 'Moodest Store Administrator';
  // SEED_ADMIN_RESET_PASSWORD flag:
  // - default: false -> create admin if missing; if admin already exists, do NOT overwrite the existing passwordHash.
  // - true: explicitly rotate/update the existing admin passwordHash to SEED_ADMIN_PASSWORD.
  // Passwords and hashes are NEVER logged.
  const resetPassword = process.env.SEED_ADMIN_RESET_PASSWORD?.trim().toLowerCase() === 'true';

  if (!adminEmail || !rawAdminPassword) {
    console.error('❌ SEED ABORTED: Both SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required environment variables.');
    console.error('Please configure SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in your .env file before running seed.');
    process.exit(1);
  }

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  let adminUser;
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(rawAdminPassword, 10);
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: adminName,
        role: Role.ADMIN,
        isActive: true,
      },
    });
    console.log(`✅ Admin user seeded (created): ${adminUser.email} [Role: ${adminUser.role}]`);
  } else if (resetPassword) {
    const passwordHash = await bcrypt.hash(rawAdminPassword, 10);
    adminUser = await prisma.user.update({
      where: { email: adminEmail },
      data: {
        name: adminName,
        role: Role.ADMIN,
        isActive: true,
        passwordHash,
      },
    });
    console.log(`✅ Admin user password updated (SEED_ADMIN_RESET_PASSWORD=true): ${adminUser.email}`);
  } else {
    adminUser = await prisma.user.update({
      where: { email: adminEmail },
      data: {
        name: adminName,
        role: Role.ADMIN,
        isActive: true,
        // passwordHash is deliberately preserved
      },
    });
    console.log(`ℹ️ Admin user already exists; password preserved (SEED_ADMIN_RESET_PASSWORD=false): ${adminUser.email}`);
  }

  // 2. Seed Single Brand: Moodest Studio
  const brand = await prisma.brand.upsert({
    where: { slug: 'moodest-studio' },
    update: {
      name: 'Moodest Studio',
      logo: '/brand/logo-gold.svg',
      isActive: true,
    },
    create: {
      name: 'Moodest Studio',
      slug: 'moodest-studio',
      logo: '/brand/logo-gold.svg',
      isActive: true,
    },
  });
  console.log(`✅ Brand seeded: ${brand.name} [slug: ${brand.slug}]`);

  // 3. Seed Core Abaya Categories
  const categoriesData = [
    {
      name: 'Syrian Collection',
      slug: 'syrian-collection',
      description: 'Authentic Syrian artisanal embroidery and delicate handwoven details on breathable luxury fabrics.',
      image: '/abaya/categories/handwork-abaya.jpg',
    },
    {
      name: 'The Classics',
      slug: 'the-classics',
      description: 'Timeless black abayas crafted from premium midnight Nida with clean, versatile cuts.',
      image: '/abaya/categories/classic-black.jpg',
    },
    {
      name: 'The Luxe Edit',
      slug: 'the-luxe-edit',
      description: 'Opulent silk satin and textured organza edits tailored for unmatched elegance.',
      image: '/abaya/categories/silk-satin.jpg',
    },
    {
      name: 'Occasion Wear',
      slug: 'occasion-wear',
      description: 'Statement celebratory silhouettes with intricate crystal beading and graceful drapes.',
      image: '/abaya/categories/bridal-occasion.jpg',
    },
    {
      name: 'Kimono & Kaftan',
      slug: 'kimono-kaftan',
      description: 'Flowing bisht cuts and relaxed kaftans designed for effortless modest layering.',
      image: '/abaya/categories/kimono-abaya.jpg',
    },
    {
      name: 'Open Abaya Edit',
      slug: 'open-abaya-edit',
      description: 'Front-open silhouettes with tailored lapels and coordinating inner slip options.',
      image: '/abaya/categories/front-open.jpg',
    },
  ];

  const categories: Record<string, any> = {};
  for (const cat of categoriesData) {
    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        image: cat.image,
      },
      create: cat,
    });
    categories[cat.slug] = record;
  }
  console.log(`✅ ${Object.keys(categories).length} Categories seeded`);

  // 4. Seed SubCategories
  const subCategoriesData = [
    { name: 'Front Open Abayas', slug: 'front-open-abayas', categorySlug: 'everyday-abayas' },
    { name: 'Pull-over Closed Abayas', slug: 'pull-over-closed-abayas', categorySlug: 'everyday-abayas' },
    { name: 'Hand-Embroidered Luxury', slug: 'hand-embroidered-luxury', categorySlug: 'occasion-luxury-abayas' },
    { name: 'Bridal Velvet Abayas', slug: 'bridal-velvet-abayas', categorySlug: 'occasion-luxury-abayas' },
    { name: 'French Khimars', slug: 'french-khimars', categorySlug: 'jilbabs-khimars' },
    { name: 'Malaysian Instant Stoles', slug: 'malaysian-instant-stoles', categorySlug: 'hijabs-stoles' },
  ];

  const subcategories: Record<string, any> = {};
  for (const sub of subCategoriesData) {
    const parentCategory = categories[sub.categorySlug];
    if (parentCategory) {
      const record = await prisma.subCategory.upsert({
        where: { slug: sub.slug },
        update: {
          name: sub.name,
          categoryId: parentCategory.id,
        },
        create: {
          name: sub.name,
          slug: sub.slug,
          categoryId: parentCategory.id,
        },
      });
      subcategories[sub.slug] = record;
    }
  }
  console.log(`✅ ${Object.keys(subcategories).length} Subcategories seeded`);

  // 5. Seed Showcase Products with Variants & Images
  const everydayCat = categories['everyday-abayas'];
  const frontOpenSub = subcategories['front-open-abayas'];

  const product1 = await prisma.product.upsert({
    where: { slug: 'signature-jet-black-nida-abaya' },
    update: {
      name: 'Moodest Signature Jet Black Nida Abaya',
      description: 'Our quintessential classic abaya made from ultra-soft Korean Nida fabric. Features clean lines, discreet side pockets, and flowing drape.',
      fabric: 'Premium Korean Nida',
      careInstructions: 'Dry clean recommended or gentle cold hand wash. Low heat iron.',
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
      brandId: brand.id,
      categoryId: everydayCat?.id,
      subCategoryId: frontOpenSub?.id,
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: false,
    },
    create: {
      name: 'Moodest Signature Jet Black Nida Abaya',
      slug: 'signature-jet-black-nida-abaya',
      description: 'Our quintessential classic abaya made from ultra-soft Korean Nida fabric. Features clean lines, discreet side pockets, and flowing drape.',
      fabric: 'Premium Korean Nida',
      careInstructions: 'Dry clean recommended or gentle cold hand wash. Low heat iron.',
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
      brandId: brand.id,
      categoryId: everydayCat?.id,
      subCategoryId: frontOpenSub?.id,
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: false,
    },
  });

  // Seed Product Images
  const images = [
    { url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80', alt: 'Signature Jet Black Front View', sortOrder: 0 },
    { url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80', alt: 'Signature Jet Black Side Drape', sortOrder: 1 },
  ];

  for (const [idx, img] of images.entries()) {
    const existing = await prisma.productImage.findFirst({
      where: { productId: product1.id, sortOrder: idx },
    });
    if (!existing) {
      await prisma.productImage.create({
        data: {
          productId: product1.id,
          url: img.url,
          alt: img.alt,
          sortOrder: img.sortOrder,
        },
      });
    }
  }

  // Seed Variants across sizes 50 to 62
  const sizes = ['50', '52', '54', '56', '58', '60', '62'];
  for (const size of sizes) {
    const sku = `MOD-SIG-BLK-${size}`;
    await prisma.productVariant.upsert({
      where: { sku },
      update: {
        size,
        color: 'Jet Black',
        colorHex: '#0A0A0A',
        price: 3499.00,
        offerPrice: 2999.00,
        qty: 15,
        isActive: true,
      },
      create: {
        productId: product1.id,
        sku,
        size,
        color: 'Jet Black',
        colorHex: '#0A0A0A',
        price: 3499.00,
        offerPrice: 2999.00,
        qty: 15,
        isActive: true,
      },
    });
  }
  console.log(`✅ Product '${product1.name}' and 7 size variants (50-62) seeded`);

  // 6. Seed Marketing Hero Banner
  const heroBanner = await prisma.banner.upsert({
    where: { id: 'seed-hero-banner-1' },
    update: {
      title: 'Timeless Elegance & Modern Modesty',
      subtitle: 'Discover our handcrafted abayas tailored for every occasion',
      linkUrl: '/category/everyday-abayas',
      imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1600&q=80',
      section: 'HERO',
      sortOrder: 0,
      isActive: true,
    },
    create: {
      id: 'seed-hero-banner-1',
      title: 'Timeless Elegance & Modern Modesty',
      subtitle: 'Discover our handcrafted abayas tailored for every occasion',
      linkUrl: '/category/everyday-abayas',
      imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1600&q=80',
      section: 'HERO',
      sortOrder: 0,
      isActive: true,
    },
  });
  console.log(`✅ Banner seeded: ${heroBanner.title}`);

  // 7. Seed Promotional Coupon
  const coupon = await prisma.coupon.upsert({
    where: { code: 'MOODEST10' },
    update: {
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10.00,
      minOrderValue: 1000.00,
      maxDiscount: 500.00,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-12-31'),
      isActive: true,
    },
    create: {
      code: 'MOODEST10',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10.00,
      minOrderValue: 1000.00,
      maxDiscount: 500.00,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-12-31'),
      isActive: true,
    },
  });
  console.log(`✅ Coupon seeded: ${coupon.code} [${coupon.discountValue}% off]`);

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

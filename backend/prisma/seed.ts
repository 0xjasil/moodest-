import { PrismaClient, Role, DiscountType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Moodest database seed...');

  // 1. Strict Admin Seed Security (NO hardcoded credentials or fallbacks)
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const rawAdminPassword = process.env.SEED_ADMIN_PASSWORD?.trim();
  const adminName = process.env.SEED_ADMIN_NAME?.trim() || 'Moodest Store Administrator';
  const resetPassword = process.env.SEED_ADMIN_RESET_PASSWORD?.trim().toLowerCase() === 'true';

  if (!adminEmail || !rawAdminPassword) {
    console.warn('⚠️ SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD not set in env, skipping admin account seed.');
  } else {
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash(rawAdminPassword, 10);
      await prisma.user.create({
        data: {
          email: adminEmail,
          passwordHash,
          name: adminName,
          role: Role.ADMIN,
          isActive: true,
        },
      });
      console.log(`✅ Admin user seeded: ${adminEmail}`);
    } else if (resetPassword) {
      const passwordHash = await bcrypt.hash(rawAdminPassword, 10);
      await prisma.user.update({
        where: { email: adminEmail },
        data: {
          name: adminName,
          role: Role.ADMIN,
          isActive: true,
          passwordHash,
        },
      });
      console.log(`✅ Admin user password updated: ${adminEmail}`);
    }
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
      name: 'The Classics',
      slug: 'the-classics',
      description: 'Timeless black abayas crafted from premium midnight Nida with clean, versatile cuts.',
      image: '/abaya/categories/classic-black.jpg',
    },
    {
      name: 'Syrian Collection',
      slug: 'syrian-collection',
      description: 'Authentic Syrian artisanal embroidery and delicate handwoven details on breathable luxury fabrics.',
      image: '/abaya/categories/handwork-abaya.jpg',
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

  // 4. Products Catalog
  const productsToSeed = [
    {
      name: 'Moodest Signature Jet Black Nida Abaya',
      slug: 'signature-jet-black-nida-abaya',
      categorySlug: 'the-classics',
      fabric: 'Premium Korean Nida',
      careInstructions: 'Dry clean recommended or gentle cold hand wash. Low heat iron.',
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80',
      description: 'Our quintessential classic abaya made from ultra-soft Korean Nida fabric. Features clean lines, discreet side pockets, and flowing drape.',
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: false,
      gallery: [
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1000&q=80'
      ],
      variants: [
        { size: '50', color: 'Jet Black', colorHex: '#0A0A0A', price: 3499, offerPrice: 2999, qty: 15 },
        { size: '52', color: 'Jet Black', colorHex: '#0A0A0A', price: 3499, offerPrice: 2999, qty: 15 },
        { size: '54', color: 'Jet Black', colorHex: '#0A0A0A', price: 3499, offerPrice: 2999, qty: 15 },
        { size: '56', color: 'Jet Black', colorHex: '#0A0A0A', price: 3499, offerPrice: 2999, qty: 15 },
        { size: '58', color: 'Jet Black', colorHex: '#0A0A0A', price: 3499, offerPrice: 2999, qty: 15 },
        { size: '60', color: 'Jet Black', colorHex: '#0A0A0A', price: 3499, offerPrice: 2999, qty: 15 },
      ]
    },
    {
      name: 'Medina Classic Front-Open Abaya',
      slug: 'medina-classic-front-open-abaya',
      categorySlug: 'the-classics',
      fabric: 'Breathable Korean Nida',
      careInstructions: 'Machine wash delicate or cold hand wash. Cool iron on reverse.',
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80',
      description: 'Crafted from ultra-soft, wrinkle-resistant Korean Nida, the Medina Classic features a minimalist front-open cut with concealed snap buttons and deep tailored side pockets.',
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: false,
      gallery: [
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80'
      ],
      variants: [
        { size: '52', color: 'Midnight Black', colorHex: '#111111', price: 3899, offerPrice: 3499, qty: 15 },
        { size: '54', color: 'Midnight Black', colorHex: '#111111', price: 3899, offerPrice: 3499, qty: 20 },
        { size: '56', color: 'Midnight Black', colorHex: '#111111', price: 3899, offerPrice: 3499, qty: 18 },
        { size: '58', color: 'Midnight Black', colorHex: '#111111', price: 3899, offerPrice: 3499, qty: 10 },
      ]
    },
    {
      name: 'Zahra Everyday Linen Abaya',
      slug: 'zahra-everyday-linen-abaya',
      categorySlug: 'the-classics',
      fabric: 'Washed Organic Linen-Crepe',
      careInstructions: 'Gentle cycle, cold water. Hang dry in shade. Light steam.',
      image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1000&q=80',
      description: 'An airy, relaxed-fit silhouette cut from natural organic linen blend. Features rolled cuff accents, side splits, and an optional matching fabric tie sash.',
      isFeatured: false,
      isBestSeller: true,
      isNewArrival: true,
      gallery: [
        'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1000&q=80'
      ],
      variants: [
        { size: '52', color: 'Sand Beige', colorHex: '#d8c7b5', price: 4299, offerPrice: 3799, qty: 10 },
        { size: '54', color: 'Sand Beige', colorHex: '#d8c7b5', price: 4299, offerPrice: 3799, qty: 15 },
        { size: '56', color: 'Sand Beige', colorHex: '#d8c7b5', price: 4299, offerPrice: 3799, qty: 12 },
      ]
    },
    {
      name: 'Damascus Floral Handwork Abaya',
      slug: 'damascus-floral-handwork-abaya',
      categorySlug: 'syrian-collection',
      fabric: 'Syrian Textured Royal Georgette',
      careInstructions: 'Specialist dry clean only. Do not soak.',
      image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1000&q=80',
      description: 'Authentic Levantine artisan embroidery inspired by antique Damascus motifs. Each cuff and front hem is meticulously hand-stitched with micro-silk threads.',
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: false,
      gallery: [
        'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1000&q=80'
      ],
      variants: [
        { size: '52', color: 'Jet Black with Gold Thread', colorHex: '#1a1a1a', price: 6499, offerPrice: 5999, qty: 8 },
        { size: '54', color: 'Jet Black with Gold Thread', colorHex: '#1a1a1a', price: 6499, offerPrice: 5999, qty: 14 },
        { size: '56', color: 'Jet Black with Gold Thread', colorHex: '#1a1a1a', price: 6499, offerPrice: 5999, qty: 10 },
      ]
    },
    {
      name: 'Aleppo Royal Bisht Abaya',
      slug: 'aleppo-royal-bisht-abaya',
      categorySlug: 'syrian-collection',
      fabric: 'Heavyweight Matte Satin Silk',
      careInstructions: 'Professional dry clean only. Steam softly.',
      image: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&w=1000&q=80',
      description: 'A regal bisht cape silhouette adorned with authentic Syrian braided gimp lace borders. Featuring wide dramatic sleeves and a fluid royal drape.',
      isFeatured: true,
      isBestSeller: false,
      isNewArrival: true,
      gallery: [
        'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&w=1000&q=80'
      ],
      variants: [
        { size: '54', color: 'Forest Pine', colorHex: '#1c3329', price: 7299, offerPrice: 6899, qty: 8 },
        { size: '56', color: 'Forest Pine', colorHex: '#1c3329', price: 7299, offerPrice: 6899, qty: 10 },
      ]
    },
    {
      name: 'Layla Shimmer Kimono Abaya',
      slug: 'layla-shimmer-kimono-abaya',
      categorySlug: 'the-luxe-edit',
      fabric: 'Shimmer Chiffon over Silk Charmeuse',
      careInstructions: 'Dry clean recommended. Keep away from rough surfaces.',
      image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=1000&q=80',
      description: 'Luminous layered kimono abaya with delicate metallic lurex threading woven into French georgette.',
      isFeatured: true,
      isBestSeller: false,
      isNewArrival: true,
      gallery: [
        'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=1000&q=80'
      ],
      variants: [
        { size: '52', color: 'Champagne Taupe', colorHex: '#bda38f', price: 5899, offerPrice: 5299, qty: 10 },
        { size: '54', color: 'Champagne Taupe', colorHex: '#bda38f', price: 5899, offerPrice: 5299, qty: 12 },
        { size: '56', color: 'Champagne Taupe', colorHex: '#bda38f', price: 5899, offerPrice: 5299, qty: 8 },
      ]
    },
    {
      name: 'Sultana Velvet Layered Abaya',
      slug: 'sultana-velvet-layered-abaya',
      categorySlug: 'the-luxe-edit',
      fabric: 'Crushed Silk Velvet with Cupro Lining',
      careInstructions: 'Dry clean only. Steam vertical only, do not press iron.',
      image: 'https://images.unsplash.com/photo-1550614000-4895a10e1bfd?auto=format&fit=crop&w=1000&q=80',
      description: 'An opulent evening creation fashioned from sumptuous plush micro-velvet. Features subtle satin contrast lapels and an elongated flowing silhouette.',
      isFeatured: false,
      isBestSeller: false,
      isNewArrival: true,
      gallery: [
        'https://images.unsplash.com/photo-1550614000-4895a10e1bfd?auto=format&fit=crop&w=1000&q=80'
      ],
      variants: [
        { size: '54', color: 'Royal Burgundy', colorHex: '#581825', price: 8499, offerPrice: 7799, qty: 6 },
        { size: '56', color: 'Royal Burgundy', colorHex: '#581825', price: 8499, offerPrice: 7799, qty: 8 },
      ]
    },
    {
      name: 'Shahana Beaded Bridal Abaya',
      slug: 'shahana-beaded-bridal-abaya',
      categorySlug: 'occasion-wear',
      fabric: 'French Multi-Tier Organza & Silk Crepe',
      careInstructions: 'Specialist haute-couture dry clean only.',
      image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=80',
      description: 'Created for weddings and formal gala evenings. Adorned with Swarovski crystals, pearl seed beads, and floral lace appliqués.',
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: false,
      gallery: [
        'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=80'
      ],
      variants: [
        { size: '52', color: 'Pristine Ivory', colorHex: '#fcf8f2', price: 11999, offerPrice: 10499, qty: 5 },
        { size: '54', color: 'Pristine Ivory', colorHex: '#fcf8f2', price: 11999, offerPrice: 10499, qty: 8 },
      ]
    },
    {
      name: 'Soraya Pleated Accordion Abaya',
      slug: 'soraya-pleated-accordion-abaya',
      categorySlug: 'occasion-wear',
      fabric: 'Japanese Crepe-de-Chine',
      careInstructions: 'Dry clean only. Gentle steam from distance.',
      image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=1000&q=80',
      description: 'Architectural sunburst accordion pleats expand gracefully with movement. Features sleek concealed buttons and a refined mandarin collar.',
      isFeatured: false,
      isBestSeller: false,
      isNewArrival: true,
      gallery: [
        'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=1000&q=80'
      ],
      variants: [
        { size: '54', color: 'Emerald Green', colorHex: '#13402e', price: 6899, offerPrice: 6299, qty: 10 },
        { size: '56', color: 'Emerald Green', colorHex: '#13402e', price: 6899, offerPrice: 6299, qty: 8 },
      ]
    },
    {
      name: 'Amani Moroccan Cut Kaftan Abaya',
      slug: 'amani-moroccan-cut-kaftan-abaya',
      categorySlug: 'kimono-kaftan',
      fabric: 'Airflow Turkish Cey Crepe',
      careInstructions: 'Delicate hand wash. Flat air dry. Medium iron.',
      image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1000&q=80',
      description: 'Inspired by traditional Maghreb kaftans with authentic braided sfifa trimming and handmade aakid buttons.',
      isFeatured: true,
      isBestSeller: false,
      isNewArrival: false,
      gallery: [
        'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1000&q=80'
      ],
      variants: [
        { size: '54', color: 'Warm Cocoa', colorHex: '#523a28', price: 4799, offerPrice: 4299, qty: 10 },
        { size: '56', color: 'Warm Cocoa', colorHex: '#523a28', price: 4799, offerPrice: 4299, qty: 12 },
      ]
    },
    {
      name: 'Aura Batwing Relaxed Kaftan',
      slug: 'aura-batwing-relaxed-kaftan',
      categorySlug: 'kimono-kaftan',
      fabric: 'Silky Modal Twill',
      careInstructions: 'Machine wash cold. Low tumble dry or hang dry.',
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80',
      description: 'Ultra-draped batwing silhouette that provides full modest coverage with maximum freedom of movement.',
      isFeatured: false,
      isBestSeller: true,
      isNewArrival: true,
      gallery: [
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80'
      ],
      variants: [
        { size: 'Free Size', color: 'Pebble Grey', colorHex: '#94928e', price: 3699, offerPrice: 3199, qty: 25 },
      ]
    },
    {
      name: 'Ruaa Reversible Two-Tone Open Abaya',
      slug: 'ruaa-reversible-two-tone-open-abaya',
      categorySlug: 'open-abaya-edit',
      fabric: 'Double-Woven Korean Cey Crepe',
      careInstructions: 'Hand wash or dry clean. Low iron.',
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80',
      description: 'Two luxurious styles in one single garment. Double-faced fabric enables wearing charcoal grey on one day and midnight black on the next.',
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: false,
      gallery: [
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80'
      ],
      variants: [
        { size: '54', color: 'Charcoal / Black', colorHex: '#2b2b2b', price: 4999, offerPrice: 4499, qty: 15 },
        { size: '56', color: 'Charcoal / Black', colorHex: '#2b2b2b', price: 4999, offerPrice: 4499, qty: 14 },
      ]
    },
    {
      name: 'Farasha Flowing Open Shrug Abaya',
      slug: 'farasha-flowing-open-shrug-abaya',
      categorySlug: 'open-abaya-edit',
      fabric: 'Multi-Chiffon Georgette',
      careInstructions: 'Delicate cold hand wash. Drip dry.',
      image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=1000&q=80',
      description: 'Floor-skimming butterfly farasha wings that ripple with grace. Designed to be styled effortlessly over casual outfits or evening slips.',
      isFeatured: false,
      isBestSeller: false,
      isNewArrival: true,
      gallery: [
        'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=1000&q=80'
      ],
      variants: [
        { size: '54', color: 'Dusty Plum', colorHex: '#4d2d38', price: 3999, offerPrice: 3499, qty: 14 },
        { size: '56', color: 'Dusty Plum', colorHex: '#4d2d38', price: 3999, offerPrice: 3499, qty: 10 },
      ]
    }
  ];

  for (const item of productsToSeed) {
    const category = categories[item.categorySlug];
    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        description: item.description,
        fabric: item.fabric,
        careInstructions: item.careInstructions,
        image: item.image,
        brandId: brand.id,
        categoryId: category?.id,
        isFeatured: item.isFeatured,
        isBestSeller: item.isBestSeller,
        isNewArrival: item.isNewArrival,
        isArchived: false,
      },
      create: {
        name: item.name,
        slug: item.slug,
        description: item.description,
        fabric: item.fabric,
        careInstructions: item.careInstructions,
        image: item.image,
        brandId: brand.id,
        categoryId: category?.id,
        isFeatured: item.isFeatured,
        isBestSeller: item.isBestSeller,
        isNewArrival: item.isNewArrival,
        isArchived: false,
      },
    });

    for (const [idx, imgUrl] of item.gallery.entries()) {
      const existingImg = await prisma.productImage.findFirst({
        where: { productId: product.id, sortOrder: idx },
      });
      if (!existingImg) {
        await prisma.productImage.create({
          data: {
            productId: product.id,
            url: imgUrl,
            alt: `${item.name} View ${idx + 1}`,
            sortOrder: idx,
          },
        });
      }
    }

    for (const v of item.variants) {
      const sku = `${item.slug.slice(0, 8).toUpperCase()}-${v.color.slice(0, 3).toUpperCase()}-${v.size.replace(/\s+/g, '')}`;
      await prisma.productVariant.upsert({
        where: { sku },
        update: {
          size: v.size,
          color: v.color,
          colorHex: v.colorHex,
          price: v.price,
          offerPrice: v.offerPrice,
          image: item.image,
          qty: v.qty,
          isActive: true,
        },
        create: {
          productId: product.id,
          sku,
          size: v.size,
          color: v.color,
          colorHex: v.colorHex,
          price: v.price,
          offerPrice: v.offerPrice,
          image: item.image,
          qty: v.qty,
          isActive: true,
        },
      });
    }

    console.log(`✅ Seeded: ${product.name}`);
  }

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

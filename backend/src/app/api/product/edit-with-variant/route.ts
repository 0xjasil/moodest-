import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import uploadPhoto from "@/lib/upload";
import { Prisma } from "@prisma/client";


function generateSKU(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`.toUpperCase();
}

// Type definitions for API
interface AttributeInput {
  attributeId: string;
  valueId: string;
}

interface VariantInput {
  id?: string; // Existing variant ID (for updates)
  price?: number;
  qty?: number;
  offerPrice?: number;
  images: File[];
  attributes: AttributeInput[];
  isNew?: boolean;
  isModified?: boolean;
}

interface ProcessedVariant {
  id?: string;
  isNew?: boolean;
  isModified?: boolean;
  price: number;
  qty: number;
  offerPrice?: number;
  images: string[];
  attributes: AttributeInput[];
}

interface CreateProcessedVariant extends ProcessedVariant {
  imageUrls: string[];
  finalPrice: number;
  finalQty: number;
  finalOfferPrice?: number;
}

export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();

    // 1. Get product ID
    const productId = formData.get("productId") as string;
    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required for update" },
        { status: 400 }
      );
    }

    // 2. Parse base product data
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const basePrice = parseFloat(formData.get("basePrice") as string) || 0;
    const baseQuantity = parseInt(formData.get("baseQuantity") as string) || 0;
    const baseDiscountPrice = parseFloat(formData.get("baseDiscountPrice") as string) || 0;
    const brandId = (formData.get("brandId") as string) || null;
    const categoryId = formData.get("categoryId") as string;
    const subCategoryId = formData.get("subCategoryId") as string;
    const isCustomerFavorite = formData.get("isCustomerFavorite") === "true";
    const isNewArrival = formData.get("isNewArrival") === "true";

    // 3. Handle main image (new File or existing URL)
    let mainImageUrl: string;
    const mainImageFile = formData.get("mainImage") as File | null;
    const existingMainImage = formData.get("existingMainImage") as string | null;

    if (mainImageFile) {
      mainImageUrl = await uploadPhoto(mainImageFile);
    } else if (existingMainImage) {
      mainImageUrl = existingMainImage;
    } else {
      return NextResponse.json(
        { error: "Main image is required" },
        { status: 400 }
      );
    }

    // 4. Handle thumbnails (mix of new Files and existing URLs)
    const thumbnailUrls: string[] = [];
    const existingThumbnails = formData.get("existingThumbnails");
    
    if (existingThumbnails) {
      const existing = JSON.parse(existingThumbnails as string);
      thumbnailUrls.push(...existing);
    }

    // Upload new thumbnails
    let thumbnailIndex = 0;
    const newThumbnailFiles: File[] = [];
    while (formData.has(`newThumbnails[${thumbnailIndex}]`)) {
      newThumbnailFiles.push(formData.get(`newThumbnails[${thumbnailIndex}]`) as File);
      thumbnailIndex++;
    }

    if (newThumbnailFiles.length > 0) {
      const uploadedThumbnails = await Promise.all(
        newThumbnailFiles.map((img) => uploadPhoto(img))
      );
      thumbnailUrls.push(...uploadedThumbnails);
    }

    // 5. Parse variants data
    const variantsData = JSON.parse(formData.get("variants") as string);
    const deletedVariantIds = formData.get("deletedVariantIds") 
      ? JSON.parse(formData.get("deletedVariantIds") as string) 
      : [];

    // 6. Process variant images (existing URLs + new Files)
    const processedVariantsPromises = variantsData.map(async (variant: VariantInput, index: number): Promise<ProcessedVariant> => {
      const variantImageUrls: string[] = [];

      // Get existing images for this variant
      const existingVariantImages = formData.get(`existingVariantImages[${index}]`);
      if (existingVariantImages) {
        const existing = JSON.parse(existingVariantImages as string) as string[];
        variantImageUrls.push(...existing);
      }

      // Upload new images for this variant
      const newVariantImages: File[] = [];
      let imgIndex = 0;
      while (formData.has(`variantImages[${index}][${imgIndex}]`)) {
        newVariantImages.push(formData.get(`variantImages[${index}][${imgIndex}]`) as File);
        imgIndex++;
      }

      if (newVariantImages.length > 0) {
        const uploadedImages = await Promise.all(
          newVariantImages.map((img) => uploadPhoto(img))
        );
        variantImageUrls.push(...uploadedImages);
      }

      // Fallback to thumbnails if no variant images
      const finalImages = variantImageUrls.length > 0 ? variantImageUrls : thumbnailUrls;

      return {
        id: variant.id,
        isNew: variant.isNew,
        isModified: variant.isModified,
        price: variant.price ?? basePrice,
        qty: variant.qty ?? baseQuantity,
        offerPrice: (variant.offerPrice ?? baseDiscountPrice) > 0 
          ? (variant.offerPrice ?? baseDiscountPrice) 
          : undefined,
        images: finalImages,
        attributes: variant.attributes,
      };
    });

    const processedVariants = await Promise.all(processedVariantsPromises);

    // 7. Validation
    if (!name || !categoryId || !subCategoryId || basePrice <= 0 || processedVariants.length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid required product data" },
        { status: 400 }
      );
    }

    // 8. Execute database transaction
    const updatedProduct = await prisma.$transaction(async (tx) => {
      
      // A. Update base product
      const product = await tx.product.update({
        where: { id: productId },
        data: {
          name,
          description,
          image: mainImageUrl,
          brandId: brandId || undefined,
          categoryId,
          subCategoryId,
          isCustomerFavorite,
          isNewArrival,
        },
      });

      // B. Delete removed variants (and their options will cascade)
      if (deletedVariantIds.length > 0) {
        await tx.productVariant.deleteMany({
          where: {
            id: { in: deletedVariantIds },
            productId: product.id,
          },
        });
      }

      // C. Process each variant (CREATE, UPDATE, or SKIP)
      for (const variant of processedVariants) {
        
        if (variant.isNew) {
          // CREATE NEW VARIANT
          const sku = `SKU-${generateSKU()}`;
          
          const newVariant = await tx.productVariant.create({
            data: {
              productId: product.id,
              sku,
              price: variant.price,
              offerPrice: variant.offerPrice,
              qty: variant.qty,
              images: variant.images,
            },
          });

          // Create variant options
          const variantOptionsData = variant.attributes.map((attr : { attributeId: string; valueId: string; }) => ({
            productVariantId: newVariant.id,
            attributeId: attr.attributeId,
            valueId: attr.valueId,
          }));

          await tx.variantOption.createMany({
            data: variantOptionsData,
          });

        } else if (variant.isModified) {
          // UPDATE EXISTING VARIANT
          await tx.productVariant.update({
            where: { id: variant.id },
            data: {
              price: variant.price,
              offerPrice: variant.offerPrice,
              qty: variant.qty,
              images: variant.images,
            },
          });

          // Delete old variant options
          await tx.variantOption.deleteMany({
            where: {
              productVariantId: variant.id,
            },
          });

          // Create new variant options
          const variantOptionsData = variant.attributes.map((attr : { attributeId: string; valueId: string; }) => ({
            productVariantId: variant.id!,
            attributeId: attr.attributeId,
            valueId: attr.valueId,
          }));

          await tx.variantOption.createMany({
            data: variantOptionsData,
          });
        }
        // If neither isNew nor isModified, we skip (no changes needed)
      }

      return product;
    }, {
      timeout: 30000, // 30 seconds for complex updates
    });

    // 9. Fetch complete updated product with relations
    const completeProduct = await prisma.product.findUnique({
      where: { id: updatedProduct.id },
      include: {
        brand: true,
        category: true,
        subCategory: true,
        variants: {
          include: {
            options: {
              include: {
                attribute: true,
                attributeValue: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Product updated successfully",
        product: completeProduct,
      },
      { status: 200 }
    );

  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    console.error("Product update error:", error);

    if ((error as Prisma.PrismaClientKnownRequestError).code === 'P2028') {
      return NextResponse.json(
        { error: "Transaction timed out. Please try again." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to update product",
        details: details,
      },
      { status: 500 }
    );
  }
}

// ============================================
// POST - CREATE NEW PRODUCT (Keep your existing code)
// ============================================
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Parse all input data from FormData
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const basePrice = parseFloat(formData.get("basePrice") as string) || 0;
    const baseQuantity = parseInt(formData.get("baseQuantity") as string) || 0;
    const baseDiscountPrice = parseFloat(formData.get("baseDiscountPrice") as string) || 0;

    const brandId = (formData.get("brandId") as string) || null;
    const categoryId = formData.get("categoryId") as string;
    const subCategoryId = formData.get("subCategoryId") as string;
    const isCustomerFavorite = formData.get("isCustomerFavorite") === "true";
    const isNewArrival = formData.get("isNewArrival") === "true";

    const mainImage = formData.get("mainImage") as File;

    const thumbnails: File[] = [];
    let thumbnailIndex = 0;
    while (formData.has(`thumbnails[${thumbnailIndex}]`)) {
      thumbnails.push(formData.get(`thumbnails[${thumbnailIndex}]`) as File);
      thumbnailIndex++;
    }

    const variantsData = JSON.parse(formData.get("variants") as string);
    const variants: VariantInput[] = variantsData.map((v: VariantInput, index: number) => {
      const variantImages: File[] = [];
      let imgIndex = 0;
      while (formData.has(`variantImages[${index}][${imgIndex}]`)) {
        variantImages.push(formData.get(`variantImages[${index}][${imgIndex}]`) as File);
        imgIndex++;
      }
      return {
        price: v.price,
        qty: v.qty,
        offerPrice: v.offerPrice,
        images: variantImages,
        attributes: v.attributes,
      };
    });

    // Validation
    if (!name || !categoryId || !subCategoryId || !mainImage || basePrice <= 0 || variants.length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid required product data" },
        { status: 400 }
      );
    }

    // Upload all images outside transaction
    const mainImageUrl = await uploadPhoto(mainImage);
    const thumbnailUrls = await Promise.all(
      thumbnails.map((img) => uploadPhoto(img))
    );

    const processedVariantsPromises = variants.map(async (variant): Promise<CreateProcessedVariant> => {
      let variantImageUrls: string[];

      if (variant.images && variant.images.length > 0) {
        variantImageUrls = await Promise.all(
          variant.images.map((img) => uploadPhoto(img))
        );
      } else {
        variantImageUrls = thumbnailUrls;
      }

      return {
        price: variant.price ?? basePrice,
        qty: variant.qty ?? baseQuantity,
        offerPrice: variant.offerPrice,
        images: variantImageUrls,
        attributes: variant.attributes,
        imageUrls: variantImageUrls,
        finalPrice: variant.price ?? basePrice,
        finalQty: variant.qty ?? baseQuantity,
        finalOfferPrice: (variant.offerPrice ?? baseDiscountPrice) > 0 
          ? (variant.offerPrice ?? baseDiscountPrice) 
          : undefined,
      };
    });

    const processedVariants = await Promise.all(processedVariantsPromises);

    // Create product in transaction
    const product = await prisma.$transaction(async (tx) => {
      
      const newProduct = await tx.product.create({
        data: {
          name,
          description,
          image: mainImageUrl,
          brandId: brandId || undefined,
          categoryId,
          subCategoryId,
          isCustomerFavorite,
          isNewArrival,
        },
      });

      for (const variant of processedVariants) {
        const sku = `SKU-${generateSKU()}`;

        const newVariant = await tx.productVariant.create({
          data: {
            productId: newProduct.id,
            sku,
            price: variant.finalPrice,
            offerPrice: variant.finalOfferPrice,
            qty: variant.finalQty,
            images: variant.imageUrls,
          },
        });

        const variantOptionsData = variant.attributes.map((attr) => ({
          productVariantId: newVariant.id,
          attributeId: attr.attributeId,
          valueId: attr.valueId,
        }));

        await tx.variantOption.createMany({
          data: variantOptionsData,
        });
      }

      return newProduct;
    }, {
      timeout: 20000,
    });

    const completeProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        brand: true,
        category: true,
        subCategory: true,
        variants: {
          include: {
            options: {
              include: {
                attribute: true,
                attributeValue: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Product created successfully",
        product: completeProduct,
      },
      { status: 201 }
    );
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    console.error("Product creation error:", error);

    if ((error as Prisma.PrismaClientKnownRequestError).code === 'P2028') {
      return NextResponse.json(
        { error: "Transaction timed out. Please try again." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create product",
        details: details,
      },
      { status: 500 }
    );
  }
}
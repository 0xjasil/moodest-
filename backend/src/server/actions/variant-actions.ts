"use server";

import { actionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/prisma";
import uploadPhoto from "@/lib/upload";
import { createVariantSchema, updateVariantSchema, deleteVariantSchema } from "@/schema/variant-schema";
import { Prisma } from "@prisma/client";
import { getAuthenticatedAdmin } from "./admin-user-action";

async function ensureUniqueSku(baseSku: string) {
  let candidate = baseSku;
  let counter = 1;
  while (true) {
    const exists = await prisma.productVariant.findUnique({ where: { sku: candidate } });
    if (!exists) return candidate;
    candidate = `${baseSku}-${counter++}`;
  }
}

function generateSkuFromOptions(base: string, options: { attribute: string; value: string }[]) {
  const parts = options.map((o) => `${o.attribute}-${o.value}`.toUpperCase().replace(/\s+/g, ""));
  const suffix = parts.join("-");
  return suffix ? `${base}-${suffix}` : base;
}

export const createVariantAction = actionClient
  .inputSchema(createVariantSchema)
  .action(async ({ parsedInput }) => {
  try{
      await getAuthenticatedAdmin()
    const { productId, sku, price, qty, images, options } = parsedInput;

    // upload images
    const imageUrls: string[] = [];
    for (const file of images) {
      const url = await uploadPhoto(file);
      imageUrls.push(url);
    }

    // Normalize options to array of ids
    let opts: { attributeId: string; valueId: string }[] = [];
    if (Array.isArray(options)) {
      opts = options as unknown as { attributeId: string; valueId: string }[];
    } else {
      opts = [];
    }

    // Derive SKU if not provided
    let finalSku = sku || "";
    if (!finalSku) {
      const product = await prisma.product.findUnique({ where: { id: productId }, select: { name: true } });
      const optionRecords = await Promise.all((opts).map(async (o) => {
        const attr = await prisma.attribute.findUnique({ where: { id: o.attributeId }, select: { name: true } });
        const val = await prisma.attributeValue.findUnique({ where: { id: o.valueId }, select: { value: true } });
        return { attribute: attr?.name || "", value: val?.value || "" };
      }));
      const base = (product?.name || "SKU").toUpperCase().replace(/\s+/g, "");
      finalSku = await ensureUniqueSku(generateSkuFromOptions(base, optionRecords));
    }

    const variant = await prisma.productVariant.create({
      data: {
        productId,
        sku: finalSku,
        price,
        qty,
        images: imageUrls,
        options: {
          create: opts.map((opt) => ({
            attributeId: opt.attributeId,
            valueId: opt.valueId,
          })),
        },
      },
      include: { options: true },
    });

    return { success: true, data: variant };
  }catch(err){
    console.log("Error creating variant:", err);
    return { success: false, data: null };
  }
  });



export const updateVariantAction = actionClient
  .inputSchema(updateVariantSchema)
  .action(async ({ parsedInput }) => {
       try{
           await getAuthenticatedAdmin()

    const { id,price, qty, images, options } = parsedInput;

    const data: Partial<Prisma.ProductVariantUpdateInput> = {};
    if (price !== undefined) data.price = price;
    if (qty !== undefined) data.qty = qty;

    if (images && images.length > 0) {
      const imageUrls: string[] = [];
      for (const file of images) {
        const url = await uploadPhoto(file);
        imageUrls.push(url);
      }
      data.images = imageUrls;
    }

    // Replace options if provided
    const updated = await prisma.$transaction(async (tx) => {
      // Replace options if provided (stringified JSON)
      if (options !== undefined) {
        let opts: { attributeId: string; valueId: string }[] = [];
        if (typeof options === 'string' && options.length > 0) {
          try { opts = JSON.parse(options) as { attributeId: string; valueId: string }[]; } catch {}
        }
        await tx.variantOption.deleteMany({ where: { productVariantId: id } });
        if (opts.length > 0) {
          await tx.variantOption.createMany({
            data: opts.map((opt) => ({
            productVariantId: id,
            attributeId: opt.attributeId,
            valueId: opt.valueId,
            })),
          });
        }

        // Regenerate SKU from new options
        const variant = await tx.productVariant.findUnique({ where: { id }, select: { productId: true } });
        const product = variant ? await tx.product.findUnique({ where: { id: variant.productId }, select: { name: true } }) : null;
        const optionRecords = await tx.variantOption.findMany({
          where: { productVariantId: id },
          include: { attribute: true, attributeValue: true },
        });
        const base = (product?.name || "SKU").toUpperCase().replace(/\s+/g, "");
        const skuBase = generateSkuFromOptions(base, optionRecords.map((o) => ({ attribute: o.attribute.name, value: o.attributeValue.value })));
        // ensure unique
        let newSku = skuBase;
        let counter = 1;
        while (await tx.productVariant.findUnique({ where: { sku: newSku } })) {
          newSku = `${skuBase}-${counter++}`;
        }
        data.sku = newSku;
      }

      return tx.productVariant.update({ where: { id }, data, include: { options: true } });
    });

    return { success: true, data: updated };
       }catch(err){
        console.log("Error updating variant:", err);
        return { success: false, data: null };
       }
  });

export const deleteVariantAction = actionClient
  .inputSchema(deleteVariantSchema)
  .action(async ({ parsedInput }) => {
try{
      // Guard: if variant used in orders, block
    await getAuthenticatedAdmin()
    const used = await prisma.orderItem.findFirst({ where: { variantId: parsedInput.id }, select: { id: true } });
    if (used) {
      return { success: false, message: "Cannot delete variant. It is part of existing orders." };
    }

    await prisma.productVariant.delete({ where: { id: parsedInput.id } });
    return { success: true };
}catch(err){
  console.log("Error deleting variant:", err);
  return { success: false };
}
  });



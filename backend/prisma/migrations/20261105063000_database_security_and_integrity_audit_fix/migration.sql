-- DropForeignKey
ALTER TABLE "PaymentLog" DROP CONSTRAINT "PaymentLog_orderId_fkey";

-- Drop redundant duplicate indexes (already covered by @unique indexes)
DROP INDEX IF EXISTS "Brand_slug_idx";
DROP INDEX IF EXISTS "Category_slug_idx";
DROP INDEX IF EXISTS "Coupon_code_idx";
DROP INDEX IF EXISTS "Order_orderNumber_idx";
DROP INDEX IF EXISTS "Product_slug_idx";
DROP INDEX IF EXISTS "ProductVariant_sku_idx";
DROP INDEX IF EXISTS "SubCategory_slug_idx";
DROP INDEX IF EXISTS "User_email_idx";

-- AlterTable PaymentLog: Add unique gatewayEventId for idempotent webhook processing
ALTER TABLE "PaymentLog" ADD COLUMN "gatewayEventId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PaymentLog_gatewayEventId_key" ON "PaymentLog"("gatewayEventId");

-- CreateIndex: One reservation per order and variant
CREATE UNIQUE INDEX "StockReservation_orderId_variantId_key" ON "StockReservation"("orderId", "variantId");

-- AddForeignKey with ON DELETE RESTRICT to protect financial payment logs from accidental deletion
ALTER TABLE "PaymentLog" ADD CONSTRAINT "PaymentLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ==============================================================================
-- POSTGRESQL CHECK CONSTRAINTS FOR DATA INTEGRITY
-- ==============================================================================

-- 1. ProductVariant: Non-negative stock qty, positive price, offerPrice valid (<= price)
ALTER TABLE "ProductVariant"
  ADD CONSTRAINT "chk_product_variant_qty_non_negative" CHECK ("qty" >= 0),
  ADD CONSTRAINT "chk_product_variant_price_positive" CHECK ("price" > 0),
  ADD CONSTRAINT "chk_product_variant_offer_price_valid" CHECK ("offerPrice" IS NULL OR ("offerPrice" > 0 AND "offerPrice" <= "price"));

-- 2. CartItem: Quantity must be positive
ALTER TABLE "CartItem"
  ADD CONSTRAINT "chk_cart_item_quantity_positive" CHECK ("quantity" > 0);

-- 3. OrderItem: Quantity must be positive, unitPrice positive, totalPrice non-negative
ALTER TABLE "OrderItem"
  ADD CONSTRAINT "chk_order_item_quantity_positive" CHECK ("quantity" > 0),
  ADD CONSTRAINT "chk_order_item_unit_price_positive" CHECK ("unitPrice" > 0),
  ADD CONSTRAINT "chk_order_item_total_price_non_negative" CHECK ("totalPrice" >= 0);

-- 4. Order: Subtotal, totalAmount, tax, shipping, discount non-negative
ALTER TABLE "Order"
  ADD CONSTRAINT "chk_order_subtotal_non_negative" CHECK ("subtotal" >= 0),
  ADD CONSTRAINT "chk_order_total_amount_non_negative" CHECK ("totalAmount" >= 0),
  ADD CONSTRAINT "chk_order_tax_amount_non_negative" CHECK ("taxAmount" >= 0),
  ADD CONSTRAINT "chk_order_shipping_amount_non_negative" CHECK ("shippingAmount" >= 0),
  ADD CONSTRAINT "chk_order_discount_amount_non_negative" CHECK ("discountAmount" >= 0);

-- 5. StockReservation: Quantity must be positive
ALTER TABLE "StockReservation"
  ADD CONSTRAINT "chk_stock_reservation_quantity_positive" CHECK ("quantity" > 0);

-- 6. Review: Rating must be between 1 and 5
ALTER TABLE "Review"
  ADD CONSTRAINT "chk_review_rating_range" CHECK ("rating" >= 1 AND "rating" <= 5);

-- 7. Coupon: Positive discount, non-negative minOrderValue, percentage <= 100, valid date range
ALTER TABLE "Coupon"
  ADD CONSTRAINT "chk_coupon_discount_value_positive" CHECK ("discountValue" > 0),
  ADD CONSTRAINT "chk_coupon_min_order_value_non_negative" CHECK ("minOrderValue" >= 0),
  ADD CONSTRAINT "chk_coupon_max_discount_positive" CHECK ("maxDiscount" IS NULL OR "maxDiscount" > 0),
  ADD CONSTRAINT "chk_coupon_usage_limit_positive" CHECK ("usageLimit" IS NULL OR "usageLimit" > 0),
  ADD CONSTRAINT "chk_coupon_usage_count_non_negative" CHECK ("usageCount" >= 0),
  ADD CONSTRAINT "chk_coupon_percentage_range" CHECK ("discountType" != 'PERCENTAGE' OR ("discountValue" > 0 AND "discountValue" <= 100)),
  ADD CONSTRAINT "chk_coupon_date_range" CHECK ("endDate" >= "startDate");


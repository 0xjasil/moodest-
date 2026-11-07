# ENTERPRISE SECURITY AUDIT & VULNERABILITY ASSESSMENT
## OWASP Top 10 & Financial Security Evaluation for Moodest / Decomoja

**Date:** November 5, 2026  
**Repository:** `F:\Moodest`  
**Audit Scope:** `backend/` and `MOODEST/`  
**Classification Standard:** OWASP Top 10 (2021) & CVSS v3.1  

---

## 1. Vulnerability Findings Matrix

| Ref | Vulnerability Name | OWASP Category | Severity | File Reference | Status |
| :--- | :--- | :--- | :---: | :--- | :---: |
| **SEC-01** | Payment Amount Tampering & Forgery | A04: Insecure Design | **CRITICAL (9.8)** | `backend/src/app/api/payment/create-order/route.ts:7-23` & `verify/route.ts:11-40` | **Verified** |
| **SEC-02** | Unauthenticated Order Status Modification | A01: Broken Access Control | **CRITICAL (9.5)** | `backend/src/app/api/admin-orders/[id]/status/route.ts:9-25` | **Verified** |
| **SEC-03** | Unauthenticated Inventory Manipulation | A01: Broken Access Control | **CRITICAL (9.1)** | `backend/src/app/api/inventory/[id]/route.ts:5-41` | **Verified** |
| **SEC-04** | Unauthenticated Product Creation & Storage Abuse | A01: Broken Access Control | **CRITICAL (9.1)** | `backend/src/app/api/product/withvariant/route.ts:29-86` | **Verified** |
| **SEC-05** | Public Insecure Direct Object Reference (IDOR) on Invoices | A01: Broken Access Control | **HIGH (8.2)** | `backend/src/app/api/orders/[id]/invoice/route.ts:5-40` | **Verified** |
| **SEC-06** | Production Secrets Committed to Workspace | A05: Security Misconfiguration | **HIGH (8.5)** | `backend/.env` & `MOODEST/.env.local` | **Verified** |
| **SEC-07** | Inventory Overselling Race Condition | A04: Insecure Design | **HIGH (7.5)** | `backend/src/app/api/orders/route.ts:116-121` & `verify/route.ts:68-73` | **Verified** |
| **SEC-08** | Missing Security Headers, CORS & CSP | A05: Security Misconfiguration | **MEDIUM (5.8)** | `backend/src/middleware.ts` & `next.config.js` | **Verified** |
| **SEC-09** | Zero Rate Limiting on Authentication & Reset | A07: Identification Failures | **MEDIUM (5.3)** | `backend/src/app/api/auth/*` | **Verified** |
| **SEC-10** | Unrestricted Base64 Image Upload (DoS Risk) | A04: Insecure Design | **MEDIUM (5.0)** | `backend/src/lib/upload.ts:3-23` | **Verified** |

---

## 2. In-Depth Vulnerability Analysis & Attack Scenarios

### SEC-01: Payment Amount Tampering & Signature Forgery
* **File:** `backend/src/app/api/payment/create-order/route.ts` (lines 7–28) & `backend/src/app/api/payment/verify/route.ts` (lines 11–40)
* **Severity:** **CRITICAL (CVSS: 9.8)**
* **Vulnerability Description:**
  1. In `create-order/route.ts`:
     ```typescript
     const { totalAmount } = await req.json();
     const razorOrder = await razorpay.orders.create({
       amount: totalAmount * 100, // INR → paise
       currency: "INR",
       receipt: `rcpt_${Date.now()}`,
     });
     ```
     The server accepts `totalAmount` directly from untrusted client input without validating against database variant prices or cart contents.
  2. In `verify/route.ts`:
     The endpoint computes HMAC signature `orderId + "|" + paymentId` and checks against `razorpay_signature`.
     **However, the server NEVER queries Razorpay (`razorpay.payments.fetch(paymentId)`) to verify how much money was actually captured!**
* **Attack Scenario:**
  1. Attacker adds items worth ₹100,000 to cart.
  2. Attacker sends POST to `/api/payment/create-order` with `{ totalAmount: 1 }`.
  3. Razorpay creates a valid order for ₹1.
  4. Attacker pays ₹1 on Razorpay and obtains valid `paymentId`, `orderId`, and `signature`.
  5. Attacker sends POST to `/api/payment/verify` with valid signature and the ₹100,000 cart items list.
  6. The server confirms the signature matches the ₹1 order, marks the database order as **`PAID`**, decrements inventory, and dispatches email confirmation for ₹100,000 of goods.
* **Remediation:**
  Always calculate order total exclusively on the server from the database. When verifying payment, call `razorpay.payments.fetch(paymentId)` and assert:
  ```typescript
  const payment = await razorpay.payments.fetch(paymentId);
  if (payment.amount !== expectedTotalInPaise || payment.status !== "captured") {
    throw new Error("Payment amount mismatch");
  }
  ```

---

### SEC-02: Unauthenticated Order Status Modification
* **File:** `backend/src/app/api/admin-orders/[id]/status/route.ts` (lines 8–24)
* **Severity:** **CRITICAL (CVSS: 9.5)**
* **Vulnerability Description:**
  The route contains a code comment:
  ```typescript
  // ✅ Add admin authentication check here
  const { id } = await params;
  const { status } = await req.json();
  const order = await updateOrderStatusAndAdjustStock(id, status);
  return NextResponse.json({ success: true, order });
  ```
  **No authentication or role verification was ever added.** Any external actor can issue a POST request to `/api/admin-orders/<any_order_id>/status` with `{ "status": "CANCELLED" }` or `{ "status": "PAID" }`.
* **Impact:** An attacker can cancel all orders in the system or mark unpaid orders as paid without credentials.
* **Remediation:**
  Call `await getAuthenticatedAdmin()` at the top of the route handler.

---

### SEC-03: Unauthenticated Inventory Manipulation
* **File:** `backend/src/app/api/inventory/[id]/route.ts` (lines 5–25)
* **Severity:** **CRITICAL (CVSS: 9.1)**
* **Vulnerability Description:**
  The `PATCH` handler takes `variantId` and `qty` and updates the database:
  ```typescript
  export async function PATCH(req: Request) {
    const { variantId, qty } = await req.json();
    const variant = await prisma.productVariant.update({
      where: { id: variantId },
      data: { qty: parseInt(qty, 10) },
    });
  ```
  There is zero authentication check. Anyone can wipe out stock (`qty: 0`) or artificially inflate stock.
* **Remediation:**
  Enforce admin role authorization before executing inventory mutations.

---

### SEC-04: Unauthenticated Product Creation & Storage Abuse
* **File:** `backend/src/app/api/product/withvariant/route.ts` (lines 28–86) & `backend/src/app/api/product/edit-with-variant/route.ts` (lines 48–100)
* **Severity:** **CRITICAL (CVSS: 9.1)**
* **Vulnerability Description:**
  The endpoints accept `FormData` with product details and image files. They upload files to Cloudinary and insert records into Prisma without calling `auth.api.getSession()` or `getAuthenticatedAdmin()`.
* **Impact:** Arbitrary users can deface the storefront, inject malicious product data, and deplete Cloudinary storage quotas.
* **Remediation:** Guard route with `getAuthenticatedAdmin()`.

---

### SEC-05: Public IDOR & PII Leakage on Invoices
* **File:** `backend/src/app/api/orders/[id]/invoice/route.ts` (lines 5–40)
* **Severity:** **HIGH (CVSS: 8.2)**
* **Vulnerability Description:**
  ```typescript
  export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const order = await prisma.order.findUnique({ where: { id }, ... });
    const pdfBuffer = await generateInvoicePdfBuffer(order);
    return new NextResponse(new Uint8Array(pdfBuffer), ...);
  }
  ```
  The endpoint takes an `id` from the URL and streams the PDF invoice without checking whether the requester is logged in, is the owner of the order, or has an admin role.
* **Impact:** Anyone can iterate through order IDs and download PDFs revealing customers' full names, phone numbers, email addresses, and complete residential delivery addresses.
* **Remediation:**
  Verify that `session.user.id === order.userId || session.user.role === 'admin'`.

---

### SEC-06: Production Secrets Committed in Workspace Files
* **Files:** `backend/.env` & `MOODEST/.env.local`
* **Severity:** **HIGH (CVSS: 8.5)**
* **Vulnerability Description:**
  Plaintext production secrets are stored in repository files:
  - Live Razorpay Key ID and Live Razorpay Key Secret.
  - Live MongoDB connection string with embedded database username and password.
  - Live Cloudinary API Key and Cloudinary API Secret.
  - Live Google App Password for Gmail SMTP.
  - Live Better Auth session secret key.
  - Live Vercel OIDC JWT token.
* **Remediation:**
  Immediately rotate all exposed keys (Razorpay, Cloudinary, MongoDB, Gmail SMTP). Remove credentials from files and load via secure runtime environment injection (e.g. AWS Secrets Manager, Doppler, or Vercel Environment Variables).

---

### SEC-07: Inventory Overselling Race Condition
* **Files:** `backend/src/app/api/orders/route.ts` (lines 116–121) & `backend/src/app/api/payment/verify/route.ts` (lines 68–73)
* **Severity:** **HIGH (CVSS: 7.5)**
* **Vulnerability Description:**
  When orders are placed, the server checks stock in one query, then creates the order, and then in a separate sequential loop updates stock:
  ```typescript
  for (const item of orderItems) {
    await prisma.productVariant.update({
      where: { id: item.variantId },
      data: { qty: { decrement: item.quantity } },
    });
  }
  ```
  Neither operation is wrapped in a database transaction (`prisma.$transaction`), nor does it check `where: { id: item.variantId, qty: { gte: item.quantity } }`. Under concurrent checkouts, stock drops into negative numbers and oversells inventory.
* **Remediation:**
  Execute order creation and inventory decrement inside an atomic `$transaction` with optimistic concurrency control.

---

### SEC-08: Missing Security Headers & CSP
* **Files:** `backend/src/middleware.ts` & `next.config.js`
* **Severity:** **MEDIUM (CVSS: 5.8)**
* **Vulnerability Description:**
  Neither the backend nor the frontend sets essential HTTP security headers (`Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Referrer-Policy`).
* **Remediation:**
  Configure security headers in `next.config.js` or via Next.js middleware.

---

### SEC-09: Zero Rate Limiting on Authentication & Password Reset
* **Files:** `backend/src/app/api/auth/*`
* **Severity:** **MEDIUM (CVSS: 5.3)**
* **Vulnerability Description:**
  Endpoints for login, account creation, and password reset have no rate limiting or IP-based throttling. Attackers can execute automated brute-force attacks against user accounts or spam reset emails.
* **Remediation:**
  Implement Redis-backed sliding window rate limiting (e.g. `@upstash/ratelimit`).

---

### SEC-10: In-Memory Base64 Upload & Denial of Service
* **File:** `backend/src/lib/upload.ts` (lines 3–23)
* **Severity:** **MEDIUM (CVSS: 5.0)**
* **Vulnerability Description:**
  Uploaded images are read into memory via `await photoFile.arrayBuffer()` and converted to Base64 strings. There is no file size limit check and no MIME-type magic byte validation.
* **Impact:** Uploading multiple large files concurrently will trigger Node.js Heap Out-Of-Memory (OOM) crashes.
* **Remediation:**
  Stream uploads directly to Cloudinary or use signed client-direct uploads. Validate file magic numbers before transmission.


import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export type InvoiceOrder = {
  id: string;
  createdAt: Date | string;
  paymentMethod: string;
  status: string;
  totalAmount: number;
  name?: string | null;
  email?: string | null;
  phoneNumber: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  items: Array<{
    quantity: number;
    price: number;
    variant?: {
      sku?: string | null;
      product?: {
        name?: string | null;
      } | null;
    } | null;
  }>;
};

/**
 * Generates a PDF invoice as a Node Buffer
 */
export async function generateInvoicePdfBuffer(order: InvoiceOrder): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const orderNum = order.id.slice(-8).toUpperCase();
  const invoiceNo = `INV-DM-${orderNum}`;
  const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Colors
  const primaryColor = [15, 23, 42]; // Slate 900
  const secondaryColor = [71, 85, 105]; // Slate 600

  // 1. Header & Brand Title
  doc.setFillColor(15, 23, 42); // #0f172a
  doc.rect(0, 0, 210, 32, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("DECO MOJA", 15, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("TAX INVOICE / RECEIPT", 195, 20, { align: "right" });

  // 2. Invoice & Order Metadata Box
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`Invoice No: ${invoiceNo}`, 15, 43);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text(`Order Date: ${orderDate}`, 15, 49);
  doc.text(`Payment Method: ${order.paymentMethod === "ONLINE" ? "Online Payment (Razorpay)" : "Cash on Delivery (COD)"}`, 15, 54);
  if (order.razorpayPaymentId) {
    doc.text(`Transaction ID: ${order.razorpayPaymentId}`, 15, 59);
  }

  // Payment Status Stamp
  const isPaid = order.status === "PAID" || order.paymentMethod === "ONLINE";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  if (isPaid) {
    doc.setTextColor(16, 185, 129); // Green
    doc.text("STATUS: PAID", 195, 43, { align: "right" });
  } else {
    doc.setTextColor(234, 88, 12); // Orange
    doc.text("STATUS: PENDING COD", 195, 43, { align: "right" });
  }

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(15, 64, 195, 64);

  // 3. Billing & Shipping Info
  const startY = 71;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("BILLED TO / DELIVER TO:", 15, startY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  
  const customerName = order.name || "Valued Customer";
  const customerEmail = order.email || "N/A";
  const customerPhone = order.phoneNumber || "N/A";

  doc.text(customerName, 15, startY + 6);
  doc.text(`${order.street}`, 15, startY + 11);
  doc.text(`${order.city}, ${order.state} - ${order.pincode}`, 15, startY + 16);
  doc.text(`Phone: ${customerPhone} | Email: ${customerEmail}`, 15, startY + 21);

  // 4. Itemized Products Table
  const tableRows = order.items.map((item, index) => {
    const pName = item.variant?.product?.name || "Product Item";
    const sku = item.variant?.sku ? ` (${item.variant.sku})` : "";
    const title = `${pName}${sku}`;
    const qty = item.quantity;
    const unitPrice = `Rs. ${item.price.toFixed(2)}`;
    const lineTotal = `Rs. ${(item.price * qty).toFixed(2)}`;
    return [index + 1, title, qty, unitPrice, lineTotal];
  });

  const autoTableFn =
    typeof autoTable === "function"
      ? autoTable
      : (autoTable as unknown as { default: typeof autoTable }).default;

  autoTableFn(doc, {
    startY: startY + 28,
    head: [["#", "Item Description", "Qty", "Unit Price", "Total"]],
    body: tableRows,
    theme: "striped",
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 95 },
      2: { cellWidth: 20, halign: "center" },
      3: { cellWidth: 28, halign: "right" },
      4: { cellWidth: 27, halign: "right" },
    },
    margin: { left: 15, right: 15 },
  });

  // 5. Total Calculation Box
  const docWithAutoTable = doc as unknown as { lastAutoTable: { finalY: number } };
  const finalY = (docWithAutoTable.lastAutoTable?.finalY ?? 120) + 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("Subtotal:", 135, finalY);
  doc.text(`Rs. ${order.totalAmount.toFixed(2)}`, 195, finalY, { align: "right" });

  doc.text("Shipping & Handling:", 135, finalY + 5);
  doc.text("FREE", 195, finalY + 5, { align: "right" });

  doc.setDrawColor(226, 232, 240);
  doc.line(135, finalY + 8, 195, finalY + 8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Grand Total:", 135, finalY + 14);
  doc.text(`Rs. ${order.totalAmount.toFixed(2)}`, 195, finalY + 14, { align: "right" });

  // 6. Footer & Terms
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text("Thank you for shopping with Deco Moja!", 105, 280, { align: "center" });
  doc.text("For any support or inquiry, please contact decomojakidswears@gmail.com", 105, 284, { align: "center" });

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}

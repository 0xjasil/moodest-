import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { generateInvoicePdfBuffer } from "@/lib/invoice-generator";

// Create Nodemailer transporter
// Reads SMTP configuration from environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || "", // your SMTP email
    pass: process.env.SMTP_PASS || "", // your SMTP password / app password
  },
});

const smtpFrom = process.env.SMTP_FROM || `"Deco Moja" <noreply@decomoja.com>`;

/**
 * Sends a confirmation email to the user when an order is placed.
 * @param orderId ID of the order to confirm
 */
export async function sendOrderConfirmationEmail(orderId: string) {
  try {
    // 1. Fetch order details from database
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      console.warn(`[Email Warning] Order ${orderId} not found, skipping email.`);
      return;
    }

    const emailTo = order.email;
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || "decomojakidswears@gmail.com";

    if (!emailTo && !adminEmail) {
      console.warn(`[Email Warning] Neither customer email nor admin email is available for Order ${orderId}, skipping email.`);
      return;
    }

    const orderNumber = order.id.slice(-8).toUpperCase();
    const invoiceNo = `INV-DM-${orderNumber}`;
    const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const isPaid = order.status === "PAID" || order.paymentMethod === "ONLINE";
    const paymentBadgeColor = isPaid ? "#10b981" : "#f59e0b";
    const paymentBadgeText = isPaid ? "PAID" : "PAYMENT ON DELIVERY";
    const paymentMethodText = order.paymentMethod === "ONLINE" ? "Online Payment (Razorpay)" : "Cash on Delivery (COD)";

    // Itemized table rows HTML
    const itemsHtml = order.items
      .map((item) => {
        const productName = item.variant?.product?.name || "Product Item";
        const variantSku = item.variant?.sku ? `SKU: ${item.variant.sku}` : "";
        const priceFormatted = `₹${item.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
        const totalFormatted = `₹${(item.price * item.quantity).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

        return `
          <tr>
            <td style="padding: 16px 12px; border-bottom: 1px solid #f1f5f9;">
              <div style="font-weight: 600; font-size: 14px; color: #0f172a;">${productName}</div>
              ${variantSku ? `<div style="font-size: 12px; color: #64748b; margin-top: 2px;">${variantSku}</div>` : ""}
            </td>
            <td style="padding: 16px 12px; border-bottom: 1px solid #f1f5f9; text-align: center; color: #334155; font-size: 14px; font-weight: 500;">${item.quantity}</td>
            <td style="padding: 16px 12px; border-bottom: 1px solid #f1f5f9; text-align: right; color: #64748b; font-size: 14px;">${priceFormatted}</td>
            <td style="padding: 16px 12px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 700; color: #0f172a; font-size: 14px;">${totalFormatted}</td>
          </tr>
        `;
      })
      .join("");

    const grandTotalFormatted = `₹${order.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tax Invoice ${invoiceNo} - Deco Moja</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px 12px; color: #1e293b;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #0f172a; padding: 32px 32px 24px 32px; text-align: left;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: 1px;">DECO MOJA</h1>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px;">Tax Invoice & Order Receipt</p>
                  </td>
                  <td style="text-align: right; vertical-align: top;">
                    <span style="display: inline-block; padding: 6px 14px; background-color: ${paymentBadgeColor}; color: #ffffff; font-size: 11px; font-weight: 700; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px;">
                      ${paymentBadgeText}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px;">
              
              <!-- Greeting & Summary Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td>
                    <h2 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 700; color: #0f172a;">Thank you for your order!</h2>
                    <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.6;">
                      We are processing your order with care. A copy of your official PDF tax invoice is attached to this email.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Invoice Meta Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; padding: 18px; margin-bottom: 28px;">
                <tr>
                  <td width="50%" style="vertical-align: top; padding-right: 12px;">
                    <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 4px;">Invoice Number</div>
                    <div style="font-size: 15px; font-weight: 700; color: #0f172a;">${invoiceNo}</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Order Date: ${orderDate}</div>
                  </td>
                  <td width="50%" style="vertical-align: top; padding-left: 12px; text-align: right;">
                    <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 4px;">Payment Method</div>
                    <div style="font-size: 14px; font-weight: 600; color: #0f172a;">${paymentMethodText}</div>
                    ${order.razorpayPaymentId ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">Txn ID: ${order.razorpayPaymentId}</div>` : ""}
                  </td>
                </tr>
              </table>

              <!-- Customer & Delivery Info -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; padding: 18px;">
                    <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 8px;">Delivery Details</div>
                    <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">${order.name || "Customer"}</div>
                    <div style="font-size: 14px; color: #334155; line-height: 1.5;">${order.street}</div>
                    <div style="font-size: 14px; color: #334155; line-height: 1.5;">${order.city}, ${order.state} - ${order.pincode}</div>
                    <div style="font-size: 13px; color: #64748b; margin-top: 6px;">📞 ${order.phoneNumber} ${order.email ? ` | ✉️ ${order.email}` : ""}</div>
                  </td>
                </tr>
              </table>

              <!-- Itemized Table Header -->
              <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; margin-bottom: 12px;">Order Summary</div>
              
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse; width: 100%; margin-bottom: 24px;">
                <thead>
                  <tr style="background-color: #f1f5f9;">
                    <th style="padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Item</th>
                    <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Qty</th>
                    <th style="padding: 10px 12px; text-align: right; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Unit Price</th>
                    <th style="padding: 10px 12px; text-align: right; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Totals Breakdown Table -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 16px;">
                <tr>
                  <td width="50%"></td>
                  <td width="50%">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #64748b;">Subtotal:</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #0f172a; font-weight: 600; text-align: right;">${grandTotalFormatted}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #64748b;">Shipping & Handling:</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #10b981; font-weight: 600; text-align: right;">FREE</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding-top: 8px; border-top: 2px solid #0f172a;"></td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 16px; font-weight: 800; color: #0f172a;">Grand Total:</td>
                        <td style="padding: 4px 0; font-size: 18px; font-weight: 800; color: #0f172a; text-align: right;">${grandTotalFormatted}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; line-height: 1.6;">
              <p style="margin: 0 0 4px 0; font-weight: 600; color: #64748b;">Deco Moja Kids Wear</p>
              <p style="margin: 0;">If you have any questions, please reply to this email or contact us at <a href="mailto:decomojakidswears@gmail.com" style="color: #0284c7; text-decoration: none;">decomojakidswears@gmail.com</a>.</p>
              <p style="margin: 8px 0 0 0; font-size: 11px;">&copy; ${new Date().getFullYear()} Deco Moja. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </body>
      </html>
    `;

    // Generate PDF Invoice Buffer
    let pdfAttachmentBuffer: Buffer | null = null;
    try {
      pdfAttachmentBuffer = await generateInvoicePdfBuffer(order);
    } catch (pdfErr) {
      console.error("[Invoice PDF Error] Failed to generate PDF buffer:", pdfErr);
    }

    const attachments = pdfAttachmentBuffer
      ? [
          {
            filename: `Tax_Invoice_${invoiceNo}.pdf`,
            content: pdfAttachmentBuffer,
            contentType: "application/pdf",
          },
        ]
      : [];

    // Send email via SMTP to customer
    if (emailTo) {
      const mailOptions = {
        from: smtpFrom,
        to: emailTo,
        subject: `Tax Invoice & Order Receipt ${invoiceNo} - Deco Moja`,
        html: emailHtml,
        attachments,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`[Email Sent] Invoice email sent for Order ${orderId} to customer ${emailTo}: ${info.messageId}`);
    }

    // Send alert email to company/admin
    if (adminEmail) {
      const adminMailOptions = {
        from: smtpFrom,
        to: adminEmail,
        subject: `[New Order Alert] Invoice ${invoiceNo} Placed (${grandTotalFormatted})`,
        html: emailHtml,
        attachments,
      };

      const adminInfo = await transporter.sendMail(adminMailOptions);
      console.log(`[Email Sent] Admin order notification sent for Order ${orderId} to ${adminEmail}: ${adminInfo.messageId}`);
    }
  } catch (error) {
    console.error(`[Email Error] Failed to send order confirmation email for Order ${orderId}:`, error);
  }
}


/**
 * Sends a password reset email to the user.
 * @param email Email address of the user
 * @param resetUrl The reset URL containing the token
 */
export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  try {
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Password - Deco Moja</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f7f7f7; margin: 0; padding: 20px; color: #333; }
          .container { max-width: 600px; background: #fff; margin: 0 auto; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
          .header { background: #000; color: #fff; text-align: center; padding: 40px 20px; }
          .header h1 { margin: 0; font-size: 26px; font-weight: 600; letter-spacing: 1px; }
          .content { padding: 30px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
          .footer { text-align: center; font-size: 12px; color: #999; padding: 30px 20px; background: #fafafa; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>DECO MOJA</h1>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>You requested to reset your password. Click the button below to set a new password. If you didn't request this, you can safely ignore this email.</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p style="margin-top: 20px; font-size: 14px; color: #666;">Or copy and paste this link in your browser:</p>
            <p style="font-size: 14px; word-break: break-all; color: #0066cc;">${resetUrl}</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Deco Moja. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: smtpFrom,
      to: email,
      subject: `Reset your Deco Moja password`,
      html: emailHtml,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Sent] Password reset email sent to ${email}: ${info.messageId}`);
  } catch (error) {
    console.error(`[Email Error] Failed to send password reset email to ${email}:`, error);
  }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { sendInvoiceEmail } from "@/lib/email";
import { RazorpayVerifySchema } from "@/lib/schemas";
import { logger } from "@/lib/logger";
import { sendEmail } from "@/lib/mailer";

async function sendOrderNotificationEmail(order: any) {
  try {
    const itemsHtml = order.items.map((item: any) => {
      if (item.ringConfiguration) {
        const config = item.ringConfiguration;
        return `
          <tr style="border-bottom: 1px solid #27272A;">
            <td style="padding: 12px 0; color: #E4E4E7; font-size: 14px;">
              <strong style="color: #D6B25E;">Custom Ring:</strong> ${config.setting?.name || "Bespoke Setting"}<br/>
              <span style="font-size: 12px; color: #A1A1AA;">
                Diamond: ${config.diamond?.caratWeight}ct ${config.diamond?.shape} (${config.diamond?.cut} Cut, ${config.diamond?.color} Color, ${config.diamond?.clarity} Clarity)<br/>
                Metal: ${config.metalType || "18K Gold"}<br/>
                Qty: ${item.quantity}
              </span>
            </td>
            <td style="padding: 12px 0; text-align: right; color: #D6B25E; font-size: 14px; font-weight: bold; vertical-align: top;">
              ₹${item.price.toLocaleString("en-IN")}
            </td>
          </tr>
        `;
      } else {
        return `
          <tr style="border-bottom: 1px solid #27272A;">
            <td style="padding: 12px 0; color: #E4E4E7; font-size: 14px;">
              <strong>${item.product?.name || "Jewelry Item"}</strong><br/>
              <span style="font-size: 12px; color: #A1A1AA;">
                Metal: ${item.product?.metalType || "N/A"}<br/>
                Qty: ${item.quantity}
              </span>
            </td>
            <td style="padding: 12px 0; text-align: right; color: #D6B25E; font-size: 14px; font-weight: bold; vertical-align: top;">
              ₹${item.price.toLocaleString("en-IN")}
            </td>
          </tr>
        `;
      }
    }).join("");

    const formatPrice = (val: number) => val ? val.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }) : "₹0";

    const emailHtml = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 45px 35px; background: #0B0B0C; border-radius: 16px; border: 1px solid #D6B25E22; color: #E4E4E7;">
        <div style="text-align: center; margin-bottom: 35px; border-bottom: 1px solid #D6B25E33; padding-bottom: 20px;">
          <h1 style="color: #D6B25E; font-size: 26px; letter-spacing: 5px; margin: 0; text-transform: uppercase;">ZYNORA LUXE</h1>
          <p style="color: #A1A1AA; font-size: 13px; margin: 8px 0 0; tracking: 1px;">New Order Notification (Razorpay PAID)</p>
        </div>
        
        <div style="background: #18181B; border: 1px solid #D6B25E22; border-radius: 12px; padding: 30px; margin-bottom: 25px;">
          <h2 style="color: #D6B25E; font-size: 18px; margin-top: 0; border-bottom: 1px solid #27272A; padding-bottom: 10px;">Order Overview</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr>
              <td style="color: #8E8E93; width: 140px; padding: 6px 0; font-size: 14px; font-weight: bold;">Order ID:</td>
              <td style="color: #D6B25E; padding: 6px 0; font-size: 14px; font-weight: bold; font-family: monospace;">${order.displayOrderId || order.id}</td>
            </tr>
            <tr>
              <td style="color: #8E8E93; padding: 6px 0; font-size: 14px; font-weight: bold;">Date Placed:</td>
              <td style="color: #F4F4F5; padding: 6px 0; font-size: 14px;">${new Date(order.createdAt).toLocaleString()}</td>
            </tr>
            <tr>
              <td style="color: #8E8E93; padding: 6px 0; font-size: 14px; font-weight: bold;">Order Type:</td>
              <td style="color: #F4F4F5; padding: 6px 0; font-size: 14px; text-transform: uppercase;">${order.orderType}</td>
            </tr>
          </table>
        </div>

        <div style="background: #18181B; border: 1px solid #D6B25E22; border-radius: 12px; padding: 30px; margin-bottom: 25px;">
          <h2 style="color: #D6B25E; font-size: 18px; margin-top: 0; border-bottom: 1px solid #27272A; padding-bottom: 10px;">Client Information</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr>
              <td style="color: #8E8E93; width: 140px; padding: 6px 0; font-size: 14px; font-weight: bold;">Name:</td>
              <td style="color: #F4F4F5; padding: 6px 0; font-size: 14px;">${order.customerName}</td>
            </tr>
            <tr>
              <td style="color: #8E8E93; padding: 6px 0; font-size: 14px; font-weight: bold;">Email:</td>
              <td style="color: #F4F4F5; padding: 6px 0; font-size: 14px;"><a href="mailto:${order.customerEmail}" style="color: #D6B25E; text-decoration: none;">${order.customerEmail}</a></td>
            </tr>
            <tr>
              <td style="color: #8E8E93; padding: 6px 0; font-size: 14px; font-weight: bold;">Phone:</td>
              <td style="color: #F4F4F5; padding: 6px 0; font-size: 14px;">${order.customerPhone || "Not Provided"}</td>
            </tr>
            <tr>
              <td style="color: #8E8E93; padding: 6px 0; font-size: 14px; font-weight: bold; vertical-align: top;">Shipping Address:</td>
              <td style="color: #F4F4F5; padding: 6px 0; font-size: 14px; line-height: 1.5;">${order.customerAddress}</td>
            </tr>
          </table>
        </div>

        <div style="background: #18181B; border: 1px solid #D6B25E22; border-radius: 12px; padding: 30px; margin-bottom: 25px;">
          <h2 style="color: #D6B25E; font-size: 18px; margin-top: 0; border-bottom: 1px solid #27272A; padding-bottom: 10px;">Items Ordered</h2>
          <table style="width: 100%; border-collapse: collapse;">
            ${itemsHtml}
          </table>

          <table style="width: 100%; border-collapse: collapse; margin-top: 20px; border-top: 1px solid #27272A; padding-top: 15px;">
            <tr>
              <td style="color: #8E8E93; padding: 8px 0; font-size: 14px;">Subtotal:</td>
              <td style="color: #F4F4F5; padding: 8px 0; font-size: 14px; text-align: right;">${formatPrice(order.subtotal)}</td>
            </tr>
            <tr>
              <td style="color: #8E8E93; padding: 8px 0; font-size: 14px;">GST (Taxes):</td>
              <td style="color: #F4F4F5; padding: 8px 0; font-size: 14px; text-align: right;">${formatPrice(order.gstAmount)}</td>
            </tr>
            <tr>
              <td style="color: #D6B25E; padding: 12px 0; font-size: 16px; font-weight: bold;">Grand Total:</td>
              <td style="color: #D6B25E; padding: 12px 0; font-size: 18px; font-weight: bold; text-align: right;">${formatPrice(order.totalAmount)}</td>
            </tr>
            <tr>
              <td style="color: #8E8E93; padding: 8px 0; font-size: 14px;">Payment Method:</td>
              <td style="color: #F4F4F5; padding: 8px 0; font-size: 14px; text-align: right; text-transform: uppercase;">${order.paymentMethod || "Razorpay"}</td>
            </tr>
            <tr>
              <td style="color: #8E8E93; padding: 8px 0; font-size: 14px;">Razorpay Txn ID:</td>
              <td style="color: #F4F4F5; padding: 8px 0; font-size: 14px; text-align: right; font-family: monospace;">${order.razorpayPaymentId || "N/A"}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin-top: 40px; border-top: 1px solid #27272A; padding-top: 20px;">
          <p style="color: #71717A; font-size: 11px; margin: 0;">This is an automated notification from Zynora Luxe store server.</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: "luxezynora@gmail.com",
      subject: `New Order Placed: ${order.displayOrderId || order.id} (₹${order.totalAmount.toLocaleString("en-IN")})`,
      html: emailHtml,
    });
    logger.info(`Notification email sent for order ${order.id}`);
  } catch (e) {
    logger.error("Failed to send order notification email:", e);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 1. Zod input validation
    const validationResult = RazorpayVerifySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = validationResult.data;

    // 2. Fetch and check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Target order not found in database." },
        { status: 404 }
      );
    }

    // 3. Payment Idempotency Guard (Double stock deduction prevention)
    if (existingOrder.paymentStatus === "SUCCESS" || existingOrder.status === "CONFIRMED") {
      logger.info(`Idempotent verify-payment request triggered for order ${orderId}. Already PAID.`);
      return NextResponse.json({ success: true, order: existingOrder });
    }

    // 4. Cryptographic signature verification
    const secret = process.env.RAZORPAY_KEY_SECRET || "";
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      // Mark paymentStatus to FAILED in database for tracking
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "FAILED",
        },
      });

      logger.security(`Payment signature mismatch. Order: ${orderId}, Razorpay Order: ${razorpay_order_id}`, request);
      return NextResponse.json(
        { success: false, error: "Invalid signature verification. Payment verification failed." },
        { status: 400 }
      );
    }

    // 5. Adjust stock levels securely (only after payment is fully verified)
    for (const item of existingOrder.items) {
      if (item.productId) {
        try {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stockCount: {
                decrement: item.quantity,
              },
            },
          });
          logger.info(`Decremented stock for product ${item.productId} by ${item.quantity}`);
        } catch (e) {
          logger.error(`Failed to decrement inventory for product ${item.productId}:`, e);
        }
      }
    }

    // Mark diamonds as SOLD for custom configurations
    for (const item of existingOrder.items) {
      if (item.ringConfigurationId) {
        try {
          const config = await prisma.ringConfiguration.findUnique({
            where: { id: item.ringConfigurationId },
          });
          if (config && config.diamondId) {
            await prisma.diamond.update({
              where: { id: config.diamondId },
              data: { stockStatus: "SOLD" },
            });
            logger.info(`Successfully marked diamond ID: ${config.diamondId} as SOLD`);
          }
        } catch (e) {
          logger.error("Failed to mark configuration diamond as sold:", e);
        }
      }
    }

    // 6. Update database Order to CONFIRMED
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "CONFIRMED",
        razorpayId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        paymentStatus: "SUCCESS",
        paymentMethod: "Razorpay",
        paidAt: new Date(),
      },
      include: {
        items: {
          include: {
            product: true,
            ringConfiguration: {
              include: { diamond: true, setting: true },
            },
          },
        },
        user: true,
      },
    });

    // 7. Dispatch Client Tax Invoice Email
    try {
      const itemsFormatted = updatedOrder.items.map((item: any) => ({
        id: item.productId || item.ringConfigurationId || "custom-ring",
        name: item.product?.name || item.ringConfiguration?.setting?.name || "Custom Ring",
        price: item.price,
        quantity: item.quantity,
        isCustomRing: !!item.ringConfigurationId,
        ringConfigurationId: item.ringConfigurationId,
      }));

      await sendInvoiceEmail({
        id: updatedOrder.id,
        createdAt: updatedOrder.createdAt,
        totalAmount: updatedOrder.totalAmount,
        subtotal: updatedOrder.subtotal,
        gstAmount: updatedOrder.gstAmount,
        gstType: updatedOrder.gstType,
        billingState: updatedOrder.billingState,
        gstNumber: updatedOrder.gstNumber,
        customer: {
          name: updatedOrder.customerName || updatedOrder.user?.name || "Customer",
          email: updatedOrder.customerEmail || updatedOrder.user?.email || "customer@example.com",
          phone: updatedOrder.customerPhone,
          address: updatedOrder.customerAddress,
        },
        items: itemsFormatted,
      });
    } catch (emailErr) {
      logger.error("Failed to dispatch client tax invoice email:", emailErr);
    }

    // Dispatch Admin Notification Email
    try {
      await sendOrderNotificationEmail(updatedOrder);
    } catch (adminEmailErr) {
      logger.error("Failed to dispatch admin notification email:", adminEmailErr);
    }

    logger.info(`Order payment successfully verified and processed: ${orderId}`);
    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    logger.error("Error in verify-payment route:", error);
    return NextResponse.json(
      { error: "Failed to process signature verification." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { logger } from "@/lib/logger";
import { sendInvoiceEmail } from "@/lib/email";
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
          <p style="color: #A1A1AA; font-size: 13px; margin: 8px 0 0; tracking: 1px;">New Order Notification (Webhook PAID)</p>
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
          </table>
        </div>

        <div style="text-align: center; margin-top: 40px; border-top: 1px solid #27272A; padding-top: 20px;">
          <p style="color: #71717A; font-size: 11px; margin: 0;">This is an automated notification from Zynora Luxe store server.</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: "luxezynora@gmail.com",
      subject: `New Webhook Order Confirmation: ${order.displayOrderId || order.id}`,
      html: emailHtml,
    });
  } catch (e) {
    logger.error("Failed to send webhook order notification email:", e);
  }
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      logger.security("Webhook triggered without x-razorpay-signature header", request);
      return NextResponse.json({ error: "Signature required." }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
      logger.error("RAZORPAY_WEBHOOK_SECRET environment variable is missing.");
      return NextResponse.json({ error: "Webhook is unconfigured." }, { status: 500 });
    }

    // 1. Verify cryptographic signature
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      logger.security("Webhook cryptographic signature verification failed.", request);
      return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
    }

    const eventData = JSON.parse(rawBody);
    const eventType = eventData.event;

    // We only care about payment.captured to mark order as confirmed
    if (eventType === "payment.captured") {
      const paymentPayload = eventData.payload.payment.entity;
      const razorpayOrderId = paymentPayload.order_id;
      const razorpayPaymentId = paymentPayload.id;

      if (!razorpayOrderId) {
        return NextResponse.json({ error: "Missing razorpay order_id in event payload." }, { status: 400 });
      }

      // Fetch target order in database
      const order = await prisma.order.findUnique({
        where: { razorpayOrderId },
        include: { items: true },
      });

      if (!order) {
        logger.warn(`Webhook: Order with Razorpay order ID ${razorpayOrderId} not found.`);
        return NextResponse.json({ success: true, message: "Order not found in store database (ignored)." });
      }

      // 2. Idempotency Check (Already processed)
      if (order.paymentStatus === "SUCCESS" || order.status === "CONFIRMED") {
        logger.info(`Webhook: Order ${order.id} was already processed successfully. Returning 200 OK.`);
        return NextResponse.json({ success: true, message: "Order already updated." });
      }

      // 3. Stock deduction
      for (const item of order.items) {
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
            logger.info(`Webhook: Decremented stock for product ${item.productId}`);
          } catch (e) {
            logger.error(`Webhook: Failed to decrement inventory for product ${item.productId}:`, e);
          }
        }
      }

      // Mark configuration diamonds as SOLD
      for (const item of order.items) {
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
              logger.info(`Webhook: Marked diamond ${config.diamondId} as SOLD`);
            }
          } catch (e) {
            logger.error("Webhook: Failed to mark diamond as sold:", e);
          }
        }
      }

      // 4. Update order status to paid
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "CONFIRMED",
          razorpayId: razorpayPaymentId,
          razorpayPaymentId: razorpayPaymentId,
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

      // 5. Send client invoice
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
        logger.error("Webhook: Failed to send client invoice email:", emailErr);
      }

      // Send admin notification
      await sendOrderNotificationEmail(updatedOrder);

      logger.info(`Webhook: Order ${order.id} marked as PAID & CONFIRMED via webhook.`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error("Error in Razorpay webhook handler:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

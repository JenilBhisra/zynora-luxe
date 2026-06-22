import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PlaceOrderSchema } from "@/lib/schemas";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile";
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
          <p style="color: #A1A1AA; font-size: 13px; margin: 8px 0 0; tracking: 1px;">New Order Notification</p>
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
              <td style="color: #F4F4F5; padding: 8px 0; font-size: 14px; text-align: right; text-transform: uppercase;">${order.paymentMethod || "Mock Payment"}</td>
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
  } catch (e) {
    logger.error("Failed to send order notification email:", e);
  }
}

function generateDisplayOrderId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `ZYNORA-ORD-${code}`;
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ||
               req.headers.get("x-real-ip") ||
               "127.0.0.1";

    // 1. IP-Based Rate Limiting Check (Max 15 checkout submissions per hour per IP)
    if (!(await checkRateLimit(`place-order:${ip}`, 15, 60 * 60 * 1000))) {
      logger.security("Rate limit violation: checkout order spamming", req);
      return NextResponse.json(
        { error: "Too many checkout requests. Please try again after some time." },
        { status: 429 }
      );
    }

    const body = await req.json();

    // 2. Validate request input using strict Zod schema
    const validationResult = PlaceOrderSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;
    const { orderType, customer, items, ringConfigurationId, paymentMethod, gstNumber, gstType } = validatedData;
    const { turnstileToken } = body;

    // 3. Cloudflare Turnstile verification
    const isChallengeValid = await verifyTurnstileToken(turnstileToken, ip);
    if (!isChallengeValid) {
      logger.security("Turnstile verification failed for checkout attempt", req);
      return NextResponse.json(
        { error: "Bot verification failed. Please try again." },
        { status: 400 }
      );
    }

    // Find or create customer account by email
    let user = await prisma.user.findFirst({
      where: { email: customer.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: customer.email,
          name: customer.name || "Guest User",
        },
      });
    }

    const displayOrderId = generateDisplayOrderId();

    // Build address format
    const addressParts = [customer.address, customer.city, customer.state, customer.pincode].filter(Boolean);
    const fullAddress = addressParts.join(", ");

    // ── 4. SECURE SERVER-SIDE PRICE AND TOTAL CALCULATION ──
    let computedSubtotal = 0;
    const orderItemsData = [];

    if (orderType === "CUSTOM_RING") {
      let finalPrice = 0;
      let validConfigId = null;

      if (!ringConfigurationId) {
        return NextResponse.json({ error: "Custom ring configuration ID is required." }, { status: 400 });
      }

      // Query checked RingConfiguration from database (ignoring client-passed price)
      const config = await prisma.ringConfiguration.findUnique({
        where: { id: ringConfigurationId },
        include: { setting: true, diamond: true }
      });

      if (!config) {
        return NextResponse.json({ error: "Specified ring configuration was not found." }, { status: 400 });
      }

      validConfigId = ringConfigurationId;
      finalPrice = config.totalPrice;
      computedSubtotal = finalPrice;

      orderItemsData.push({
        ringConfigurationId: validConfigId,
        quantity: 1,
        price: finalPrice,
        settingSku: config.setting?.sku || null,
        diamondSku: config.diamond?.sku || null
      });
    } else {
      // CART items order
      if (!items || items.length === 0) {
        return NextResponse.json({ error: "Your shopping cart is empty." }, { status: 400 });
      }

      for (const item of items) {
        let productId = null;
        let ringConfigurationId = null;
        let itemPrice = 0;
        let snapshotSku: string | null = null;
        let snapshotSettingSku: string | null = null;
        let snapshotDiamondSku: string | null = null;

        if (item.isCustomRing) {
          if (!item.ringConfigurationId) {
            return NextResponse.json({ error: "Missing ring configuration reference in cart item." }, { status: 400 });
          }

          // Query custom ring price from verified DB record
          const config = await prisma.ringConfiguration.findUnique({
            where: { id: item.ringConfigurationId },
            include: { setting: true, diamond: true }
          });

          if (!config) {
            return NextResponse.json({ error: "Ring configuration not found." }, { status: 400 });
          }

          ringConfigurationId = item.ringConfigurationId;
          itemPrice = config.totalPrice;
          snapshotSettingSku = config.setting?.sku || null;
          snapshotDiamondSku = config.diamond?.sku || null;
        } else {
          if (!item.id) {
            return NextResponse.json({ error: "Missing product reference in cart item." }, { status: 400 });
          }

          // Query standard product price from DB record
          const product = await prisma.product.findUnique({
            where: { id: item.id },
          });

          if (!product) {
            return NextResponse.json({ error: `Product item not found.` }, { status: 400 });
          }

          productId = item.id;
          itemPrice = product.price;
          snapshotSku = product.sku || null;
        }

        const quantity = item.quantity || 1;
        computedSubtotal += itemPrice * quantity;

        orderItemsData.push({
          productId,
          ringConfigurationId,
          quantity,
          price: itemPrice,
          sku: snapshotSku,
          settingSku: snapshotSettingSku,
          diamondSku: snapshotDiamondSku
        });
      }
    }

    // 3% standard GST on precious jewelry
    const computedGstAmount = Math.round(computedSubtotal * 0.03);
    const computedTotalAmount = computedSubtotal + computedGstAmount;

    // Create order entry with state 'PENDING'
    const order = await prisma.order.create({
      data: {
        displayOrderId,
        orderType,
        userId: user.id,
        subtotal: computedSubtotal,
        gstAmount: computedGstAmount,
        gstType: gstType || "CGST_SGST",
        shippingCost: 0,
        totalAmount: computedTotalAmount,
        billingState: customer.state,
        shippingState: customer.state,
        gstNumber: gstNumber || null,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        customerAddress: fullAddress,
        razorpayId: paymentMethod === "Razorpay" ? null : `cart_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        status: paymentMethod === "Razorpay" ? "PENDING" : "CONFIRMED",
        paymentStatus: paymentMethod === "Razorpay" ? "PENDING" : "SUCCESS",
        paymentMethod: paymentMethod || "Mock Payment",
        items: { create: orderItemsData },
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

    // Mark diamonds as sold and decrement stock ONLY for mock payment (Razorpay payments handled after verification)
    if (paymentMethod !== "Razorpay") {
      if (orderType === "CUSTOM_RING" && ringConfigurationId) {
        const config = await prisma.ringConfiguration.findUnique({
          where: { id: ringConfigurationId },
        });
        if (config && config.diamondId) {
          try {
            await prisma.diamond.update({
              where: { id: config.diamondId },
              data: { stockStatus: "SOLD" },
            });
          } catch (e) {
            logger.error("Failed to mark mock configuration diamond as sold:", e);
          }
        }
      } else {
        for (const item of orderItemsData) {
          if (item.productId) {
            try {
              await prisma.product.update({
                where: { id: item.productId },
                data: { stockCount: { decrement: item.quantity } },
              });
            } catch (e) {
              logger.error(`Failed to decrement stock count for product ${item.productId}:`, e);
            }
          }
        }
      }

      // Send email notifications
      sendOrderNotificationEmail(order).catch((err) => {
        logger.error("Failed to send order email:", err);
      });
    }

    logger.info(`Checkout order created successfully: ${order.id}`);
    return NextResponse.json({
      success: true,
      orderId: order.id,
      displayOrderId: order.displayOrderId,
      order,
    });
  } catch (error) {
    logger.error("Place Order Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to place order. Internal server error." },
      { status: 500 }
    );
  }
}

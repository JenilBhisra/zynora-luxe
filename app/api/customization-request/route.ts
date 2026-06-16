import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { CustomizationRequestSchema } from "@/lib/schemas";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { sendEmail } from "@/lib/mailer";
import { logger } from "@/lib/logger";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ||
               request.headers.get("x-real-ip") ||
               "127.0.0.1";

    // 1. IP-Based Rate Limiting Check (Max 5 requests per hour)
    if (!(await checkRateLimit(`customization-request:${ip}`, 5, 60 * 60 * 1000))) {
      logger.security("Rate limit violation: customization request spamming", request);
      return NextResponse.json(
        { error: "Too many customization requests. Please try again after some time." },
        { status: 429 }
      );
    }

    const body = await request.json();

    // 2. Validate input schema using Zod
    const validationResult = CustomizationRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;
    const {
      productId,
      productName,
      productSku,
      productPrice,
      productUrl,
      customerName,
      customerEmail,
      customerPhone,
      jewelrySize,
      metalType,
      stoneType,
      stoneSize,
      engraving,
      requirements,
    } = validatedData;
    const { turnstileToken } = body;

    // 3. Bot Protection: Validate Cloudflare Turnstile token
    const isBotChallengeValid = await verifyTurnstileToken(turnstileToken, ip);
    if (!isBotChallengeValid) {
      logger.security(`Turnstile verification failed for customization attempt by email: ${customerEmail}`, request);
      return NextResponse.json(
        { error: "Bot verification failed. Please try again." },
        { status: 400 }
      );
    }

    // 4. Sanitize inputs to prevent Stored XSS inside database / admin interface
    const safeProductName = escapeHtml(productName);
    const safeCustomerName = escapeHtml(customerName);
    const safeCustomerPhone = escapeHtml(customerPhone);
    const safeJewelrySize = jewelrySize ? escapeHtml(jewelrySize) : null;
    const safeMetalType = metalType ? escapeHtml(metalType) : null;
    const safeStoneType = stoneType ? escapeHtml(stoneType) : null;
    const safeStoneSize = stoneSize ? escapeHtml(stoneSize) : null;
    const safeEngraving = engraving ? escapeHtml(engraving) : null;
    const safeRequirements = escapeHtml(requirements);

    // Save to Database via singleton client
    const customizationRequest = await prisma.customizationRequest.create({
      data: {
        productId: productId || null,
        productName: safeProductName,
        productSku: productSku || null,
        productPrice: productPrice ? String(productPrice) : null,
        productUrl: productUrl || null,
        customerName: safeCustomerName,
        customerEmail,
        customerPhone: safeCustomerPhone,
        jewelrySize: safeJewelrySize,
        metalType: safeMetalType,
        stoneType: safeStoneType,
        stoneSize: safeStoneSize,
        engraving: safeEngraving,
        requirements: safeRequirements,
        status: "NEW",
      },
    });

    // 5. Send styled email to admin using unified mailer
    const emailHtml = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 45px 35px; background: #0B0B0C; border-radius: 16px; border: 1px solid #D6B25E22; color: #E4E4E7;">
        <div style="text-align: center; margin-bottom: 35px; border-bottom: 1px solid #D6B25E33; padding-bottom: 20px;">
          <h1 style="color: #D6B25E; font-size: 26px; letter-spacing: 5px; margin: 0; text-transform: uppercase;">ZYNORA LUXE</h1>
          <p style="color: #A1A1AA; font-size: 13px; margin: 8px 0 0; letter-spacing: 1px;">Bespoke Jewelry Request</p>
        </div>
        
        <div style="background: #18181B; border: 1px solid #D6B25E22; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
          <h2 style="color: #D6B25E; font-size: 18px; margin-top: 0; border-bottom: 1px solid #27272A; padding-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">Customer Details</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr>
              <td style="color: #8E8E93; width: 140px; padding: 6px 0; font-size: 14px; font-weight: bold;">Client Name:</td>
              <td style="color: #F4F4F5; padding: 6px 0; font-size: 14px;">${safeCustomerName}</td>
            </tr>
            <tr>
              <td style="color: #8E8E93; padding: 6px 0; font-size: 14px; font-weight: bold;">Email Address:</td>
              <td style="color: #F4F4F5; padding: 6px 0; font-size: 14px;"><a href="mailto:${customerEmail}" style="color: #D6B25E; text-decoration: none;">${customerEmail}</a></td>
            </tr>
            <tr>
              <td style="color: #8E8E93; padding: 6px 0; font-size: 14px; font-weight: bold;">Phone Number:</td>
              <td style="color: #F4F4F5; padding: 6px 0; font-size: 14px;">${safeCustomerPhone}</td>
            </tr>
          </table>
        </div>

        <div style="background: #18181B; border: 1px solid #D6B25E22; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
          <h2 style="color: #D6B25E; font-size: 18px; margin-top: 0; border-bottom: 1px solid #27272A; padding-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">Product Details</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr>
              <td style="color: #8E8E93; width: 140px; padding: 6px 0; font-size: 14px; font-weight: bold;">Design Name:</td>
              <td style="color: #D6B25E; padding: 6px 0; font-size: 14px; font-weight: bold;">${safeProductName}</td>
            </tr>
            ${productSku ? `
            <tr>
              <td style="color: #8E8E93; padding: 6px 0; font-size: 14px; font-weight: bold;">SKU:</td>
              <td style="color: #F4F4F5; padding: 6px 0; font-size: 14px;">${productSku}</td>
            </tr>` : ""}
            ${productPrice ? `
            <tr>
              <td style="color: #8E8E93; padding: 6px 0; font-size: 14px; font-weight: bold;">Original Price:</td>
              <td style="color: #F4F4F5; padding: 6px 0; font-size: 14px;">${productPrice}</td>
            </tr>` : ""}
            ${productUrl ? `
            <tr>
              <td style="color: #8E8E93; padding: 6px 0; font-size: 14px; font-weight: bold;">Product Link:</td>
              <td style="color: #F4F4F5; padding: 6px 0; font-size: 14px;"><a href="${productUrl}" style="color: #D6B25E; text-decoration: underline;">View on Store</a></td>
            </tr>` : ""}
          </table>
        </div>

        <div style="background: #18181B; border: 1px solid #D6B25E22; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
          <h2 style="color: #D6B25E; font-size: 18px; margin-top: 0; border-bottom: 1px solid #27272A; padding-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">Customization Choices</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            ${safeJewelrySize ? `
            <tr>
              <td style="color: #8E8E93; width: 140px; padding: 6px 0; font-size: 14px; font-weight: bold;">Jewelry Size:</td>
              <td style="color: #F4F4F5; padding: 6px 0; font-size: 14px;">${safeJewelrySize}</td>
            </tr>` : ""}
            ${safeMetalType ? `
            <tr>
              <td style="color: #8E8E93; padding: 6px 0; font-size: 14px; font-weight: bold;">Metal Type:</td>
              <td style="color: #F4F4F5; padding: 6px 0; font-size: 14px;">${safeMetalType}</td>
            </tr>` : ""}
            ${safeStoneType ? `
            <tr>
              <td style="color: #8E8E93; padding: 6px 0; font-size: 14px; font-weight: bold;">Stone Type:</td>
              <td style="color: #F4F4F5; padding: 6px 0; font-size: 14px;">${safeStoneType}</td>
            </tr>` : ""}
            ${safeStoneSize ? `
            <tr>
              <td style="color: #8E8E93; padding: 6px 0; font-size: 14px; font-weight: bold;">Stone Size:</td>
              <td style="color: #F4F4F5; padding: 6px 0; font-size: 14px;">${safeStoneSize}</td>
            </tr>` : ""}
            ${safeEngraving ? `
            <tr>
              <td style="color: #8E8E93; padding: 6px 0; font-size: 14px; font-weight: bold;">Engraving Text:</td>
              <td style="color: #F4F4F5; padding: 6px 0; font-size: 14px; font-style: italic; color: #D6B25E;">"${safeEngraving}"</td>
            </tr>` : ""}
          </table>
        </div>

        <div style="background: #18181B; border: 1px solid #D6B25E22; border-radius: 12px; padding: 25px;">
          <h2 style="color: #D6B25E; font-size: 18px; margin-top: 0; border-bottom: 1px solid #27272A; padding-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">Special Instructions</h2>
          <p style="color: #F4F4F5; font-size: 14px; line-height: 1.6; white-space: pre-wrap; margin-top: 15px;">${safeRequirements}</p>
        </div>

        <div style="text-align: center; margin-top: 40px; border-top: 1px solid #27272A; padding-top: 20px;">
          <p style="color: #71717A; font-size: 11px; margin: 0;">This is an automated bespoke order sheet request from Zynora Luxe. Please review and contact the client within 24 hours.</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: "luxezynora@gmail.com",
      subject: `✨ Zynora Luxe: Bespoke Request for ${safeProductName} by ${safeCustomerName}`,
      html: emailHtml,
    });

    logger.info(`Customization request created successfully for ${customerEmail}`);
    return NextResponse.json({ success: true, request: customizationRequest });
  } catch (error: any) {
    logger.error("Failed to handle customization request:", error);
    return NextResponse.json({ error: "Failed to submit customization request. Please try again later." }, { status: 500 });
  }
}

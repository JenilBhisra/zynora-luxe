import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { SendOtpSchema } from "@/lib/schemas";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { sendEmail } from "@/lib/mailer";
import { logger } from "@/lib/logger";

function generateOtp(): string {
  const crypto = require("crypto");
  return crypto.randomInt(100000, 999999).toString();
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ||
               request.headers.get("x-real-ip") ||
               "127.0.0.1";

    // 1. IP-Based Rate Limiting Check (Max 5 requests per hour)
    if (!(await checkRateLimit(`send-otp:${ip}`, 5, 60 * 60 * 1000))) {
      logger.security("Rate limit violation: OTP send spamming", request);
      return NextResponse.json(
        { error: "Too many requests. Please try again after some time." },
        { status: 429 }
      );
    }

    const body = await request.json();
    
    // 2. Validate input schema using Zod
    const validationResult = SendOtpSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;
    const { turnstileToken } = body;

    // 3. Bot Protection: Validate Cloudflare Turnstile token ONLY if provided
    // The signup page uses rate limiting as primary protection (5/hr per IP)
    if (turnstileToken) {
      const isBotChallengeValid = await verifyTurnstileToken(turnstileToken, ip);
      if (!isBotChallengeValid) {
        logger.security(`Turnstile verification failed for email: ${email}`, request);
        return NextResponse.json(
          { error: "Bot verification failed. Please check your network and try again." },
          { status: 400 }
        );
      }
    }

    // Delete any existing OTPs for this email to prevent coupon/OTP reuse
    await prisma.otpVerification.deleteMany({
      where: { email },
    });

    // Generate a secure 6-digit OTP
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store in database
    await prisma.otpVerification.create({
      data: {
        email,
        otp,
        expiresAt,
      },
    });

    // 4. Send email notification using unified mailer
    const mailSent = await sendEmail({
      to: email,
      subject: "Your ZYNORA LUXE Verification Code",
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 30px; background: #0B0B0C; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #D6B25E; font-size: 24px; letter-spacing: 4px; margin: 0;">ZYNORA LUXE</h1>
          </div>
          <div style="background: #18181B; border: 1px solid #D6B25E33; border-radius: 12px; padding: 30px; text-align: center;">
            <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 20px;">Your verification code is:</p>
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #D6B25E; margin: 20px 0; padding: 15px; background: #0B0B0C; border-radius: 8px; border: 1px dashed #D6B25E55;">
              ${otp}
            </div>
            <p style="color: #71717A; font-size: 12px; margin: 20px 0 0;">This code expires in 10 minutes.<br/>Do not share this code with anyone.</p>
          </div>
          <p style="color: #52525B; font-size: 11px; text-align: center; margin-top: 20px;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    if (!mailSent) {
      throw new Error("SMTP server failed to dispatch email.");
    }

    logger.info(`Verification OTP successfully sent to: ${email}`);
    return NextResponse.json({ status: "success", message: "OTP sent" }, { status: 200 });
  } catch (error: any) {
    logger.error("Error sending OTP:", error);
    return NextResponse.json(
      { error: "Failed to send OTP. Please try again later." },
      { status: 500 }
    );
  }
}

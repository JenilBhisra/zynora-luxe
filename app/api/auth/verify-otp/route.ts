import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { VerifyOtpSchema } from "@/lib/schemas";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ||
               request.headers.get("x-real-ip") ||
               "127.0.0.1";

    // 1. Rate Limiting Check on Verification Attempt (Max 10 per minute per IP)
    if (!(await checkRateLimit(`verify-otp:${ip}`, 10, 60 * 1000))) {
      logger.security("Rate limit violation: OTP verification spamming", request);
      return NextResponse.json(
        { error: "Too many requests. Please try again after some time." },
        { status: 429 }
      );
    }

    const body = await request.json();

    // 2. Validate input schema using Zod
    const validationResult = VerifyOtpSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, otp } = validationResult.data;

    // Find the OTP record
    const record = await prisma.otpVerification.findFirst({
      where: {
        email,
        otp,
        verified: false,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      logger.security(`Failed OTP verification attempt for email: ${email}`, request);
      return NextResponse.json({ error: "Invalid OTP. Please try again." }, { status: 400 });
    }

    // Check expiry
    if (new Date() > record.expiresAt) {
      await prisma.otpVerification.delete({ where: { id: record.id } });
      logger.info(`Expired OTP submitted and deleted for email: ${email}`);
      return NextResponse.json({ error: "OTP has expired. Please request a new one." }, { status: 400 });
    }

    // Mark as verified
    await prisma.otpVerification.update({
      where: { id: record.id },
      data: { verified: true },
    });

    // Clean up all OTPs for this email to prevent replay/multiple signup attempts
    await prisma.otpVerification.deleteMany({ where: { email } });

    logger.info(`OTP successfully verified for: ${email}`);
    return NextResponse.json({ status: "success", message: "OTP verified" }, { status: 200 });
  } catch (error: any) {
    logger.error("Error verifying OTP:", error);
    return NextResponse.json(
      { error: "Failed to verify OTP. Please try again later." },
      { status: 500 }
    );
  }
}

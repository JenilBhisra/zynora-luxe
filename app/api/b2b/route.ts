import { NextResponse } from "next/server";
import { B2BInquirySchema } from "@/lib/schemas";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyGSTINOnline } from "@/lib/gst-verification";
import { sendEmail } from "@/lib/mailer";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ||
               request.headers.get("x-real-ip") ||
               "127.0.0.1";

    // 1. IP-Based Distributed Rate Limiting Check (Max 5 requests per hour)
    if (!(await checkRateLimit(`b2b:${ip}`, 5, 60 * 60 * 1000))) {
      logger.security("Rate limit violation: B2B inquiry spamming", request);
      return NextResponse.json(
        { error: "Too many requests. Please try again after some time." },
        { status: 429 }
      );
    }

    const body = await request.json();

    // 2. Validate corporate input using strict Zod schema
    const validationResult = B2BInquirySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;
    const { name, companyName, registrationNumber, email, phone, volume, details } = validatedData;

    // 3. GST Verification (Offline checksum validation followed by online verification)
    const gstResult = await verifyGSTINOnline(registrationNumber);
    if (!gstResult.success) {
      logger.security(`GST Verification failed for: ${registrationNumber} (${companyName})`, request);
      return NextResponse.json(
        { error: gstResult.error || "GST verification failed. Please check your GST number and try again." },
        { status: 400 }
      );
    }

    if (gstResult.status?.toLowerCase() !== "active") {
      logger.security(`Inactive GST Status submitted: ${registrationNumber} (${gstResult.status})`, request);
      return NextResponse.json(
        { error: `GST verification failed. Taxpayer status is: ${gstResult.status || "Inactive"}` },
        { status: 400 }
      );
    }

    // 4. Send styled corporate inquiry to support email using unified mailer
    const emailHtml = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 45px 35px; background: #0B0B0C; border-radius: 16px; border: 1px solid #D6B25E33; color: #E4E4E7;">
        <div style="text-align: center; margin-bottom: 35px; border-bottom: 2px solid #D6B25E; padding-bottom: 20px;">
          <h1 style="color: #D6B25E; font-size: 28px; letter-spacing: 5px; margin: 0; text-transform: uppercase;">ZYNORA LUXE</h1>
          <p style="color: #A1A1AA; font-size: 13px; margin: 8px 0 0; tracking: 1.5px; text-transform: uppercase;">B2B & Wholesale Division</p>
        </div>
        
        <div style="background: #18181B; border: 1px solid #D6B25E22; border-radius: 12px; padding: 30px; margin-bottom: 25px;">
          <h2 style="color: #D6B25E; font-size: 18px; margin-top: 0; border-bottom: 1px solid #27272A; padding-bottom: 10px;">Corporate Information</h2>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr>
              <td style="color: #8E8E93; width: 180px; padding: 8px 0; font-size: 14px; font-weight: bold;">Company Name:</td>
              <td style="color: #F4F4F5; padding: 8px 0; font-size: 14px; font-weight: bold;">${companyName}</td>
            </tr>
            <tr>
              <td style="color: #8E8E93; padding: 8px 0; font-size: 14px; font-weight: bold;">Contact Person:</td>
              <td style="color: #F4F4F5; padding: 8px 0; font-size: 14px;">${name}</td>
            </tr>
            <tr>
              <td style="color: #8E8E93; padding: 8px 0; font-size: 14px; font-weight: bold;">Corporate Email:</td>
              <td style="color: #F4F4F5; padding: 8px 0; font-size: 14px;"><a href="mailto:${email}" style="color: #D6B25E; text-decoration: none;">${email}</a></td>
            </tr>
            <tr>
              <td style="color: #8E8E93; padding: 8px 0; font-size: 14px; font-weight: bold;">Phone Number:</td>
              <td style="color: #F4F4F5; padding: 8px 0; font-size: 14px;">${phone}</td>
            </tr>
            <tr>
              <td style="color: #8E8E93; padding: 8px 0; font-size: 14px; font-weight: bold;">Target Volume:</td>
              <td style="color: #F4F4F5; padding: 8px 0; font-size: 14px; color: #D6B25E; font-weight: bold;">${volume}</td>
            </tr>
          </table>
        </div>

        <div style="background: #18181B; border: 1px solid #D6B25E22; border-radius: 12px; padding: 30px; margin-bottom: 25px;">
          <h2 style="color: #D6B25E; font-size: 18px; margin-top: 0; border-bottom: 1px solid #27272A; padding-bottom: 10px;">Verified GST Details</h2>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr>
              <td style="color: #8E8E93; width: 180px; padding: 8px 0; font-size: 14px; font-weight: bold;">GSTIN:</td>
              <td style="color: #D6B25E; padding: 8px 0; font-size: 14px; font-weight: bold; font-family: monospace;">${registrationNumber.toUpperCase()}</td>
            </tr>
            <tr>
              <td style="color: #8E8E93; padding: 8px 0; font-size: 14px; font-weight: bold;">Legal Name:</td>
              <td style="color: #F4F4F5; padding: 8px 0; font-size: 14px;">${gstResult.legalName || "N/A"}</td>
            </tr>
            <tr>
              <td style="color: #8E8E93; padding: 8px 0; font-size: 14px; font-weight: bold;">Trade Name:</td>
              <td style="color: #F4F4F5; padding: 8px 0; font-size: 14px;">${gstResult.tradeName || "N/A"}</td>
            </tr>
            <tr>
              <td style="color: #8E8E93; padding: 8px 0; font-size: 14px; font-weight: bold;">GST Status:</td>
              <td style="color: #34D399; padding: 8px 0; font-size: 14px; font-weight: bold;">${gstResult.status || "Active"}</td>
            </tr>
            <tr>
              <td style="color: #8E8E93; padding: 8px 0; font-size: 14px; font-weight: bold;">State:</td>
              <td style="color: #F4F4F5; padding: 8px 0; font-size: 14px;">${gstResult.state || "N/A"}</td>
            </tr>
            <tr>
              <td style="color: #8E8E93; padding: 8px 0; font-size: 14px; font-weight: bold;">Registration Date:</td>
              <td style="color: #F4F4F5; padding: 8px 0; font-size: 14px;">${gstResult.regDate || "N/A"}</td>
            </tr>
            <tr>
              <td style="color: #8E8E93; padding: 8px 0; font-size: 14px; font-weight: bold;">Verification Mode:</td>
              <td style="color: #A1A1AA; padding: 8px 0; font-size: 12px; font-style: italic;">${gstResult.verificationMode}</td>
            </tr>
          </table>
        </div>

        <div style="background: #18181B; border: 1px solid #D6B25E22; border-radius: 12px; padding: 30px;">
          <h2 style="color: #D6B25E; font-size: 18px; margin-top: 0; border-bottom: 1px solid #27272A; padding-bottom: 10px;">Wholesale Specifications & Inquiry</h2>
          <p style="color: #F4F4F5; font-size: 14px; line-height: 1.6; white-space: pre-wrap; margin-top: 15px;">${details}</p>
        </div>

        <div style="text-align: center; margin-top: 40px; border-top: 1px solid #27272A; padding-top: 20px;">
          <p style="color: #71717A; font-size: 11px; margin: 0;">This wholesale query was verified and generated from the Zynora Luxe B2B integration portal.</p>
        </div>
      </div>
    `;

    const mailSent = await sendEmail({
      to: "luxezynora@gmail.com",
      subject: `💼 B2B Wholesale Inquiry: ${companyName} (${name})`,
      html: emailHtml,
    });

    if (!mailSent) {
      throw new Error("SMTP server failed to send B2B email.");
    }

    logger.info(`B2B wholesale inquiry submitted successfully for ${companyName}`);
    return NextResponse.json({ status: "success", message: "B2B inquiry submitted successfully." }, { status: 200 });
  } catch (error: any) {
    logger.error("Error submitting B2B inquiry:", error);
    return NextResponse.json(
      { error: "Failed to submit B2B wholesale inquiry. Please try again later." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { ContactFormSchema } from "@/lib/schemas";
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
    if (!(await checkRateLimit(`contact:${ip}`, 5, 60 * 60 * 1000))) {
      logger.security("Rate limit violation: contact form spamming", request);
      return NextResponse.json(
        { error: "Too many contact requests. Please try again after some time." },
        { status: 429 }
      );
    }

    const body = await request.json();

    // 2. Validate input schema using Zod
    const validationResult = ContactFormSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;
    const { name, email, phone, subject, message } = validatedData;
    const { turnstileToken } = body;

    // 3. Bot Protection: Validate Cloudflare Turnstile token
    const isBotChallengeValid = await verifyTurnstileToken(turnstileToken, ip);
    if (!isBotChallengeValid) {
      logger.security(`Turnstile verification failed for contact attempt by email: ${email}`, request);
      return NextResponse.json(
        { error: "Bot verification failed. Please check your network and try again." },
        { status: 400 }
      );
    }

    // 4. Sanitize inputs to prevent Reflected/Stored XSS inside the admin webmail client
    const safeName = escapeHtml(name);
    const safeSubject = escapeHtml(subject);
    const safePhone = phone ? escapeHtml(phone) : "Not Provided";
    const safeMessage = escapeHtml(message);

    // 5. Send notification email to admin using unified mailer
    const mailSent = await sendEmail({
      to: "luxezynora@gmail.com",
      subject: `New Customization Request: ${safeSubject} from ${safeName}`,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 45px 35px; background: #0B0B0C; border-radius: 16px; border: 1px solid #D6B25E22; color: #E4E4E7;">
          <div style="text-align: center; margin-bottom: 35px; border-bottom: 1px solid #D6B25E33; padding-bottom: 20px;">
            <h1 style="color: #D6B25E; font-size: 26px; letter-spacing: 5px; margin: 0; text-transform: uppercase;">ZYNORA LUXE</h1>
            <p style="color: #A1A1AA; font-size: 13px; margin: 8px 0 0; tracking: 1px;">Customer Care & Bespoke Requests</p>
          </div>
          
          <div style="background: #18181B; border: 1px solid #D6B25E22; border-radius: 12px; padding: 30px; margin-bottom: 25px;">
            <h2 style="color: #D6B25E; font-size: 18px; margin-top: 0; border-bottom: 1px solid #27272A; padding-bottom: 10px;">Inquiry Details</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
              <tr>
                <td style="color: #8E8E93; width: 140px; padding: 8px 0; font-size: 14px; font-weight: bold;">Client Name:</td>
                <td style="color: #F4F4F5; padding: 8px 0; font-size: 14px;">${safeName}</td>
              </tr>
              <tr>
                <td style="color: #8E8E93; padding: 8px 0; font-size: 14px; font-weight: bold;">Email Address:</td>
                <td style="color: #F4F4F5; padding: 8px 0; font-size: 14px;"><a href="mailto:${email}" style="color: #D6B25E; text-decoration: none;">${email}</a></td>
              </tr>
              <tr>
                <td style="color: #8E8E93; padding: 8px 0; font-size: 14px; font-weight: bold;">Phone Number:</td>
                <td style="color: #F4F4F5; padding: 8px 0; font-size: 14px;">${safePhone}</td>
              </tr>
              <tr>
                <td style="color: #8E8E93; padding: 8px 0; font-size: 14px; font-weight: bold;">Topic / Request:</td>
                <td style="color: #F4F4F5; padding: 8px 0; font-size: 14px; font-weight: bold; color: #D6B25E;">${safeSubject}</td>
              </tr>
            </table>
          </div>

          <div style="background: #18181B; border: 1px solid #D6B25E22; border-radius: 12px; padding: 30px;">
            <h2 style="color: #D6B25E; font-size: 18px; margin-top: 0; border-bottom: 1px solid #27272A; padding-bottom: 10px;">Message Description</h2>
            <p style="color: #F4F4F5; font-size: 14px; line-height: 1.6; white-space: pre-wrap; margin-top: 15px;">${safeMessage}</p>
          </div>

          <div style="text-align: center; margin-top: 40px; border-top: 1px solid #27272A; padding-top: 20px;">
            <p style="color: #71717A; font-size: 11px; margin: 0;">This email is an automated message sent from the Zynora Luxe storefront custom request system.</p>
          </div>
        </div>
      `,
    });

    if (!mailSent) {
      throw new Error("SMTP server failed to send contact message.");
    }

    logger.info(`Contact inquiry sent successfully by ${email}`);
    return NextResponse.json({ status: "success", message: "Inquiry sent successfully." }, { status: 200 });
  } catch (error: any) {
    logger.error("Error sending contact email:", error);
    return NextResponse.json(
      { error: "Failed to send inquiry. Please try again later." },
      { status: 500 }
    );
  }
}

import nodemailer from "nodemailer";

/**
 * Creates and returns a unified Nodemailer transporter based on active environment variables.
 * Prioritizes SMTP_HOST if available, then Gmail service via SMTP_EMAIL, and falls back to mock logger.
 */
export function getMailTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER || process.env.SMTP_EMAIL;
  const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // True for port 465, false for other ports
      auth: { user, pass },
    });
  }

  // Fallback to Gmail service if email/password set directly
  const email = process.env.SMTP_EMAIL;
  const password = process.env.SMTP_PASSWORD;

  if (email && password) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: email,
        pass: password,
      },
    });
  }

  // Return a mock transport for development/local environments
  return {
    sendMail: async (options: nodemailer.SendMailOptions) => {
      console.log("\n=============================================");
      console.log("[MOCK MAIL SENDING SIMULATION]");
      console.log(`From: ${options.from}`);
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Body (HTML length): ${String(options.html).length} characters`);
      if (options.attachments) {
        console.log(`Attachments: ${options.attachments.map((a: any) => a.filename).join(", ")}`);
      }
      console.log("=============================================\n");
      return { messageId: `mock_${Date.now()}` };
    },
  } as unknown as nodemailer.Transporter;
}

/**
 * Safe email sending wrapper.
 */
export async function sendEmail(options: nodemailer.SendMailOptions): Promise<boolean> {
  try {
    const transporter = getMailTransporter();
    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_EMAIL || "no-reply@zynoraluxe.com";
    
    await transporter.sendMail({
      from: `"ZYNORA LUXE" <${fromAddress}>`,
      ...options,
    });
    return true;
  } catch (error) {
    console.error("[MAILER ERROR] Failed to send email:", error);
    return false;
  }
}

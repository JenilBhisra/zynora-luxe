import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { ProfileUpdateSchema } from "@/lib/schemas";
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
    // 1. Authenticate user session
    const session = await getServerSession();

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const body = await request.json();

    // 2. Validate input schema using Zod
    const validationResult = ProfileUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name } = validationResult.data;

    // Sanitize name to prevent stored XSS inside dashboard views
    const safeName = escapeHtml(name);

    // 3. Update the name in the database using the singleton client
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { name: safeName },
    });

    logger.info(`Profile name successfully updated for: ${session.user.email} to: ${safeName}`);

    return NextResponse.json({ 
      status: "success", 
      message: "Profile updated in database.",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role
      }
    }, { status: 200 });
  } catch (error: any) {
    logger.error("Error updating profile in DB:", error);
    return NextResponse.json(
      { error: "Failed to update profile. Please try again later." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "@/lib/auth";

const prisma = new PrismaClient();

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { status } = body;

    const validStatuses = [
      "NEW",
      "CONTACTED",
      "QUOTE_SENT",
      "APPROVED",
      "IN_PRODUCTION",
      "COMPLETED",
      "CANCELLED"
    ];
    
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updatedRequest = await prisma.customizationRequest.update({
      where: { id },
      data: { status }
    });

    return NextResponse.json({ success: true, request: updatedRequest });
  } catch (error) {
    console.error("Failed to update customization request status", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

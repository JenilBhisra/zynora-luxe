import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate user session
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Session required." },
        { status: 401 }
      );
    }

    const { id } = await params;

    // 2. Fetch the order details
    let order = await prisma.order.findFirst({
      where: { displayOrderId: id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: true,
            ringConfiguration: {
              include: { diamond: true, setting: true },
            },
          },
        },
      },
    });

    if (!order) {
      order = await prisma.order.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: {
            include: {
              product: true,
              ringConfiguration: {
                include: { diamond: true, setting: true },
              },
            },
          },
        },
      });
    }

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // 3. Enforce access control check (Owner or Admin role required)
    const isOwner = order.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      logger.security(
        `Unauthorized IDOR attempt to view order ${order.id} by user ${session.user.email}`,
        _req
      );
      return NextResponse.json(
        { success: false, message: "Access denied: Unauthorized to view this resource." },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    logger.error("Fetch Order Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch order details." },
      { status: 500 }
    );
  }
}

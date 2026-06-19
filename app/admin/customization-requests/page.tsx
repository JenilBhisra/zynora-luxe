/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from "@prisma/client";
import { CustomizationRequestsTable } from "./components/CustomizationRequestsTable";
import { getServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export default async function AdminCustomizationRequestsPage() {
  const session = await getServerSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  let requests: any[] = [];
  try {
    requests = await prisma.customizationRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });
  } catch (e) {
    console.error("Failed to load customization requests", e);
  }

  return (
    <div>
      <header className="mb-10 flex justify-between items-end">
        <div>
          <p className="section-kicker mb-4">Operations</p>
          <h1 className="section-title text-zinc-900 mb-3 tracking-wide">Bespoke Design Requests</h1>
          <p className="text-zinc-500 text-[0.95rem] tracking-wide font-light">
            Review, track, and manage all client design customization inquiries.
          </p>
        </div>
      </header>

      <CustomizationRequestsTable initialRequests={requests} />
    </div>
  );
}

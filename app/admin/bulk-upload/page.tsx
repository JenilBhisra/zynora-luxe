import { getServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import BulkUploadClient from "./BulkUploadClient";

export const dynamic = 'force-dynamic';

export default async function AdminBulkUploadPage() {
    const session = await getServerSession();
    if (!session?.user || session.user.role !== "ADMIN") {
        redirect("/login");
    }

    return <BulkUploadClient />;
}

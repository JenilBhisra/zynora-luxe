import { getServerSession } from "@/lib/auth";
import AdminLayoutClient from "./AdminLayoutClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession();

    if (!session || session.user.role !== "ADMIN") {
        redirect("/login?error=unauthorized");
    }

    return (
        <AdminLayoutClient user={session.user}>
            {children}
        </AdminLayoutClient>
    );
}

import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import SettingDetailClient from "./SettingDetailClient";

const prisma = new PrismaClient();

export default async function SettingDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const setting = await prisma.setting.findUnique({ where: { id } });
    if (!setting) notFound();
    return <SettingDetailClient setting={setting} />;
}

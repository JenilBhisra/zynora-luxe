import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import SettingDetailClient from "./SettingDetailClient";
import { unstable_cache } from "next/cache";

const prisma = new PrismaClient();

export const revalidate = 300;

const getCachedSetting = (id: string) => unstable_cache(
    async () => {
        return prisma.setting.findUnique({ where: { id } });
    },
    [`setting-${id}`],
    { revalidate: 300, tags: [`setting-${id}`] }
)();

export default async function SettingDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const setting = await getCachedSetting(id);
    if (!setting) notFound();
    return <SettingDetailClient setting={setting} />;
}

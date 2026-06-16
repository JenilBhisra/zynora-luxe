import { PrismaClient } from "@prisma/client";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import DiamondDetailClient from "./DiamondDetailClient";

const prisma = new PrismaClient();

export default async function DiamondDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const diamond = await prisma.diamond.findUnique({ where: { id } });
    if (!diamond) notFound();
    return (
        <Suspense fallback={null}>
            <DiamondDetailClient diamond={diamond} />
        </Suspense>
    );
}

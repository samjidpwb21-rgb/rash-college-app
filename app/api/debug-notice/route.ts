import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
        if (!admin) return NextResponse.json({ error: "No admin found" });

        const notice = await prisma.notice.create({
            data: {
                title: "Debug Notice Direct",
                content: "Testing DB Constraints",
                isImportant: false,
                authorId: admin.id,
                departmentId: null,
                colorIndex: 0,
                type: "GENERAL",
            }
        });

        return NextResponse.json({ success: true, notice });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message, code: e.code, meta: e.meta });
    }
}

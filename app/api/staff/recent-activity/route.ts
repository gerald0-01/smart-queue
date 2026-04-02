import { confirmRole } from "@/lib/confirmRole"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(_req: NextRequest) {
    try {
        const auth = await confirmRole(["STAFF", "ADMIN"])
        if (auth instanceof NextResponse) return auth

        const recent = await prisma.request.findMany({
            orderBy: { updatedAt: "desc" },
            take: 8,
            include: {
                documentType: { select: { name: true } },
                user: { select: { name: true, idNumber: true } },
            },
        })

        return NextResponse.json({ success: true, data: recent }, { status: 200 })
    } catch (err) {
        console.error("RECENT ACTIVITY ERROR:", err)
        return NextResponse.json({ success: false, message: "Failed to fetch activity" }, { status: 500 })
    }
}

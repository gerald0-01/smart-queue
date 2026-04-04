import { confirmRole } from "@/lib/confirmRole"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

function getDayRange(date: Date) {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
    const end   = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
    return { start, end }
}

export async function GET(req: NextRequest) {
    try {
        const auth = await confirmRole(["STAFF", "ADMIN"])
        if (auth instanceof NextResponse) return auth

        const scope = req.nextUrl.searchParams.get("scope")
        
        let where = {}
        
        if (scope === "today") {
            const { start, end } = getDayRange(new Date())
            where = {
                createdAt: { gte: start, lte: end }
            }
        }

        const requests = await prisma.request.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, idNumber: true, college: true, course: true, email: true } },
                documentType: true,
            },
            orderBy: { createdAt: "desc" },
        })

        return NextResponse.json({ success: true, data: requests }, { status: 200 })
    } catch (err) {
        console.error("FETCH REQUESTS ERROR:", err)
        return NextResponse.json({ success: false, message: "Failed to fetch requests" }, { status: 500 })
    }
}
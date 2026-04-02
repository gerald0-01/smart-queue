import { confirmRole } from "@/lib/confirmRole"
import { prisma } from "@/lib/prisma"
import { cacheLib, cacheKey } from "@/lib/cache"
import { NextRequest, NextResponse } from "next/server"

export async function GET(_req: NextRequest) {
    const key = cacheKey("requests", "all")
    const cached = await cacheLib.get<{ success: boolean; data: unknown[] }>(key)
    if (cached) return NextResponse.json(cached, { status: 200 })

    try {
        const auth = await confirmRole(["STAFF", "ADMIN"])
        if (auth instanceof NextResponse) return auth

        const requests = await prisma.request.findMany({
            include: { documentType: true, user: true },
            orderBy: { createdAt: "asc" },
        })

        const response = { success: true, data: requests }
        await cacheLib.set(key, response, 30)

        return NextResponse.json(response, { status: 200 })
    } catch (err) {
        console.error("FETCHING DATA ERROR:", err)
        return NextResponse.json({ success: false, message: "Failed to fetch requests" }, { status: 500 })
    }
}

import { confirmRole } from "@/lib/confirmRole"
import { prisma } from "@/lib/prisma"
import { sendStaffVerifiedEmail } from "@/lib/email"
import { NextRequest, NextResponse } from "next/server"
import { rateLimit, getClientIP } from "@/lib/ratelimit"
import { cacheLib, cacheKey } from "@/lib/cache"

export async function GET(req: NextRequest) {
    const ip = getClientIP(req)
    const result = rateLimit.general(ip)

    if (!result.success) {
        return NextResponse.json({ success: false, message: "Too many requests. Please try again later." }, { status: 429 })
    }

    const { searchParams } = req.nextUrl
    const role = searchParams.get("role")
    const verified = searchParams.get("verified")
    const cacheLibKeyStr = cacheKey("users", `${role || "all"}:${verified || "all"}`)

    const cacheLibd = await cacheLib.get<{ success: boolean; data: unknown[] }>(cacheLibKeyStr)
    if (cacheLibd) {
        return NextResponse.json(cacheLibd, { status: 200 })
    }

    try {
        const auth = await confirmRole(["ADMIN"])
        if (auth instanceof NextResponse) return auth

        const { searchParams } = req.nextUrl
        const role = searchParams.get("role")
        const verified = searchParams.get("verified")

        const where: Record<string, unknown> = {}
        if (role) where.role = role
        if (verified !== null && verified !== "") where.verified = verified === "true"

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true, name: true, idNumber: true, email: true,
                role: true, college: true, course: true, verified: true, createdAt: true,
            },
            orderBy: { createdAt: "desc" },
        })

        const response = { success: true, data: users }
        await cacheLib.set(cacheLibKeyStr, response, 30)

        return NextResponse.json(response, { status: 200 })
    } catch (err) {
        console.error("ADMIN FETCH USERS ERROR:", err)
        return NextResponse.json({ success: false, message: "Failed to fetch users" }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest) {
    const ip = getClientIP(req)
    const result = rateLimit.general(ip)

    if (!result.success) {
        return NextResponse.json({ success: false, message: "Too many requests. Please try again later." }, { status: 429 })
    }

    try {
        const auth = await confirmRole(["ADMIN"])
        if (auth instanceof NextResponse) return auth

        const { userId, verified } = await req.json()

        if (!userId || typeof verified !== "boolean") {
            return NextResponse.json({ success: false, message: "userId and verified are required" }, { status: 400 })
        }

        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (!user) return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })

        await prisma.user.update({
            where: { id: userId },
            data: { verified },
        })

        // Notify staff by email when verified
        if (verified && user.role === "STAFF") {
            await sendStaffVerifiedEmail(user.email).catch(() => {/* non-fatal */})
        }

        await cacheLib.deletePattern("users:*")

        return NextResponse.json({ success: true, message: `User ${verified ? "verified" : "unverified"} successfully` }, { status: 200 })
    } catch (err) {
        console.error("ADMIN PATCH USER ERROR:", err)
        return NextResponse.json({ success: false, message: "Failed to update user" }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest) {
    const ip = getClientIP(req);
    const { success } = await rateLimit.general.limit(ip);

    if (!success) {
        return NextResponse.json({ success: false, message: "Too many requests. Please try again later." }, { status: 429 });
    }

    try {
        const auth = await confirmRole(["ADMIN"])
        if (auth instanceof NextResponse) return auth

        const { userId } = await req.json()
        if (!userId) return NextResponse.json({ success: false, message: "userId is required" }, { status: 400 })

        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (!user) return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })

        // Prevent self-deletion
        if (user.id === auth.user.id) {
            return NextResponse.json({ success: false, message: "Cannot delete your own account" }, { status: 400 })
        }

        await prisma.user.delete({ where: { id: userId } })

        await cacheLib.deletePattern("users:*")

        return NextResponse.json({ success: true, message: "User deleted" }, { status: 200 })
    } catch (err) {
        console.error("ADMIN DELETE USER ERROR:", err)
        return NextResponse.json({ success: false, message: "Failed to delete user" }, { status: 500 })
    }
}

import { confirmRole } from "@/lib/confirmRole"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(_req: NextRequest) {
    try {
        const auth = await confirmRole(["ADMIN"])
        if (auth instanceof NextResponse) return auth

        const [totalUsers, totalRequests, unverifiedStaff, pendingRequests] = await Promise.all([
            prisma.user.count(),
            prisma.request.count(),
            prisma.user.count({ where: { role: "STAFF", verified: false } }),
            prisma.request.count({ where: { status: "PENDING" } }),
        ])

        const usersByRole = await prisma.user.groupBy({
            by: ["role"],
            _count: { id: true },
        })

        const requestsByStatus = await prisma.request.groupBy({
            by: ["status"],
            _count: { id: true },
        })

        return NextResponse.json({
            success: true,
            data: {
                totalUsers,
                totalRequests,
                unverifiedStaff,
                pendingRequests,
                usersByRole: usersByRole.map(r => ({ role: r.role, count: r._count.id })),
                requestsByStatus: requestsByStatus.map(r => ({ status: r.status, count: r._count.id })),
            },
        }, { status: 200 })
    } catch (err) {
        console.error("ADMIN DASHBOARD ERROR:", err)
        return NextResponse.json({ success: false, message: "Failed to fetch admin dashboard" }, { status: 500 })
    }
}

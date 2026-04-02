import { confirmRole } from "@/lib/confirmRole"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(_req: NextRequest) {
    try {
        const auth = await confirmRole(["STUDENT", "ALUMNI", "ADMIN"])
        if (auth instanceof NextResponse) return auth

        // Now serving = lowest queue number currently PROCESSING
        const nowServingReq = await prisma.request.findFirst({
            where: { status: "PROCESSING" },
            orderBy: { queueNumber: "asc" },
            select: { queueNumber: true },
        })

        const nowServing = nowServingReq?.queueNumber ?? null

        // Count of PENDING requests with a lower queue number than each of the user's requests
        // We return per-request info so the UI can show it per card
        const userRequests = await prisma.request.findMany({
            where: {
                userId: auth.user.id,
                status: { in: ["PENDING", "PROCESSING"] },
            },
            select: { id: true, queueNumber: true, status: true },
        })

        // For each active request, count how many PENDING/PROCESSING requests are ahead
        const requestsWithAhead = await Promise.all(
            userRequests.map(async (req) => {
                const ahead = await prisma.request.count({
                    where: {
                        status: { in: ["PENDING", "PROCESSING"] },
                        queueNumber: { lt: req.queueNumber },
                    },
                })
                return { id: req.id, queueNumber: req.queueNumber, status: req.status, ahead }
            })
        )

        return NextResponse.json(
            { success: true, data: { nowServing, requests: requestsWithAhead } },
            { status: 200 }
        )
    } catch (err) {
        console.error("QUEUE INFO ERROR:", err)
        return NextResponse.json(
            { success: false, message: "Failed to fetch queue info" },
            { status: 500 }
        )
    }
}

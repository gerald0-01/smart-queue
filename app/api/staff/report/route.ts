import { confirmRole } from "@/lib/confirmRole"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

function getDayRange(date: Date) {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
    const end   = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
    return { start, end }
}

export async function getRequestsForDate(date: Date) {
    const { start, end } = getDayRange(date)
    return prisma.request.findMany({
        where: { createdAt: { gte: start, lte: end } },
        include: {
            user: { select: { id: true, name: true, idNumber: true, college: true, course: true, email: true } },
            documentType: true,
        },
        orderBy: { createdAt: "asc" },
    })
}

export async function GET(req: NextRequest) {
    try {
        const auth = await confirmRole(["STAFF", "ADMIN"])
        if (auth instanceof NextResponse) return auth

        // ?date=YYYY-MM-DD  (defaults to today)
        const dateParam = req.nextUrl.searchParams.get("date")
        const date = dateParam ? new Date(dateParam) : new Date()

        if (isNaN(date.getTime())) {
            return NextResponse.json({ success: false, message: "Invalid date format." }, { status: 400 })
        }

        const requests = await getRequestsForDate(date)

        const summary = {
            total:      requests.length,
            pending:    requests.filter(r => r.status === "PENDING").length,
            processing: requests.filter(r => r.status === "PROCESSING").length,
            ready:      requests.filter(r => r.status === "READY").length,
            completed:  requests.filter(r => r.status === "COMPLETED").length,
            rejected:   requests.filter(r => r.status === "REJECTED").length,
        }

        return NextResponse.json({ success: true, data: { date: date.toISOString(), summary, requests } }, { status: 200 })
    } catch (err) {
        console.error("REPORT ERROR:", err)
        return NextResponse.json({ success: false, message: "Failed to fetch report data" }, { status: 500 })
    }
}

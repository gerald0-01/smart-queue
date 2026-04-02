import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        if (!["STUDENT", "ALUMNI", "ADMIN"].includes(session.user.role)) {
            return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
        }

        const response = await prisma.request.findMany({
            where: { userId: session.user.id },
            include: { documentType: true },
            orderBy: { createdAt: "asc" },
        });

        return NextResponse.json({ success: true, data: response }, { status: 200 });
    } catch (err) {
        console.error("FETCHING DATA ERROR:", err);
        return NextResponse.json({ success: false, message: "Failed to fetch requests" }, { status: 500 });
    }
}

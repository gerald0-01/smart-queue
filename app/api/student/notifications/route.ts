import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIP } from "@/lib/ratelimit";

export async function GET(req: NextRequest) {
    const ip = getClientIP(req);
    const result = rateLimit.general(ip);

    if (!result.success) {
        return NextResponse.json({ success: false, message: "Too many requests. Please try again later." }, { status: 429 });
    }

    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        if (!["STUDENT", "ALUMNI", "ADMIN"].includes(session.user.role)) {
            return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
        }

        const notifications = await prisma.notification.findMany({
            where: { userId: session.user.id },
            include: {
                request: {
                    select: {
                        id: true, queueNumber: true, status: true, purpose: true,
                        message: true, availablePickUp: true,
                        documentType: { select: { name: true } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ success: true, data: notifications }, { status: 200 });
    } catch (err) {
        console.error("FETCH NOTIFICATIONS ERROR:", err);
        return NextResponse.json({ success: false, message: "Failed to fetch notifications" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    const ip = getClientIP(req);
    const result = rateLimit.general(ip);

    if (!result.success) {
        return NextResponse.json({ success: false, message: "Too many requests. Please try again later." }, { status: 429 });
    }

    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        if (!["STUDENT", "ALUMNI", "ADMIN"].includes(session.user.role)) {
            return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
        }

        const { notificationIds } = await req.json();

        if (!notificationIds || !Array.isArray(notificationIds)) {
            return NextResponse.json({ success: false, message: "notificationIds array is required" }, { status: 400 });
        }

        await prisma.notification.updateMany({
            where: { id: { in: notificationIds }, userId: session.user.id },
            data: { isRead: true },
        });

        return NextResponse.json({ success: true, message: "Notifications marked as read" }, { status: 200 });
    } catch (err) {
        console.error("UPDATE NOTIFICATIONS ERROR:", err);
        return NextResponse.json({ success: false, message: "Failed to update notifications" }, { status: 500 });
    }
}

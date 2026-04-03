import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NotificationType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { cacheLib, cacheKey } from "@/lib/cache";

const statusMessages: Record<string, string> = {
    PENDING: "Your request has been received and is pending review.",
    PROCESSING: "Your request is now being processed.",
    READY: "Your document is ready for pickup!",
    COMPLETED: "Your request has been completed.",
    REJECTED: "Your request has been rejected.",
};

interface ParamsContext {
    params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, context: ParamsContext) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        if (!["STAFF", "ADMIN"].includes(session.user.role)) {
            return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
        }

        const { id } = await context.params;
        const { status, message, availablePickUp } = await req.json();

        if (!status) {
            return NextResponse.json({ success: false, message: "Status is required" }, { status: 400 });
        }

        const exist = await prisma.request.findUnique({ where: { id } });

        if (!exist) {
            return NextResponse.json({ success: false, message: "Request doesn't exist." }, { status: 404 });
        }

        const processedAt = status === "PROCESSING" && !exist.processedAt ? new Date() : exist.processedAt;

        const updated = await prisma.request.update({
            where: { id },
            data: { status, message, availablePickUp, processedAt },
        });

        const notificationMessage =
            status === "REJECTED" && message
                ? `${statusMessages[status]} Reason: ${message}`
                : statusMessages[status] ?? `Your request status has been updated to ${status}.`;

        const notificationType = status === "READY" ? NotificationType.PICKUP_READY : NotificationType.STATUS_UPDATE;

        await prisma.notification.create({
            data: {
                userId: exist.userId,
                requestId: exist.id,
                type: notificationType,
                message: notificationMessage,
            },
        });

        await cacheLib.delete(cacheKey("requests", "all"));
        await cacheLib.delete(cacheKey("request", id));
        await cacheLib.deletePattern("notifications:*");

        return NextResponse.json({ success: true, data: updated, message: "Request updated!" }, { status: 200 });
    } catch (err) {
        console.error("UPDATING DATA ERROR:", err);
        return NextResponse.json({ success: false, message: "Failed to update request" }, { status: 500 });
    }
}

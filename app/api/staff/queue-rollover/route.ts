import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NotificationType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        if (!["STAFF", "ADMIN"].includes(session.user.role)) {
            return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const carryoverRequests = await prisma.request.findMany({
            where: { status: "PENDING", createdAt: { lt: today } },
            orderBy: { createdAt: "asc" },
        });

        if (carryoverRequests.length === 0) {
            return NextResponse.json({ success: true, message: "No carryover requests to process." }, { status: 200 });
        }

        await prisma.$transaction(async (tx) => {
            for (let i = 0; i < carryoverRequests.length; i++) {
                const newQueueNumber = i + 1;

                await tx.request.update({
                    where: { id: carryoverRequests[i].id },
                    data: { queueNumber: newQueueNumber },
                });

                await tx.notification.create({
                    data: {
                        userId: carryoverRequests[i].userId,
                        requestId: carryoverRequests[i].id,
                        type: NotificationType.QUEUE_ROLLOVER,
                        message: `Your queue number has been updated to ${newQueueNumber} for today's rollover.`,
                    },
                });
            }

            let counter = await tx.queueCounter.findFirst();
            if (!counter) {
                counter = await tx.queueCounter.create({ data: { lastQueue: carryoverRequests.length } });
            } else {
                await tx.queueCounter.update({
                    where: { id: counter.id },
                    data: { lastQueue: carryoverRequests.length },
                });
            }
        });

        return NextResponse.json(
            {
                success: true,
                message: `Rollover complete. ${carryoverRequests.length} pending requests reassigned.`,
                data: carryoverRequests.map((r, i) => ({
                    id: r.id,
                    oldQueueNumber: r.queueNumber,
                    newQueueNumber: i + 1,
                    createdAt: r.createdAt,
                })),
            },
            { status: 200 }
        );
    } catch (err) {
        console.error("QUEUE ROLLOVER ERROR:", err);
        return NextResponse.json({ success: false, message: "Failed to process queue rollover" }, { status: 500 });
    }
}

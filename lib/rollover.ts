import { prisma } from "@/lib/prisma"

/**
 * Midnight rollover:
 * 1. Find all still-active (PENDING / PROCESSING) requests ordered by their
 *    current queueNumber (preserves relative order).
 * 2. Re-assign queue numbers starting from 1 using the same atomic counter
 *    logic the student request API uses.
 * 3. Reset QueueCounter.lastQueue to the number of carried-over requests
 *    so the next new request gets the correct next number.
 * 4. Notify each affected user that their queue number was updated.
 */
export async function runRollover() {
    // Grab active requests in queue order
    const active = await prisma.request.findMany({
        where: { status: { in: ["PENDING", "PROCESSING"] } },
        orderBy: { queueNumber: "asc" },
        select: { id: true, userId: true, queueNumber: true },
    })

    await prisma.$transaction(async (tx) => {
        // Re-number each active request 1, 2, 3 …
        for (let i = 0; i < active.length; i++) {
            await tx.request.update({
                where: { id: active[i].id },
                data: { queueNumber: i + 1 },
            })
        }

        // Reset counter to the count of carried-over requests
        // so the next new request gets active.length + 1
        const counter = await tx.queueCounter.findFirst()
        if (counter) {
            await tx.queueCounter.update({
                where: { id: counter.id },
                data: { lastQueue: active.length },
            })
        } else {
            await tx.queueCounter.create({ data: { lastQueue: active.length } })
        }

        // Notify affected users
        if (active.length > 0) {
            await tx.notification.createMany({
                data: active.map((r, i) => ({
                    userId: r.userId,
                    requestId: r.id,
                    type: "QUEUE_ROLLOVER" as const,
                    message: `Queue numbers have been reset for a new day. Your new queue number is #${i + 1}.`,
                })),
            })
        }
    })

    return { requeued: active.length }
}

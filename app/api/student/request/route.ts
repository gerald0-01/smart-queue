import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        const { document, documentDescription, notes, purpose } = await req.json()

        if (!document || !purpose) return NextResponse.json(
            { success: false, message: "Fill in the required fields." },
            { status: 400}
        )

        await prisma.$transaction(async () => {
            let doc = await prisma.documentType.findUnique({
            where: { name: document }
            })

            if (!doc) doc = await prisma.documentType.create({
                data: {
                    name: document,
                    description: documentDescription
                }
            })

            prisma.request.create({
                data: {
                    userId: session?.user.id as string,
                    purpose,
                    notes,
                    documentTypeId: doc.id,
                    queueNumber: await getNextQueueNumber()
                }
            })
        })

        return NextResponse.json(
            { success: true, message: "Document requested!" },
            { status: 201 }
        )
    } catch (err) {
        console.error("REQUEST ERROR: ", err)

        return NextResponse.json(
            { success: false, message: "Server Error" },
            { status: 500 }
        )
    }
}

async function getNextQueueNumber() {
  // Use a transaction to prevent race conditions
  return await prisma.$transaction(async (tx) => {
    // 1. Get the counter row (assuming you only have 1)
    let counter = await tx.queueCounter.findFirst();

    if (!counter) {
      // Create counter if it doesn't exist
      counter = await tx.queueCounter.create({ data: {} });
    }

    // 2. Increment lastQueue
    const nextQueue = counter.lastQueue + 1;

    // 3. Update counter
    await tx.queueCounter.update({
      where: { id: counter.id },
      data: { lastQueue: nextQueue },
    });

    // 4. Return next queue number
    return nextQueue;
  });
}
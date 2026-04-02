import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIP } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
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

        const { name, description, notes, purpose } = await req.json();

        if (!name || !purpose) {
            return NextResponse.json({ success: false, message: "Fill in the required fields." }, { status: 400 });
        }

        let queueNumber: number | undefined;

        await prisma.$transaction(async (tx) => {
            let doc = await tx.documentType.findUnique({ where: { name } });

            if (!doc) {
                doc = await tx.documentType.create({ data: { name, description } });
            }

            let counter = await tx.queueCounter.findFirst();
            if (!counter) {
                counter = await tx.queueCounter.create({ data: {} });
            }

            queueNumber = counter.lastQueue + 1;

            await tx.queueCounter.update({
                where: { id: counter.id },
                data: { lastQueue: queueNumber },
            });

            await tx.request.create({
                data: {
                    userId: session.user.id,
                    purpose,
                    notes,
                    documentTypeId: doc.id,
                    queueNumber: queueNumber as number,
                },
            });
        });

        return NextResponse.json(
            { success: true, message: "Document requested!", queueNumber },
            { status: 201 }
        );
    } catch (err) {
        console.error("REQUEST ERROR:", err);
        return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
    }
}

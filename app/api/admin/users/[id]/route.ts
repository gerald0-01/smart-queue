import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { sendStaffVerifiedEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

interface ParamsContext {
    params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, context: ParamsContext) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
        }

        const { id } = await context.params;
        const { verified } = await req.json();

        const user = await prisma.user.findUnique({ where: { id } });

        if (!user) {
            return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
        }

        if (verified === true && !user.verified && user.role === "STAFF") {
            await prisma.user.update({
                where: { id },
                data: { verified: true },
            });

            await sendStaffVerifiedEmail(user.email);

            return NextResponse.json(
                { success: true, message: `Staff account for ${user.name} has been verified. Notification email sent.` },
                { status: 200 }
            );
        }

        if (verified === false && user.verified) {
            if (user.role === "ADMIN") {
                return NextResponse.json({ success: false, message: "Cannot unverify an admin account." }, { status: 403 });
            }

            await prisma.user.update({
                where: { id },
                data: { verified: false },
            });

            return NextResponse.json({ success: true, message: `Account for ${user.name} has been unverified.` }, { status: 200 });
        }

        return NextResponse.json({ success: false, message: "No changes made." }, { status: 400 });
    } catch (err) {
        console.error("ADMIN VERIFY USER ERROR:", err);
        return NextResponse.json({ success: false, message: "Failed to update user verification" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, context: ParamsContext) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
        }

        const { id } = await context.params;

        const user = await prisma.user.findUnique({ where: { id } });

        if (!user) {
            return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
        }

        if (user.role === "ADMIN") {
            return NextResponse.json({ success: false, message: "Cannot delete an admin account." }, { status: 403 });
        }

        await prisma.$transaction(async (tx) => {
            await tx.notification.deleteMany({ where: { userId: id } });
            await tx.request.deleteMany({ where: { userId: id } });
            await tx.refreshToken.deleteMany({ where: { userId: id } });
            await tx.user.delete({ where: { id } });
        });

        return NextResponse.json({ success: true, message: `User ${user.name} has been deleted.` }, { status: 200 });
    } catch (err) {
        console.error("ADMIN DELETE USER ERROR:", err);
        return NextResponse.json({ success: false, message: "Failed to delete user" }, { status: 500 });
    }
}

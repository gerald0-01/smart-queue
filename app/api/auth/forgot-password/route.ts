import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { rateLimit, getClientIP } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
    const ip = getClientIP(req);
    const result = rateLimit.strict(ip);

    if (!result.success) {
        return NextResponse.json(
            { success: false, message: "Too many requests. Please try again later." },
            { status: 429 }
        );
    }

    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json(
                { success: false, message: "Email is required." },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return NextResponse.json(
                { success: true, message: "If an account exists with that email, a reset link has been sent." },
                { status: 200 }
            );
        }

        const resetToken = crypto.randomUUID();
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await prisma.user.update({
            where: { id: user.id },
            data: { resetToken, resetTokenExpiry },
        });

        await sendPasswordResetEmail(user.email, resetToken);

        return NextResponse.json(
            { success: true, message: "If an account exists with that email, a reset link has been sent." },
            { status: 200 }
        );
    } catch (err) {
        console.error("FORGOT PASSWORD ERROR:", err);
        return NextResponse.json(
            { success: false, message: "Failed to process password reset" },
            { status: 500 }
        );
    }
}

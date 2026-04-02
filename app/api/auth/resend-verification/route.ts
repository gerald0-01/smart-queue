import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
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
                { success: true, message: "If an account exists with that email, a verification link has been sent." },
                { status: 200 }
            );
        }

        if (user.verified) {
            return NextResponse.json(
                { success: false, message: "Email is already verified." },
                { status: 400 }
            );
        }

        if (user.role !== "STUDENT" && user.role !== "ALUMNI") {
            return NextResponse.json(
                { success: false, message: "Only student and alumni accounts use email verification." },
                { status: 400 }
            );
        }

        const verificationToken = crypto.randomUUID();

        await prisma.user.update({
            where: { id: user.id },
            data: { verificationToken },
        });

        await sendVerificationEmail(user.email, verificationToken);

        return NextResponse.json(
            { success: true, message: "If an account exists with that email, a verification link has been sent." },
            { status: 200 }
        );
    } catch (err) {
        console.error("RESEND VERIFICATION ERROR:", err);
        return NextResponse.json(
            { success: false, message: "Failed to resend verification email" },
            { status: 500 }
        );
    }
}

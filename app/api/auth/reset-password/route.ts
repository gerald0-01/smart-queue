import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcrypt"

export async function POST(req: NextRequest) {
    try {
        const token = req.nextUrl.searchParams.get("token")
        const { password } = await req.json()

        if (!token) return NextResponse.json(
            { success: false, message: "Reset token is required." }, { status: 400 }
        )

        if (!password || password.length < 6) return NextResponse.json(
            { success: false, message: "Password must be at least 6 characters." }, { status: 400 }
        )

        const user = await prisma.user.findUnique({ where: { resetToken: token } })

        if (!user) return NextResponse.json(
            { success: false, message: "Invalid or expired reset token." }, { status: 400 }
        )

        if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
            await prisma.user.update({
                where: { id: user.id },
                data: { resetToken: null, resetTokenExpiry: null },
            })
            return NextResponse.json(
                { success: false, message: "Reset token has expired. Please request a new one." }, { status: 400 }
            )
        }

        const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(12))

        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword, resetToken: null, resetTokenExpiry: null },
        })

        return NextResponse.json(
            { success: true, message: "Password reset successfully. You can now sign in." }, { status: 200 }
        )
    } catch (err) {
        console.error("RESET PASSWORD ERROR:", err)
        return NextResponse.json({ success: false, message: "Failed to reset password" }, { status: 500 })
    }
}

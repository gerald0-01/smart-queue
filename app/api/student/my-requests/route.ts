import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    try {
        const response = await prisma.request.findMany({
            where: { userId: session?.user.id }
        })

        return NextResponse.json(
            response,
            { status: 200 }
        )
    } catch (err) {
        console.error("REQUEST ERROR: ", err)

        return NextResponse.json(
            { success: false, message: "Server Error" },
            { status: 500 }
        )
    }
}
import { getServerSession } from "next-auth";
import { authOptions } from "./authOptions";
import { NextResponse } from "next/server";

export async function confirmRole (allowedRoles: string[]) {
    const session = await getServerSession(authOptions)

    if (!session) return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
    )

    if (!allowedRoles.includes(session.user.role)) return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
    )

    return session
}
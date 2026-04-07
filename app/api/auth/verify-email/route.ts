import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        new URL("/verify-email?error=missing_token", req.url),
      );
    }

    const user = await prisma.user.findUnique({
      where: { verificationToken: token },
    });

    if (!user) {
      return NextResponse.redirect(
        new URL("/verify-email?error=invalid_token", req.url),
      );
    }

    if (user.verified) {
      return NextResponse.redirect(
        new URL("/verify-email?error=already_verified", req.url),
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { verified: true, verificationToken: null },
    });

    return NextResponse.redirect(new URL("/verify-email?success=1", req.url));
  } catch (err) {
    console.error("EMAIL VERIFICATION ERROR:", err);
    return NextResponse.redirect(
      new URL("/verify-email?error=server_error", req.url),
    );
  }
}

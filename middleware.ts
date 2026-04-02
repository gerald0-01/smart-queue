import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    const publicPaths = ["/", "/login", "/register", "/forgot-password", "/verify-email", "/reset-password"];
    const isPublicPage = publicPaths.some((p) => pathname === p);
    const isApiRoute = pathname.startsWith("/api");
    const isStaticAsset = pathname.startsWith("/_next") || pathname.includes(".");

    if (isApiRoute || isStaticAsset) {
        return NextResponse.next();
    }

    const token = await getToken({ req, secret: process.env.JWT_SECRET });

    if (!token && !isPublicPage) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    if (token && (pathname === "/login" || pathname === "/register")) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

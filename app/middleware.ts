// app/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { confirmRole } from "@/lib/confirmRole";

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    if (pathname.startsWith("/admin")) {
        const session = await confirmRole(["ADMIN"]); 
        if (!(session && "user" in session)) return session;
    }

    if (pathname.startsWith("/staff")) {
        const session = await confirmRole(["ADMIN", "STAFF"]); 
        if (!(session && "user" in session)) return session;
    }

    if (pathname.startsWith("/student")) {
        const session = await confirmRole(["ADMIN", "STUDENT"]); 
        if (!(session && "user" in session)) return session;
    }

  return NextResponse.next(); 
}
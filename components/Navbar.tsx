"use client";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import NotificationBell from "@/components/NotificationBell";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const isStudent =
    session?.user.role === "STUDENT" || session?.user.role === "ALUMNI";
  const isStaff = session?.user.role === "STAFF";
  const isAdmin = session?.user.role === "ADMIN";

  const active = (href: string) => pathname === href;

  if (status === "loading")
    return (
      <nav
        className="flex h-16 sm:h-20 fixed w-full items-center justify-between px-4 sm:px-6 z-50"
        style={{ backgroundColor: "var(--color-secondary)" }}
      >
        <div className="flex items-center gap-2">
          <Image
            src="/favicon.ico"
            alt="Smart Queue"
            width={40}
            height={40}
            className="w-10 h-10 rounded-lg"
          />
          <span
            className="text-lg font-black"
            style={{ color: "var(--color-tertiary)" }}
          >
            Smart Queue
          </span>
        </div>
      </nav>
    );

  return (
    <>
      {/* ── Top navbar ── */}
      <nav
        className="flex h-16 sm:h-20 fixed w-full items-center justify-between px-4 sm:px-6 z-50 shadow-md"
        style={{ backgroundColor: "var(--color-secondary)" }}
      >
        <Link
          href={session ? "/dashboard" : "/"}
          className="flex items-center gap-2 no-underline"
        >
          <Image
            src="/favicon.ico"
            alt="Smart Queue"
            width={40}
            height={40}
            className="w-10 h-10 rounded-lg"
          />
          <span
            className="text-lg font-black tracking-wide hidden sm:block"
            style={{ color: "var(--color-tertiary)" }}
          >
            Smart Queue
          </span>
        </Link>

        <div className="flex items-center gap-1.5">
          {!session ? (
            <>
              <Link href="/login" className="btn btn-ghost text-sm">
                Sign In
              </Link>
              <Link
                href="/register"
                className="btn text-sm font-bold"
                style={{
                  backgroundColor: "var(--color-tertiary)",
                  color: "var(--color-secondary)",
                }}
              >
                Register
              </Link>
            </>
          ) : (
            <>
              {/* Desktop nav links — hidden on mobile (bottom nav handles it) */}
              <div className="hidden sm:flex items-center gap-1">
                {isStudent && (
                  <>
                    {(["Queue", "Request", "Track"] as const).map((label) => {
                      const href = `/dashboard/${label.toLowerCase()}`;
                      return (
                        <button
                          key={label}
                          onClick={() => router.push(href)}
                          className="btn btn-ghost text-sm"
                          style={
                            active(href)
                              ? { backgroundColor: "rgba(255,255,255,0.22)" }
                              : {}
                          }
                        >
                          {label}
                        </button>
                      );
                    })}
                  </>
                )}
                {isStaff && (
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="btn btn-ghost text-sm"
                    style={
                      active("/dashboard")
                        ? { backgroundColor: "rgba(255,255,255,0.22)" }
                        : {}
                    }
                  >
                    Requests
                  </button>
                )}
                {isAdmin && (
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="btn btn-ghost text-sm"
                    style={
                      active("/dashboard")
                        ? { backgroundColor: "rgba(255,255,255,0.22)" }
                        : {}
                    }
                  >
                    Overview
                  </button>
                )}
              </div>

              {isStudent && <NotificationBell />}

              {/* User chip */}
              <div
                className="flex items-center gap-2 pl-3 ml-1"
                style={{ borderLeft: "1px solid rgba(255,255,255,0.18)" }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                  style={{
                    backgroundColor: "var(--color-tertiary)",
                    color: "var(--color-secondary)",
                  }}
                >
                  {session.user.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-white hidden sm:block">
                  {session.user.name?.split(" ")[0]}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="btn btn-ghost text-xs px-2 py-1.5 hidden sm:inline-flex"
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </nav>

      {/* ── Mobile bottom nav (students only) ── */}
      {session && isStudent && (
        <nav className="bottom-nav">
          {[
            { href: "/dashboard", icon: "🏠", label: "Home" },
            { href: "/dashboard/queue", icon: "🔢", label: "Queue" },
            { href: "/dashboard/request", icon: "📄", label: "Request" },
            { href: "/dashboard/track", icon: "📋", label: "Track" },
          ].map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: active(item.href) ? "var(--color-secondary)" : "#9CA3AF",
              }}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className="text-xs font-semibold">{item.label}</span>
              {active(item.href) && (
                <div
                  className="w-1 h-1 rounded-full mt-0.5"
                  style={{ backgroundColor: "var(--color-secondary)" }}
                />
              )}
            </button>
          ))}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#9CA3AF",
            }}
          >
            <span className="text-xl leading-none">👤</span>
            <span className="text-xs font-semibold">Sign out</span>
          </button>
        </nav>
      )}

      {/* Mobile bottom nav for staff/admin */}
      {session && (isStaff || isAdmin) && (
        <nav className="bottom-nav">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: active("/dashboard")
                ? "var(--color-secondary)"
                : "#9CA3AF",
            }}
          >
            <span className="text-xl leading-none">
              {isAdmin ? "📊" : "📋"}
            </span>
            <span className="text-xs font-semibold">
              {isAdmin ? "Overview" : "Requests"}
            </span>
            {active("/dashboard") && (
              <div
                className="w-1 h-1 rounded-full mt-0.5"
                style={{ backgroundColor: "var(--color-secondary)" }}
              />
            )}
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#9CA3AF",
            }}
          >
            <span className="text-xl leading-none">👤</span>
            <span className="text-xs font-semibold">Sign out</span>
          </button>
        </nav>
      )}
    </>
  );
}

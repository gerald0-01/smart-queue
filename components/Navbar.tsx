'use client'
import { signOut, useSession } from "next-auth/react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import NotificationBell from "@/components/NotificationBell"

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session, status } = useSession()

  if (status === "loading") return (
    <nav className="flex h-20 fixed w-full items-center justify-between px-6 z-50"
      style={{ backgroundColor: 'var(--color-secondary)' }}>
      <span className="text-2xl font-extrabold tracking-wide" style={{ color: 'var(--color-tertiary)' }}>
        Smart Queue
      </span>
    </nav>
  )

  const navLink = (href: string, label: string) => {
    const active = pathname === href
    return (
      <button onClick={() => router.push(href)}
        className="btn btn-ghost text-sm"
        style={active ? { backgroundColor: 'rgba(255,255,255,0.25)' } : {}}>
        {label}
      </button>
    )
  }

  const isStudent = session?.user.role === 'STUDENT' || session?.user.role === 'ALUMNI'
  const isStaff = session?.user.role === 'STAFF'
  const isAdmin = session?.user.role === 'ADMIN'

  return (
    <nav className="flex h-20 fixed w-full items-center justify-between px-6 z-50 shadow-lg"
      style={{ backgroundColor: 'var(--color-secondary)' }}>

      <Link href="/" className="flex items-center gap-2 no-underline">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-sm"
          style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--color-secondary)' }}>
          SQ
        </div>
        <span className="text-xl font-extrabold tracking-wide hidden sm:block"
          style={{ color: 'var(--color-tertiary)' }}>
          Smart Queue
        </span>
      </Link>

      <div className="flex items-center gap-2">
        {!session ? (
          <>
            <Link href="/login" className="btn btn-ghost text-sm">Login</Link>
            <Link href="/register" className="btn text-sm"
              style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--color-secondary)' }}>
              Register
            </Link>
          </>
        ) : (
          <>
            {isStudent && (
              <>
                {navLink("/dashboard/queue", "Queue")}
                {navLink("/dashboard/request", "Request")}
                {navLink("/dashboard/track", "Track")}
              </>
            )}
            {isStaff && (
              <>
                {navLink("/dashboard", "Requests")}
              </>
            )}

            {isAdmin && (
              <>
                {navLink("/dashboard", "Overview")}
              </>
            )}

            {/* Notification bell — students only */}
            {isStudent && <NotificationBell />}

            <div className="flex items-center gap-2 ml-2 pl-3"
              style={{ borderLeft: '1px solid rgba(255,255,255,0.2)' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--color-secondary)' }}>
                {session.user.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-white hidden sm:block">
                {session.user.name?.split(' ')[0]}
              </span>
              <button onClick={() => signOut({ callbackUrl: "/login" })}
                className="btn btn-ghost text-sm ml-1">
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  )
}

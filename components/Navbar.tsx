'use client'
import { signOut, useSession } from "next-auth/react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import NotificationBell from "@/components/NotificationBell"
import { useState } from "react"

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)

  if (status === "loading") return (
    <nav className="flex h-16 sm:h-20 fixed w-full items-center justify-between px-4 sm:px-6 z-50"
      style={{ backgroundColor: 'var(--color-secondary)' }}>
      <span className="text-xl sm:text-2xl font-extrabold tracking-wide" style={{ color: 'var(--color-tertiary)' }}>
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
    <nav className="flex h-16 sm:h-20 fixed w-full items-center justify-between px-4 sm:px-6 z-50 shadow-lg"
      style={{ backgroundColor: 'var(--color-secondary)' }}>

      <Link href="/" className="flex items-center gap-2 no-underline">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-sm"
          style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--color-secondary)' }}>
          SQ
        </div>
        <span className="text-lg sm:text-xl font-extrabold tracking-wide hidden sm:block"
          style={{ color: 'var(--color-tertiary)' }}>
          Smart Queue
        </span>
      </Link>

      <button className="sm:hidden p-2 text-white" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {menuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      <div className={`${menuOpen ? 'flex' : 'hidden'} sm:flex flex-col sm:flex-row absolute sm:relative top-16 sm:top-0 left-0 right-0 sm:bg-transparent bg-[var(--color-secondary)] sm:items-center gap-2 p-4 sm:p-0`}>
        {!session ? (
          <>
            <Link href="/login" className="btn btn-ghost text-sm text-center sm:text-left">Login</Link>
            <Link href="/register" className="btn text-sm text-center sm:text-left"
              style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--color-secondary)' }}>
              Register
            </Link>
          </>
        ) : (
          <>
            {isStudent && (
              <div className="flex flex-col sm:flex-row gap-1">
                {navLink("/dashboard/queue", "Queue")}
                {navLink("/dashboard/request", "Request")}
                {navLink("/dashboard/track", "Track")}
              </div>
            )}
            {isStaff && (
              <div className="flex flex-col sm:flex-row gap-1">
                {navLink("/dashboard", "Requests")}
              </div>
            )}

            {isAdmin && (
              <div className="flex flex-col sm:flex-row gap-1">
                {navLink("/dashboard", "Overview")}
              </div>
            )}

            {isStudent && <NotificationBell />}

            <div className="flex flex-col sm:flex-row items-center gap-2 mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/20"
              style={{ borderLeft: 'none' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--color-secondary)' }}>
                {session.user.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-white hidden sm:block">
                {session.user.name?.split(' ')[0]}
              </span>
              <button onClick={() => signOut({ callbackUrl: "/login" })}
                className="btn btn-ghost text-sm ml-0 sm:ml-1 w-full sm:w-auto">
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  )
}

'use client'
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import axios from "axios"
import { useEffect, useState } from "react"

type RequestStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'REJECTED'

interface Request {
  id: string
  queueNumber: number
  status: RequestStatus
  createdAt: string
  documentType: { name: string }
}

const STATUS_BADGE: Record<RequestStatus, string> = {
  PENDING:    'badge badge-pending',
  PROCESSING: 'badge badge-processing',
  READY:      'badge badge-ready',
  COMPLETED:  'badge badge-completed',
  REJECTED:   'badge badge-rejected',
}

const STATUS_LABEL: Record<RequestStatus, string> = {
  PENDING: 'Pending', PROCESSING: 'Processing', READY: 'Ready',
  COMPLETED: 'Completed', REJECTED: 'Rejected',
}

export default function Dashboard() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [recent, setRecent] = useState<Request[]>([])
  const [recentLoading, setRecentLoading] = useState(true)

  useEffect(() => {
    if (status === 'authenticated') {
      axios.get("/api/student/my-requests")
        .then(res => {
          const all: Request[] = res.data.data || []
          setRecent([...all].reverse().slice(0, 5))
        })
        .catch(() => {})
        .finally(() => setRecentLoading(false))
    }
  }, [status])

  if (!session && status !== 'loading') { router.push("/login"); return null }
  if (status === 'loading') return null

  const firstName = session?.user.name?.split(' ')[0] ?? ''
  const activeCount = recent.filter(r => r.status !== 'COMPLETED' && r.status !== 'REJECTED').length

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto fade-in">

      {/* ── Greeting banner ── */}
      <div className="rounded-2xl p-5 mb-5 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-dark) 100%)' }}>
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='1'%3E%3Cpath d='M20 20.5V18H0v5h5v5H0v5h20v-5h15v-5H20v-.5zm-5 4.5v-4h5v4h-5zM0 5h10v5H0V5zm15 0h10v5H15V5zm15 0h10v5H30V5z'/%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="relative z-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Welcome back
          </p>
          <h1 className="text-2xl font-black text-white mb-3">{firstName}</h1>
          {activeCount > 0 ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ backgroundColor: 'rgba(212,175,55,0.2)', color: 'var(--color-tertiary)', border: '1px solid rgba(212,175,55,0.3)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {activeCount} active request{activeCount > 1 ? 's' : ''}
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
              No active requests
            </div>
          )}
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { href: '/dashboard/request', icon: '📄', label: 'Request', color: 'var(--color-secondary)', bg: 'rgba(128,0,32,0.07)' },
          { href: '/dashboard/queue',   icon: '🔢', label: 'Queue',   color: '#1E40AF',                bg: 'rgba(30,64,175,0.07)' },
          { href: '/dashboard/track',   icon: '📋', label: 'Track',   color: '#065F46',                bg: 'rgba(6,95,70,0.07)'   },
        ].map(c => (
          <Link key={c.href} href={c.href} className="no-underline">
            <div className="action-card flex flex-col items-center text-center p-3 sm:p-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl sm:text-2xl mb-2"
                style={{ backgroundColor: c.bg }}>
                {c.icon}
              </div>
              <span className="text-xs sm:text-sm font-bold" style={{ color: c.color }}>{c.label}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Recent activity ── */}
      <div className="section-card">
        <div className="section-card-header">
          <span className="section-card-title">Recent Activity</span>
          <Link href="/dashboard/track" className="text-xs font-bold no-underline"
            style={{ color: 'var(--color-secondary)' }}>
            View all →
          </Link>
        </div>

        {recentLoading ? (
          <div className="flex justify-center py-8">
            <div className="spinner" />
          </div>
        ) : recent.length === 0 ? (
          <div className="text-center py-10 px-4">
            <div className="text-4xl mb-2">📭</div>
            <p className="text-sm font-semibold" style={{ color: '#6B7280' }}>No requests yet</p>
            <p className="text-xs mt-1 mb-4" style={{ color: '#9CA3AF' }}>Submit your first document request to get started.</p>
            <Link href="/dashboard/request" className="btn btn-primary text-xs px-4 py-2">
              Request a Document
            </Link>
          </div>
        ) : (
          <div>
            {recent.map((req, i) => (
              <div key={req.id}
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: i < recent.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0"
                  style={{ backgroundColor: 'rgba(128,0,32,0.07)', color: 'var(--color-secondary)' }}>
                  #{req.queueNumber}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: '#1F2937' }}>
                    {req.documentType.name}
                  </p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>
                    {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <span className={STATUS_BADGE[req.status]}>{STATUS_LABEL[req.status]}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

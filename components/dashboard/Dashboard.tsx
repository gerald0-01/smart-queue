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

export default function Dashboard() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [recent, setRecent] = useState<Request[]>([])

  useEffect(() => {
    if (status === 'authenticated') {
      axios.get("/api/student/my-requests")
        .then(res => {
          const all: Request[] = res.data.data || []
          // Most recent 5, newest first
          setRecent([...all].reverse().slice(0, 5))
        })
        .catch(() => {})
    }
  }, [status])

  if (!session && status !== 'loading') { router.push("/login"); return null }
  if (status === 'loading') return null

  return (
    <div className="min-h-[calc(100vh-5rem)] px-4 py-8 max-w-3xl mx-auto fade-in">

      {/* Welcome */}
      <div className="mb-8">
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-tertiary)' }}>Welcome back</p>
        <h1 className="text-3xl font-extrabold" style={{ color: 'var(--color-secondary)' }}>
          {session?.user.name}
        </h1>
        <div className="gold-divider mt-2" style={{ margin: '0.5rem 0 0' }} />
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { href: "/dashboard/request", icon: "📄", label: "Request",      desc: "Submit a new document request.", border: 'var(--color-secondary)', bg: 'rgba(128,0,32,0.08)' },
          { href: "/dashboard/queue",   icon: "🔢", label: "Queue Status", desc: "Check your active queue position.", border: 'var(--color-tertiary)', bg: 'rgba(212,175,55,0.1)' },
          { href: "/dashboard/track",   icon: "📋", label: "Track",        desc: "View all your request history.", border: '#6B7280', bg: 'rgba(107,114,128,0.08)' },
        ].map(c => (
          <Link key={c.href} href={c.href} className="no-underline">
            <div className="card p-5 flex flex-col items-center text-center cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1"
              style={{ borderTop: `3px solid ${c.border}` }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-2"
                style={{ backgroundColor: c.bg }}>{c.icon}</div>
              <h3 className="font-bold text-sm mb-0.5" style={{ color: 'var(--color-secondary)' }}>{c.label}</h3>
              <p className="text-xs" style={{ color: '#6B7280' }}>{c.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent activity */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-extrabold text-base" style={{ color: 'var(--color-secondary)' }}>
            Recent Activity
          </h2>
          <Link href="/dashboard/track" className="text-xs font-semibold no-underline hover:underline"
            style={{ color: 'var(--color-secondary)' }}>
            View all →
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-3xl mb-2">📭</div>
            <p className="text-sm" style={{ color: '#9CA3AF' }}>No requests yet. Submit your first one!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recent.map(req => (
              <div key={req.id} className="flex items-center justify-between p-3 rounded-lg"
                style={{ backgroundColor: '#F9FAFB' }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-extrabold flex-shrink-0"
                    style={{ backgroundColor: 'rgba(128,0,32,0.08)', color: 'var(--color-secondary)' }}>
                    #{req.queueNumber}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#374151' }}>{req.documentType.name}</p>
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>
                      {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <span className={STATUS_BADGE[req.status]}>{req.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

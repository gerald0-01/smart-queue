'use client'
import { useSession } from "next-auth/react"
import axios from "axios"
import { useEffect, useState } from "react"
import AdminUsers from "@/components/dashboard/admin/AdminUsers"

interface DashboardData {
  totalUsers: number
  totalRequests: number
  unverifiedStaff: number
  pendingRequests: number
  usersByRole: { role: string; count: number }[]
  requestsByStatus: { status: string; count: number }[]
}

interface RecentRequest {
  id: string; queueNumber: number; status: string; createdAt: string
  documentType: { name: string }
  user: { name: string; idNumber: string }
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:'#92400E', PROCESSING:'#1E40AF', READY:'#065F46', COMPLETED:'#5B21B6', REJECTED:'#991B1B',
}
const STATUS_BADGE: Record<string, string> = {
  PENDING:'badge badge-pending', PROCESSING:'badge badge-processing', READY:'badge badge-ready', COMPLETED:'badge badge-completed', REJECTED:'badge badge-rejected',
}

type AdminTab = 'overview' | 'users'

export default function AdminDashboard() {
  const { data: session } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<AdminTab>('overview')
  const [recent, setRecent] = useState<RecentRequest[]>([])

  const fetchDashboard = async () => {
    setLoading(true)
    setError(null)
    try {
      const [dashRes, actRes] = await Promise.all([
        axios.get("/api/admin/dashboard"),
        axios.get("/api/staff/recent-activity"),
      ])
      setData(dashRes.data.data)
      setRecent(actRes.data.data || [])
    } catch {
      setError("Failed to load dashboard data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDashboard() }, [])

  const statCards = data ? [
    { label: 'Total Users',       value: data.totalUsers,      icon: '👥', color: 'var(--color-secondary)' },
    { label: 'Total Requests',    value: data.totalRequests,   icon: '📄', color: '#1E40AF' },
    { label: 'Pending Requests',  value: data.pendingRequests, icon: '⏳', color: '#92400E' },
    { label: 'Unverified Staff',  value: data.unverifiedStaff, icon: '⚠',  color: data.unverifiedStaff > 0 ? '#991B1B' : '#065F46' },
  ] : []

  return (
    <div className="min-h-[calc(100vh-5rem)] px-3 sm:px-4 py-6 sm:py-8 max-w-6xl mx-auto fade-in">

      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-tertiary)' }}>Admin Portal</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ color: 'var(--color-secondary)' }}>Admin Dashboard</h1>
          <div className="gold-divider mt-2" style={{ margin: '0.5rem 0 0' }} />
          <p className="text-sm mt-2" style={{ color: '#6B7280' }}>
            Welcome, {session?.user.name}
          </p>
        </div>
        <button onClick={fetchDashboard} className="btn btn-outline text-xs px-3 py-1.5 w-full sm:w-auto">
          ↻ Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit"
        style={{ backgroundColor: '#F3F4F6' }}>
        {(['overview', 'users'] as AdminTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 sm:px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all whitespace-nowrap"
            style={{
              backgroundColor: tab === t ? '#fff' : 'transparent',
              color: tab === t ? 'var(--color-secondary)' : '#6B7280',
              boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              border: 'none', cursor: 'pointer',
            }}>
            {t === 'overview' ? '📊 Overview' : '👥 Users'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          {loading && (
            <div className="flex justify-center py-16">
              <div className="spinner" style={{ width: '2.5rem', height: '2.5rem', borderWidth: '4px' }} />
            </div>
          )}

          {error && (
            <div className="card p-6 text-center" style={{ color: '#991B1B' }}>{error}</div>
          )}

          {data && (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                {statCards.map(s => (
                  <div key={s.label} className="card p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <span className="text-xl sm:text-2xl">{s.icon}</span>
                      <span className="text-2xl sm:text-3xl font-extrabold" style={{ color: s.color }}>{s.value}</span>
                    </div>
                    <p className="text-sm font-semibold" style={{ color: '#6B7280' }}>{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Requests by status */}
                <div className="card p-6">
                  <h2 className="font-extrabold text-base mb-4" style={{ color: 'var(--color-secondary)' }}>
                    Requests by Status
                  </h2>
                  <div className="flex flex-col gap-3">
                    {['PENDING','PROCESSING','READY','COMPLETED','REJECTED'].map(s => {
                      const entry = data.requestsByStatus.find(r => r.status === s)
                      const count = entry?.count ?? 0
                      const max = Math.max(...data.requestsByStatus.map(r => r.count), 1)
                      const pct = Math.round((count / max) * 100)
                      return (
                        <div key={s}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold" style={{ color: STATUS_COLORS[s] ?? '#6B7280' }}>
                              {s.charAt(0) + s.slice(1).toLowerCase()}
                            </span>
                            <span className="text-xs font-bold" style={{ color: '#374151' }}>{count}</span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#F3F4F6' }}>
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, backgroundColor: STATUS_COLORS[s] ?? '#6B7280' }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Users by role */}
                <div className="card p-6">
                  <h2 className="font-extrabold text-base mb-4" style={{ color: 'var(--color-secondary)' }}>
                    Users by Role
                  </h2>
                  <div className="flex flex-col gap-3">
                    {data.usersByRole.map(r => (
                      <div key={r.role} className="flex items-center justify-between p-3 rounded-lg"
                        style={{ backgroundColor: '#F9FAFB' }}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-secondary)' }} />
                          <span className="text-sm font-semibold" style={{ color: '#374151' }}>
                            {r.role.charAt(0) + r.role.slice(1).toLowerCase()}
                          </span>
                        </div>
                        <span className="text-sm font-extrabold" style={{ color: 'var(--color-secondary)' }}>
                          {r.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent activity */}
              {recent.length > 0 && (
                <div className="card p-6 mt-6">
                  <h2 className="font-extrabold text-base mb-4" style={{ color: 'var(--color-secondary)' }}>Recent Activity</h2>
                  <div className="flex flex-col gap-2">
                    {recent.map(req => (
                      <div key={req.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#F9FAFB' }}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-extrabold flex-shrink-0"
                            style={{ backgroundColor: 'rgba(128,0,32,0.08)', color: 'var(--color-secondary)' }}>
                            #{req.queueNumber}
                          </div>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: '#374151' }}>{req.user.name} — {req.documentType.name}</p>
                            <p className="text-xs" style={{ color: '#9CA3AF' }}>
                              {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <span className={STATUS_BADGE[req.status] ?? 'badge'}>{req.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {tab === 'users' && <AdminUsers />}
    </div>
  )
}

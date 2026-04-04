'use client'
import { useSession } from "next-auth/react"
import axios from "axios"
import { useEffect, useState } from "react"
import AdminUsers from "@/components/dashboard/admin/AdminUsers"

type RequestStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'REJECTED'

interface Request {
  id: string; queueNumber: number; status: RequestStatus; purpose: string
  notes?: string; message?: string; availablePickUp?: string
  createdAt: string; processedAt?: string
  documentType: { name: string }
  user: { name: string; idNumber: string; college?: string; course?: string }
}

interface ReportData {
  date: string
  summary: { total: number; pending: number; processing: number; ready: number; completed: number; rejected: number }
  requests: Request[]
}

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

type AdminTab = 'overview' | 'analytics' | 'users'

export default function AdminDashboard() {
  const { data: session } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<AdminTab>('overview')
  const [recent, setRecent] = useState<RecentRequest[]>([])
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10))
  const [report, setReport] = useState<ReportData | null>(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)

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

  const fetchReport = async (date: string) => {
    setReportLoading(true); setReportError(null)
    try { const r = await axios.get(`/api/staff/report?date=${date}`); setReport(r.data.data) }
    catch { setReportError("Failed to load analytics.") }
    finally { setReportLoading(false) }
  }

  useEffect(() => { fetchDashboard() }, [])
  useEffect(() => { if (tab === 'analytics') fetchReport(reportDate) }, [tab, reportDate])

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
        {(['overview', 'analytics', 'users'] as AdminTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 sm:px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all whitespace-nowrap"
            style={{
              backgroundColor: tab === t ? '#fff' : 'transparent',
              color: tab === t ? 'var(--color-secondary)' : '#6B7280',
              boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              border: 'none', cursor: 'pointer',
            }}>
            {t === 'overview' ? '📊 Overview' : t === 'analytics' ? '📈 Analytics' : '👥 Users'}
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

      {tab === 'analytics' && (
        <div style={{ backgroundColor: '#fff', padding: '0.5rem' }}>
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color:'#374151' }}>Report Date</label>
              <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)}
                style={{ padding:'0.5rem 0.75rem', border:'1.5px solid var(--color-border)', borderRadius:'8px', fontSize:'0.9rem', outline:'none' }} />
            </div>
          </div>

          {reportLoading && <div className="flex justify-center py-16"><div className="spinner" style={{ width:'2.5rem', height:'2.5rem', borderWidth:'4px' }} /></div>}
          {reportError && <div className="card p-6 text-center" style={{ color: '#991B1B' }}>{reportError}</div>}

          {report && !reportLoading && (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
                {([
                  ['total',      report.summary.total,      '#800020', '📋'],
                  ['pending',    report.summary.pending,    '#92400E', '⏳'],
                  ['processing', report.summary.processing, '#1E40AF', '⚙️'],
                  ['ready',      report.summary.ready,      '#065F46', '✅'],
                  ['completed',  report.summary.completed,  '#5B21B6', '🎉'],
                  ['rejected',   report.summary.rejected,   '#991B1B', '✕'],
                ] as [string, number, string, string][]).map(([k, v, c, icon]) => (
                  <div key={k} className="stat-card text-center">
                    <div className="text-lg mb-1">{icon}</div>
                    <div className="text-2xl font-black" style={{ color: c }}>{v}</div>
                    <div className="text-xs font-semibold capitalize mt-0.5" style={{ color:'#6B7280' }}>{k}</div>
                  </div>
                ))}
              </div>

              <div className="card p-6 mb-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-black text-base" style={{ color:'var(--color-secondary)' }}>Status Breakdown</h2>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full"
                    style={{ backgroundColor:'rgba(128,0,32,0.07)', color:'var(--color-secondary)' }}>
                    {report.summary.total} total
                  </span>
                </div>
                <div className="flex flex-col gap-4">
                  {(['PENDING','PROCESSING','READY','COMPLETED','REJECTED'] as const).map(s => {
                    const count = report.requests.filter(r => r.status === s).length
                    const pct = report.summary.total > 0 ? Math.round((count / report.summary.total) * 100) : 0
                    return (
                      <div key={s}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[s] }} />
                            <span className="text-xs font-bold" style={{ color: STATUS_COLORS[s] }}>{s.charAt(0) + s.slice(1).toLowerCase()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black" style={{ color:'#374151' }}>{count}</span>
                            <span className="text-xs" style={{ color:'#9CA3AF' }}>({pct}%)</span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#F3F4F6' }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: STATUS_COLORS[s] }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {report.requests.length > 0 && (() => {
                const collegeMap: Record<string, number> = {}
                const courseMap: Record<string, number> = {}
                for (const r of report.requests) {
                  const col = r.user.college || 'N/A'
                  const crs = r.user.course  || 'N/A'
                  collegeMap[col] = (collegeMap[col] ?? 0) + 1
                  courseMap[crs]  = (courseMap[crs]  ?? 0) + 1
                }
                const colleges = Object.entries(collegeMap).sort((a,b) => b[1]-a[1])
                const courses  = Object.entries(courseMap).sort((a,b) => b[1]-a[1]).slice(0, 10)
                const maxCol = colleges[0]?.[1] ?? 1
                const maxCrs = courses[0]?.[1] ?? 1
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                    <div className="card p-6">
                      <h2 className="font-black text-base mb-4" style={{ color:'var(--color-secondary)' }}>By College</h2>
                      <div className="flex flex-col gap-3">
                        {colleges.map(([col, cnt]) => (
                          <div key={col}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-bold" style={{ color:'#374151' }}>{col}</span>
                              <span className="text-xs font-black" style={{ color:'var(--color-secondary)' }}>{cnt}</span>
                            </div>
                            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#F3F4F6' }}>
                              <div className="h-full rounded-full" style={{ width:`${Math.round((cnt/maxCol)*100)}%`, background:'linear-gradient(90deg, var(--color-secondary), var(--color-dark))' }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="card p-6">
                      <h2 className="font-black text-base mb-4" style={{ color:'var(--color-secondary)' }}>
                        By Course <span className="text-xs font-normal" style={{ color:'#9CA3AF' }}>(top 10)</span>
                      </h2>
                      <div className="flex flex-col gap-3">
                        {courses.map(([crs, cnt]) => (
                          <div key={crs}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-bold" style={{ color:'#374151' }}>{crs}</span>
                              <span className="text-xs font-black" style={{ color:'var(--color-secondary)' }}>{cnt}</span>
                            </div>
                            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#F3F4F6' }}>
                              <div className="h-full rounded-full" style={{ width:`${Math.round((cnt/maxCrs)*100)}%`, background:'linear-gradient(90deg, var(--color-tertiary), var(--color-highlighted))' }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })()}

              {report.requests.length === 0 ? (
                <div className="card p-12 text-center"><div className="text-4xl mb-3">📭</div><p className="font-semibold" style={{ color:'#6B7280' }}>No requests for this date.</p></div>
              ) : (
                <div className="card overflow-hidden">
                  <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom:'1px solid var(--color-border)' }}>
                    <h2 className="font-extrabold text-sm" style={{ color:'var(--color-secondary)' }}>
                      Requests — {new Date(report.date).toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
                    </h2>
                    <span className="text-xs" style={{ color:'#9CA3AF' }}>{report.requests.length} total</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ backgroundColor:'rgba(128,0,32,0.05)', borderBottom:'1px solid var(--color-border)' }}>
                          {['Queue #','Student','ID','College','Course','Document','Purpose','Status','Time'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide" style={{ color:'var(--color-secondary)' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {report.requests.map((req, i) => (
                          <tr key={req.id} style={{ borderBottom:'1px solid var(--color-border)', backgroundColor: i%2===0?'#fff':'rgba(0,0,0,0.01)' }}>
                            <td className="px-4 py-3 font-bold" style={{ color:'var(--color-secondary)' }}>#{req.queueNumber}</td>
                            <td className="px-4 py-3 font-semibold">{req.user.name}</td>
                            <td className="px-4 py-3 font-mono text-xs">{req.user.idNumber}</td>
                            <td className="px-4 py-3 text-xs">{req.user.college ?? '—'}</td>
                            <td className="px-4 py-3 text-xs">{req.user.course ?? '—'}</td>
                            <td className="px-4 py-3">{req.documentType.name}</td>
                            <td className="px-4 py-3 max-w-xs truncate" style={{ color:'#6B7280' }}>{req.purpose}</td>
                            <td className="px-4 py-3"><span className={STATUS_BADGE[req.status] ?? 'badge'}>{req.status}</span></td>
                            <td className="px-4 py-3 text-xs" style={{ color:'#9CA3AF' }}>{new Date(req.createdAt).toLocaleTimeString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'users' && <AdminUsers />}
    </div>
  )
}

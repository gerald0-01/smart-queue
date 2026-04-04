'use client'
import ErrorCard from "@/components/ErrorCard"
import axios from "axios"
import { useEffect, useState } from "react"

type RequestStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'REJECTED'

interface Request {
  id: string; queueNumber: number; status: RequestStatus
  purpose: string; message?: string; availablePickUp?: string
  documentType: { name: string }
}

interface QueueInfo { id: string; queueNumber: number; status: string; ahead: number }

const STATUS_STEPS: RequestStatus[] = ['PENDING', 'PROCESSING', 'READY', 'COMPLETED']

const STATUS_INFO: Record<RequestStatus, { label: string; color: string; bg: string; icon: string }> = {
  PENDING:    { label: 'Waiting',    color: '#92400E', bg: '#FEF3C7', icon: '⏳' },
  PROCESSING: { label: 'Processing', color: '#1E40AF', bg: '#DBEAFE', icon: '⚙️' },
  READY:      { label: 'Ready',      color: '#065F46', bg: '#D1FAE5', icon: '✅' },
  COMPLETED:  { label: 'Completed',  color: '#5B21B6', bg: '#EDE9FE', icon: '🎉' },
  REJECTED:   { label: 'Rejected',   color: '#991B1B', bg: '#FEE2E2', icon: '✕'  },
}

export default function QueueStatus() {
  const [requests, setRequests] = useState<Request[]>([])
  const [queueInfoMap, setQueueInfoMap] = useState<Record<string, QueueInfo>>({})
  const [nowServing, setNowServing] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true); setError(null)
    try {
      const [reqRes, queueRes] = await Promise.all([
        axios.get("/api/student/my-requests"),
        axios.get("/api/student/queue-info"),
      ])
      setRequests(reqRes.data.data || [])
      setNowServing(queueRes.data.data.nowServing)
      const map: Record<string, QueueInfo> = {}
      for (const item of queueRes.data.data.requests as QueueInfo[]) map[item.id] = item
      setQueueInfoMap(map)
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load queue status.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const active = requests.filter(r => r.status !== 'COMPLETED' && r.status !== 'REJECTED')
  const stepIndex = (s: RequestStatus) => STATUS_STEPS.indexOf(s)

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto fade-in">
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="page-header-label">Student Portal</p>
          <h1 className="page-header-title">Queue Status</h1>
        </div>
        <button onClick={fetchData} className="btn btn-outline text-xs px-3 py-1.5 mt-1 flex-shrink-0">
          ↻ Refresh
        </button>
      </div>

      {/* Now Serving hero */}
      <div className="rounded-2xl overflow-hidden mb-5"
        style={{ background: 'linear-gradient(135deg, var(--color-secondary), var(--color-dark))' }}>
        <div className="px-5 py-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1"
              style={{ color: 'rgba(255,255,255,0.5)' }}>Now Serving</p>
            <div className="text-5xl font-black" style={{ color: 'var(--color-tertiary)', letterSpacing: '-2px' }}>
              {nowServing !== null ? String(nowServing).padStart(3, '0') : '—'}
            </div>
          </div>
          <div className="text-5xl opacity-15 select-none">🎫</div>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-10">
          <div className="spinner" style={{ width:'2.5rem', height:'2.5rem', borderWidth:'4px' }} />
        </div>
      )}
      {error && <ErrorCard message={error} onRetry={fetchData} />}

      {!loading && !error && active.length === 0 && (
        <div className="section-card p-10 text-center">
          <div className="text-4xl mb-3">🎉</div>
          <p className="font-bold text-sm" style={{ color: '#6B7280' }}>No active requests.</p>
          <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>All done or nothing submitted yet.</p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {active.map(req => {
          const info = STATUS_INFO[req.status]
          const step = stepIndex(req.status)
          const qi = queueInfoMap[req.id]
          const ahead = qi?.ahead ?? null
          const showStats = req.status === 'PENDING' || req.status === 'PROCESSING'

          return (
            <div key={req.id} className="section-card overflow-hidden">
              {/* Status banner */}
              <div className="px-4 py-4 flex items-center justify-between" style={{ backgroundColor: info.bg }}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{info.icon}</span>
                  <div>
                    <p className="font-black text-base" style={{ color: info.color }}>{info.label}</p>
                    <p className="text-xs font-medium" style={{ color: info.color, opacity: 0.7 }}>
                      {req.documentType.name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase tracking-wide mb-0.5"
                    style={{ color: info.color, opacity: 0.6 }}>Your #</p>
                  <div className="text-3xl font-black" style={{ color: info.color, letterSpacing: '-1px' }}>
                    {String(req.queueNumber).padStart(3, '0')}
                  </div>
                </div>
              </div>

              {/* Stats row */}
              {showStats && (
                <div className="grid grid-cols-3 text-center"
                  style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {[
                    { label: 'Now Serving', value: nowServing !== null ? String(nowServing).padStart(3,'0') : '—', green: false },
                    { label: 'Your Number', value: String(req.queueNumber).padStart(3,'0'), green: false },
                    { label: 'Ahead',       value: ahead !== null ? String(ahead) : '—', green: ahead === 0 },
                  ].map((s, idx) => (
                    <div key={s.label} className="py-3 px-2"
                      style={{ borderRight: idx < 2 ? '1px solid var(--color-border)' : 'none' }}>
                      <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#9CA3AF' }}>
                        {s.label}
                      </p>
                      <p className="text-xl font-black"
                        style={{ color: s.green ? '#065F46' : 'var(--color-secondary)' }}>
                        {s.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Progress + details */}
              <div className="px-4 py-4">
                <div className="flex items-center mb-4">
                  {STATUS_STEPS.map((s, i) => (
                    <div key={s} className="flex items-center flex-1 min-w-0">
                      <div className="flex flex-col items-center flex-1 min-w-0">
                        <div className={`stepper-dot ${i < step ? 'stepper-dot-done' : i === step ? 'stepper-dot-active' : 'stepper-dot-inactive'}`}>
                          {i < step ? '✓' : i + 1}
                        </div>
                        <span className="text-xs mt-1 font-semibold truncate max-w-full"
                          style={{ color: i <= step ? 'var(--color-secondary)' : '#9CA3AF' }}>
                          {s.charAt(0) + s.slice(1).toLowerCase()}
                        </span>
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div className="stepper-line"
                          style={{ backgroundColor: i < step ? 'var(--color-secondary)' : '#E5E7EB' }} />
                      )}
                    </div>
                  ))}
                </div>

                <p className="text-sm" style={{ color: '#6B7280' }}>
                  <span className="font-semibold" style={{ color: '#374151' }}>Purpose: </span>
                  {req.purpose}
                </p>

                {req.message && (
                  <div className="p-3 rounded-xl mt-3"
                    style={{ backgroundColor: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)' }}>
                    <p className="text-xs font-bold uppercase tracking-wide mb-1"
                      style={{ color: 'var(--color-highlighted)' }}>Staff Message</p>
                    <p className="text-sm" style={{ color: '#374151' }}>{req.message}</p>
                  </div>
                )}

                {req.availablePickUp && (
                  <div className="flex items-center gap-2 p-3 rounded-xl mt-3"
                    style={{ backgroundColor: '#F0FDF4', color: '#065F46' }}>
                    <span>📅</span>
                    <span className="text-sm">
                      <span className="font-semibold">Pick-up: </span>
                      {new Date(req.availablePickUp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

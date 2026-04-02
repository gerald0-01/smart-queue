'use client'
import ErrorCard from "@/components/ErrorCard"
import axios from "axios"
import { useEffect, useState } from "react"

type RequestStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'REJECTED'

interface Request {
  id: string
  queueNumber: number
  status: RequestStatus
  purpose: string
  notes?: string
  message?: string
  availablePickUp?: string
  createdAt: string
  documentType: { name: string }
}

interface QueueInfo {
  id: string
  queueNumber: number
  status: string
  ahead: number
}

const STATUS_STEPS: RequestStatus[] = ['PENDING', 'PROCESSING', 'READY', 'COMPLETED']

const STATUS_INFO: Record<RequestStatus, { label: string; color: string; bg: string; icon: string; desc: string }> = {
  PENDING:    { label: 'Waiting',    color: '#92400E', bg: '#FEF3C7', icon: '⏳', desc: 'Your request is in the queue.' },
  PROCESSING: { label: 'Processing', color: '#1E40AF', bg: '#DBEAFE', icon: '⚙️', desc: 'Staff is processing your request.' },
  READY:      { label: 'Ready',      color: '#065F46', bg: '#D1FAE5', icon: '✅', desc: 'Your document is ready for pickup!' },
  COMPLETED:  { label: 'Completed',  color: '#5B21B6', bg: '#EDE9FE', icon: '🎉', desc: 'Your request has been completed.' },
  REJECTED:   { label: 'Rejected',   color: '#991B1B', bg: '#FEE2E2', icon: '✕',  desc: 'Your request was rejected.' },
}

export default function QueueStatus() {
  const [requests, setRequests] = useState<Request[]>([])
  const [queueInfoMap, setQueueInfoMap] = useState<Record<string, QueueInfo>>({})
  const [nowServing, setNowServing] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [reqRes, queueRes] = await Promise.all([
        axios.get("/api/student/my-requests"),
        axios.get("/api/student/queue-info"),
      ])
      setRequests(reqRes.data.data || [])
      setNowServing(queueRes.data.data.nowServing)
      const map: Record<string, QueueInfo> = {}
      for (const item of queueRes.data.data.requests as QueueInfo[]) {
        map[item.id] = item
      }
      setQueueInfoMap(map)
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load queue status.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // Poll every 30s for live updates
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const active = requests.filter(r => r.status !== 'COMPLETED' && r.status !== 'REJECTED')

  return (
    <div className="flex items-start justify-center min-h-[calc(100vh-5rem)] px-4 py-8 fade-in">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-tertiary)' }}>Student Portal</p>
            <h1 className="text-2xl font-extrabold" style={{ color: 'var(--color-secondary)' }}>Queue Status</h1>
            <div className="gold-divider mt-2" style={{ margin: '0.5rem 0 0' }} />
          </div>
          <button onClick={fetchData}
            className="btn btn-outline text-xs px-3 py-1.5 mt-1"
            title="Refresh">
            ↻ Refresh
          </button>
        </div>

        {/* Now Serving banner */}
        <div className="card mb-6 overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg, var(--color-secondary), var(--color-dark))' }}>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Now Serving
              </p>
              <div className="text-5xl font-extrabold" style={{ color: 'var(--color-tertiary)', letterSpacing: '-1px' }}>
                {nowServing !== null
                  ? String(nowServing).padStart(3, '0')
                  : <span className="text-2xl" style={{ color: 'rgba(255,255,255,0.5)' }}>—</span>}
              </div>
            </div>
            <div className="text-5xl opacity-20 select-none">🎫</div>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="spinner" style={{ width: '2.5rem', height: '2.5rem', borderWidth: '4px' }} />
          </div>
        )}

        {error && <ErrorCard message={error} onRetry={fetchData} />}

        {!loading && !error && active.length === 0 && (
          <div className="card p-12 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <p className="font-semibold" style={{ color: '#6B7280' }}>No active requests.</p>
            <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>
              All your requests are completed or you haven&apos;t submitted any yet.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-5">
          {active.map(req => {
            const info = STATUS_INFO[req.status]
            const stepIdx = STATUS_STEPS.indexOf(req.status)
            const qi = queueInfoMap[req.id]
            const ahead = qi?.ahead ?? null
            const isPending = req.status === 'PENDING'
            const isProcessing = req.status === 'PROCESSING'

            return (
              <div key={req.id} className="card overflow-hidden">

                {/* Top status bar */}
                <div className="px-6 py-4 flex items-center justify-between"
                  style={{ backgroundColor: info.bg }}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{info.icon}</span>
                    <div>
                      <p className="font-extrabold text-base" style={{ color: info.color }}>{info.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: info.color, opacity: 0.75 }}>{info.desc}</p>
                    </div>
                  </div>
                  {/* Queue number badge */}
                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: info.color, opacity: 0.7 }}>
                      Your Number
                    </p>
                    <div className="text-3xl font-extrabold" style={{ color: info.color }}>
                      {String(req.queueNumber).padStart(3, '0')}
                    </div>
                  </div>
                </div>

                {/* Queue stats row */}
                {(isPending || isProcessing) && (
                  <div className="grid grid-cols-3 divide-x divide-gray-200"
                    style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <div className="px-4 py-3 text-center">
                      <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#9CA3AF' }}>
                        Now Serving
                      </p>
                      <p className="text-xl font-extrabold" style={{ color: 'var(--color-secondary)' }}>
                        {nowServing !== null ? String(nowServing).padStart(3, '0') : '—'}
                      </p>
                    </div>
                    <div className="px-4 py-3 text-center">
                      <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#9CA3AF' }}>
                        Your Number
                      </p>
                      <p className="text-xl font-extrabold" style={{ color: 'var(--color-secondary)' }}>
                        {String(req.queueNumber).padStart(3, '0')}
                      </p>
                    </div>
                    <div className="px-4 py-3 text-center">
                      <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#9CA3AF' }}>
                        People Ahead
                      </p>
                      <p className="text-xl font-extrabold"
                        style={{ color: ahead === 0 ? '#065F46' : 'var(--color-secondary)' }}>
                        {ahead !== null ? ahead : '—'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Details */}
                <div className="px-6 py-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-bold" style={{ color: 'var(--color-secondary)' }}>{req.documentType.name}</p>
                      <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>{req.purpose}</p>
                    </div>
                    <p className="text-xs flex-shrink-0 ml-3" style={{ color: '#9CA3AF' }}>
                      {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>

                  {/* Progress stepper */}
                  <div className="flex items-center mb-4">
                    {STATUS_STEPS.map((step, i) => (
                      <div key={step} className="flex items-center flex-1">
                        <div className="flex flex-col items-center flex-1">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                            style={{
                              backgroundColor: i <= stepIdx ? 'var(--color-secondary)' : '#E5E7EB',
                              color: i <= stepIdx ? '#fff' : '#9CA3AF',
                              boxShadow: i === stepIdx ? '0 0 0 3px rgba(128,0,32,0.2)' : 'none',
                            }}>
                            {i < stepIdx ? '✓' : i + 1}
                          </div>
                          <span className="text-xs mt-1 font-medium"
                            style={{ color: i <= stepIdx ? 'var(--color-secondary)' : '#9CA3AF' }}>
                            {step.charAt(0) + step.slice(1).toLowerCase()}
                          </span>
                        </div>
                        {i < STATUS_STEPS.length - 1 && (
                          <div className="h-0.5 flex-1 mb-4 transition-all"
                            style={{ backgroundColor: i < stepIdx ? 'var(--color-secondary)' : '#E5E7EB' }} />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Staff message */}
                  {req.message && (
                    <div className="p-3 rounded-lg mb-3"
                      style={{ backgroundColor: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)' }}>
                      <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--color-highlighted)' }}>
                        Staff Message
                      </p>
                      <p className="text-sm" style={{ color: '#374151' }}>{req.message}</p>
                    </div>
                  )}

                  {/* Pickup date */}
                  {req.availablePickUp && (
                    <div className="flex items-center gap-2 p-3 rounded-lg"
                      style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>
                      <span>📅</span>
                      <div>
                        <span className="font-semibold text-sm">Available for pick-up: </span>
                        <span className="text-sm">
                          {new Date(req.availablePickUp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

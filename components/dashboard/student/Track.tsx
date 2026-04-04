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

const STATUS_BADGE: Record<RequestStatus, string> = {
  PENDING:    'badge badge-pending',
  PROCESSING: 'badge badge-processing',
  READY:      'badge badge-ready',
  COMPLETED:  'badge badge-completed',
  REJECTED:   'badge badge-rejected',
}

const STATUS_STEPS: RequestStatus[] = ['PENDING', 'PROCESSING', 'READY', 'COMPLETED']

export default function Track() {
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [tab, setTab] = useState<'active' | 'completed'>('active')

  const fetchData = async () => {
    setLoading(true); setError(null)
    try {
      const res = await axios.get("/api/student/my-requests")
      setRequests(res.data.data || [])
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load requests.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const active    = requests.filter(r => r.status !== 'COMPLETED' && r.status !== 'REJECTED')
  const completed = requests.filter(r => r.status === 'COMPLETED' || r.status === 'REJECTED')
  const shown     = tab === 'active' ? active : completed
  const stepIndex = (s: RequestStatus) => STATUS_STEPS.indexOf(s)

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto fade-in">
      <div className="page-header">
        <p className="page-header-label">Student Portal</p>
        <h1 className="page-header-title">My Requests</h1>
      </div>

      {/* Tabs */}
      <div className="tab-bar mb-4">
        <button className={`tab-btn ${tab === 'active' ? 'tab-btn-active' : 'tab-btn-inactive'}`}
          onClick={() => setTab('active')}>
          Active ({active.length})
        </button>
        <button className={`tab-btn ${tab === 'completed' ? 'tab-btn-active' : 'tab-btn-inactive'}`}
          onClick={() => setTab('completed')}>
          History ({completed.length})
        </button>
      </div>

      {loading && <div className="flex justify-center py-12"><div className="spinner" style={{ width:'2.5rem', height:'2.5rem', borderWidth:'4px' }} /></div>}
      {error && <ErrorCard message={error} onRetry={fetchData} />}

      {!loading && !error && shown.length === 0 && (
        <div className="section-card p-10 text-center">
          <div className="text-4xl mb-3">{tab === 'active' ? '📭' : '🗂️'}</div>
          <p className="font-bold text-sm" style={{ color: '#6B7280' }}>
            {tab === 'active' ? 'No active requests.' : 'No completed requests yet.'}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {shown.map(req => {
          const isOpen = expanded === req.id
          const rejected = req.status === 'REJECTED'
          const step = rejected ? -1 : stepIndex(req.status)

          return (
            <div key={req.id} className="section-card">
              {/* Card header — always visible */}
              <button onClick={() => setExpanded(isOpen ? null : req.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0"
                  style={{ backgroundColor: 'rgba(128,0,32,0.07)', color: 'var(--color-secondary)' }}>
                  #{req.queueNumber}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: '#1F2937' }}>
                    {req.documentType.name}
                  </p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>
                    {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={STATUS_BADGE[req.status]}>{req.status}</span>
                  <span className="text-xs" style={{ color: '#D1D5DB' }}>{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>

              {/* Expanded details */}
              {isOpen && (
                <div className="px-4 pb-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  {/* Stepper */}
                  {!rejected && (
                    <div className="flex items-center pt-4 pb-2">
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
                  )}

                  {rejected && (
                    <div className="flex items-center gap-2 p-3 rounded-xl my-3 text-sm font-semibold"
                      style={{ backgroundColor: '#FEF2F2', color: '#991B1B' }}>
                      ✕ This request was rejected.
                    </div>
                  )}

                  <div className="flex flex-col gap-2 text-sm mt-2">
                    <p><span className="font-semibold" style={{ color: '#374151' }}>Purpose: </span>
                      <span style={{ color: '#6B7280' }}>{req.purpose}</span></p>
                    {req.notes && (
                      <p><span className="font-semibold" style={{ color: '#374151' }}>Notes: </span>
                        <span style={{ color: '#6B7280' }}>{req.notes}</span></p>
                    )}
                    {req.message && (
                      <div className="p-3 rounded-xl mt-1"
                        style={{ backgroundColor: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)' }}>
                        <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--color-highlighted)' }}>
                          Staff Message
                        </p>
                        <p style={{ color: '#374151' }}>{req.message}</p>
                      </div>
                    )}
                    {req.availablePickUp && (
                      <div className="flex items-center gap-2 p-3 rounded-xl mt-1"
                        style={{ backgroundColor: '#F0FDF4', color: '#065F46' }}>
                        <span>📅</span>
                        <span><span className="font-semibold">Pick-up: </span>
                          {new Date(req.availablePickUp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

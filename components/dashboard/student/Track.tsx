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
    setLoading(true)
    setError(null)
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

  const stepIndex = (status: RequestStatus) => STATUS_STEPS.indexOf(status)

  const RequestCard = ({ req }: { req: Request }) => {
    const isOpen   = expanded === req.id
    const rejected = req.status === 'REJECTED'
    const currentStep = rejected ? -1 : stepIndex(req.status)

    return (
      <div className="card overflow-hidden">
        <button
          onClick={() => setExpanded(isOpen ? null : req.id)}
          className="w-full flex items-center justify-between p-5 text-left"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center font-extrabold text-sm flex-shrink-0"
              style={{ backgroundColor: 'rgba(128,0,32,0.08)', color: 'var(--color-secondary)' }}>
              #{req.queueNumber}
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: 'var(--color-secondary)' }}>
                {req.documentType.name}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                {new Date(req.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={STATUS_BADGE[req.status]}>{req.status}</span>
            <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>{isOpen ? '▲' : '▼'}</span>
          </div>
        </button>

        {isOpen && (
          <div className="px-5 pb-5 border-t" style={{ borderColor: 'var(--color-border)' }}>
            {/* Stepper — only for non-rejected */}
            {!rejected && (
              <div className="flex items-center my-3 sm:my-4 overflow-x-auto -mx-2 px-2">
                {STATUS_STEPS.map((step, i) => (
                  <div key={step} className="flex items-center flex-1 min-w-0">
                    <div className="flex flex-col items-center flex-1 min-w-0">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                        style={{
                          backgroundColor: i <= currentStep ? 'var(--color-secondary)' : '#E5E7EB',
                          color: i <= currentStep ? '#fff' : '#9CA3AF',
                        }}>
                        {i < currentStep ? '✓' : i + 1}
                      </div>
                      <span className="text-xs mt-1 font-medium text-center truncate max-w-full"
                        style={{ color: i <= currentStep ? 'var(--color-secondary)' : '#9CA3AF' }}>
                        {step.charAt(0) + step.slice(1).toLowerCase()}
                      </span>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className="h-0.5 flex-1 mb-4 transition-all min-w-4 sm:min-w-0"
                        style={{ backgroundColor: i < currentStep ? 'var(--color-secondary)' : '#E5E7EB' }} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {rejected && (
              <div className="flex items-center gap-2 p-3 rounded-lg my-3 text-sm font-medium"
                style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                ✕ This request was rejected.
              </div>
            )}

            <div className="flex flex-col gap-2 text-sm">
              <div>
                <span className="font-semibold" style={{ color: '#374151' }}>Purpose: </span>
                <span style={{ color: '#6B7280' }}>{req.purpose}</span>
              </div>
              {req.notes && (
                <div>
                  <span className="font-semibold" style={{ color: '#374151' }}>Notes: </span>
                  <span style={{ color: '#6B7280' }}>{req.notes}</span>
                </div>
              )}
              {req.message && (
                <div className="p-3 rounded-lg mt-1"
                  style={{ backgroundColor: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)' }}>
                  <span className="font-semibold text-xs uppercase tracking-wide"
                    style={{ color: 'var(--color-highlighted)' }}>Staff message: </span>
                  <p className="mt-0.5" style={{ color: '#374151' }}>{req.message}</p>
                </div>
              )}
              {req.availablePickUp && (
                <div className="flex items-center gap-2 p-3 rounded-lg mt-1"
                  style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>
                  <span>📅</span>
                  <span className="font-semibold">Available for pick-up: </span>
                  {new Date(req.availablePickUp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-start justify-center min-h-[calc(100vh-5rem)] px-3 sm:px-4 py-6 sm:py-8 fade-in">
      <div className="w-full max-w-2xl">
        <div className="mb-5 sm:mb-6">
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-tertiary)' }}>Student Portal</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ color: 'var(--color-secondary)' }}>My Requests</h1>
          <div className="gold-divider mt-2" style={{ margin: '0.5rem 0 0' }} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-4 sm:mb-5"
          style={{ backgroundColor: '#F3F4F6' }}>
          {(['active', 'completed'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                backgroundColor: tab === t ? '#fff' : 'transparent',
                color: tab === t ? 'var(--color-secondary)' : '#6B7280',
                boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                border: 'none',
                cursor: 'pointer',
              }}>
              {t === 'active' ? `Active (${active.length})` : `History (${completed.length})`}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-12 sm:py-16">
            <div className="spinner" style={{ width: '2.5rem', height: '2.5rem', borderWidth: '4px' }} />
          </div>
        )}

        {error && <ErrorCard message={error} onRetry={fetchData} />}

        {!loading && !error && shown.length === 0 && (
          <div className="card p-8 sm:p-12 text-center">
            <div className="text-4xl mb-3">{tab === 'active' ? '📭' : '🗂️'}</div>
            <p className="font-semibold text-sm sm:text-base" style={{ color: '#6B7280' }}>
              {tab === 'active' ? 'No active requests.' : 'No completed requests yet.'}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {shown.map(req => <RequestCard key={req.id} req={req} />)}
        </div>
      </div>
    </div>
  )
}

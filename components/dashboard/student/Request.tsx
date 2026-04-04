'use client'
import { requestInitialState, requestReducer } from "@/reducers/request"
import Link from "next/link"
import axios from "axios"
import { useReducer, useState } from "react"

const documents = [
  "Certificate of Grades",
  "Certificate of Good Moral",
  "Transcript of Records",
  "Diploma",
  "Other",
]

export default function Request() {
  const [state, dispatch] = useReducer(requestReducer, requestInitialState)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [queueNumber, setQueueNumber] = useState<number | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    dispatch({ type: 'SET_FIELD', field: e.target.name, value: e.target.value })
  }

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setQueueNumber(null)
    try {
      const res = await axios.post("/api/student/request", {
        name: state.name === "Other" ? state.customName : state.name,
        description: "",
        purpose: state.purpose,
        notes: state.notes,
      })
      if (res.status === 201) {
        setQueueNumber(res.data.queueNumber ?? null)
        dispatch({ type: "RESET" })
      } else {
        setError(res.data.message)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Server error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const isDisabled = !state.name || !state.purpose || (state.name === "Other" && !state.customName) || loading

  // ── Success state ──
  if (queueNumber !== null) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] px-4 py-8 fade-in">
        <div className="w-full max-w-sm text-center">
          <div className="rounded-2xl p-8 mb-5"
            style={{ background: 'linear-gradient(135deg, var(--color-secondary), var(--color-dark))' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Request Submitted
            </p>
            <p className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>Your queue number is</p>
            <div className="text-7xl font-black my-3" style={{ color: 'var(--color-tertiary)', letterSpacing: '-3px' }}>
              {String(queueNumber).padStart(3, '0')}
            </div>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Keep this number — staff will call it when ready
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Link href="/dashboard/queue" className="btn btn-primary w-full py-3">
              Track Queue Status
            </Link>
            <button onClick={() => setQueueNumber(null)} className="btn btn-outline w-full py-3">
              Submit Another Request
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto fade-in">
      {/* Header */}
      <div className="page-header">
        <p className="page-header-label">Student Portal</p>
        <h1 className="page-header-title">Request Document</h1>
        <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
          Fill in the details and submit to receive your queue number.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl mb-4 text-sm"
          style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B' }}>
          <span className="flex-shrink-0 mt-0.5">⚠</span><span>{error}</span>
        </div>
      )}

      <div className="section-card p-5">
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wide" style={{ color: '#374151' }}>
              Document Type
            </label>
            <select name="name" value={state.name} onChange={handleChange} required>
              <option value="">Select a document...</option>
              {documents.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {state.name === "Other" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wide" style={{ color: '#374151' }}>
                Document Name
              </label>
              <input autoFocus name="customName" value={state.customName} onChange={handleChange}
                type="text" placeholder="Specify the document name" required />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wide" style={{ color: '#374151' }}>
              Purpose <span style={{ color: '#991B1B' }}>*</span>
            </label>
            <input name="purpose" value={state.purpose} onChange={handleChange}
              type="text" placeholder="e.g. Scholarship application, Employment requirement" required />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wide" style={{ color: '#374151' }}>
              Additional Notes{' '}
              <span className="font-normal normal-case" style={{ color: '#9CA3AF' }}>(optional)</span>
            </label>
            <textarea name="notes" value={state.notes} onChange={handleChange}
              placeholder="Any special instructions..."
              rows={3} className="resize-none" />
          </div>

          <button type="submit" className="btn btn-primary w-full py-3 mt-1" disabled={isDisabled}>
            {loading
              ? <><span className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} /> Submitting...</>
              : "Submit Request"}
          </button>
        </form>
      </div>
    </div>
  )
}

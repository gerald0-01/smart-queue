'use client'
import { requestInitialState, requestReducer } from "@/reducers/request"
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
      const payload = {
        name: state.name === "Other" ? state.customName : state.name,
        description: "",
        purpose: state.purpose,
        notes: state.notes,
      }

      const res = await axios.post("/api/student/request", payload)

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

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] px-3 sm:px-4 py-6 sm:py-8 fade-in">
      <div className="card w-full max-w-lg p-5 sm:p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mx-auto mb-3"
            style={{ backgroundColor: 'rgba(128,0,32,0.08)' }}>
            📄
          </div>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--color-secondary)' }}>Request Document</h1>
          <div className="gold-divider" />
          <p className="text-sm mt-2" style={{ color: '#6B7280' }}>
            Fill in the details below and submit your request to receive a queue number.
          </p>
        </div>

        {/* Success — queue number */}
        {queueNumber !== null && (
          <div className="flex flex-col items-center p-5 rounded-xl mb-5 text-center"
            style={{ backgroundColor: 'rgba(128,0,32,0.05)', border: '1.5px solid var(--color-secondary)' }}>
            <p className="text-sm font-semibold mb-1" style={{ color: '#6B7280' }}>Your request was submitted!</p>
            <p className="text-sm font-semibold mb-2" style={{ color: '#6B7280' }}>Your queue number is</p>
            <div className="text-5xl font-extrabold" style={{ color: 'var(--color-secondary)' }}>
              #{queueNumber}
            </div>
            <p className="text-xs mt-2" style={{ color: '#9CA3AF' }}>Track your request status in the Track tab.</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg mb-4 text-sm font-medium"
            style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
            <span>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold" style={{ color: '#374151' }}>Document Type</label>
            <select name="name" value={state.name} onChange={handleChange} required>
              <option value="">Select a document...</option>
              {documents.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {state.name === "Other" && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold" style={{ color: '#374151' }}>Document Name</label>
              <input autoFocus name="customName" value={state.customName} onChange={handleChange}
                type="text" placeholder="Specify the document name" required />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold" style={{ color: '#374151' }}>Purpose <span style={{ color: '#991B1B' }}>*</span></label>
            <input name="purpose" value={state.purpose} onChange={handleChange}
              type="text" placeholder="e.g. Scholarship application, Employment requirement" required />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold" style={{ color: '#374151' }}>
              Additional Notes <span className="font-normal text-xs" style={{ color: '#9CA3AF' }}>(optional)</span>
            </label>
            <textarea name="notes" value={state.notes} onChange={handleChange}
              placeholder="Any special instructions or additional information..."
              rows={3} className="resize-none"
              style={{ padding: '0.65rem 0.9rem', border: '1.5px solid var(--color-border)', borderRadius: '8px', fontSize: '0.95rem', outline: 'none', width: '100%', backgroundColor: '#fff' }} />
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

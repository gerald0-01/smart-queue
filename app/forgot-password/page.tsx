'use client'
import axios from "axios"
import Link from "next/link"
import { useState } from "react"

export default function Page() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await axios.post("/api/auth/forgot-password", { email })
      setSuccess(res.data.message)
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] px-4 fade-in">
      <div className="card w-full max-w-sm p-8 text-center">
        <div className="text-3xl mb-3">🔑</div>
        <h1 className="text-2xl font-extrabold mb-1" style={{ color: 'var(--color-secondary)' }}>Forgot Password</h1>
        <div className="gold-divider mb-4" />
        <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
          Enter your MyIIT email and we&apos;ll send you a reset link.
        </p>

        {success ? (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 p-3 rounded-lg w-full text-sm font-medium"
              style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>
              ✓ {success}
            </div>
            <Link href="/login" className="btn btn-primary w-full py-3 mt-2">Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg text-sm font-medium"
                style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                ⚠ {error}
              </div>
            )}
            <div className="flex flex-col gap-1 text-left">
              <label className="text-sm font-semibold" style={{ color: '#374151' }}>MyIIT Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="name@g.msuiit.edu.ph" required />
            </div>
            <button type="submit" className="btn btn-primary w-full py-3" disabled={loading || !email}>
              {loading
                ? <><span className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} /> Sending...</>
                : "Send Reset Link"}
            </button>
            <Link href="/login" className="text-sm no-underline hover:underline" style={{ color: 'var(--color-secondary)' }}>
              Back to login
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}

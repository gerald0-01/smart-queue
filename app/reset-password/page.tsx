'use client'
import axios from "axios"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState } from "react"

export default function Page() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // No token — show error card
  if (!token) return (
    <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] px-4 fade-in">
      <div className="card w-full max-w-sm p-8 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"
          style={{ backgroundColor: '#FEE2E2' }}>✕</div>
        <h1 className="text-xl font-extrabold mb-1" style={{ color: '#991B1B' }}>Invalid Link</h1>
        <div className="gold-divider mb-4" />
        <p className="text-sm mb-5" style={{ color: '#6B7280' }}>
          This password reset link is missing a token. Please request a new one.
        </p>
        <Link href="/forgot-password" className="btn btn-primary w-full py-3">Request New Link</Link>
      </div>
    </div>
  )

  // Success state
  if (done) return (
    <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] px-4 fade-in">
      <div className="card w-full max-w-sm p-8 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"
          style={{ backgroundColor: '#D1FAE5' }}>✅</div>
        <h1 className="text-2xl font-extrabold mb-1" style={{ color: 'var(--color-secondary)' }}>
          Password Reset!
        </h1>
        <div className="gold-divider mb-4" />
        <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
          Your password has been reset successfully. You can now sign in with your new password.
        </p>
        <Link href="/login" className="btn btn-primary w-full py-3">Sign In</Link>
      </div>
    </div>
  )

  const passError = confirm && password !== confirm ? "Passwords do not match." : null

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (passError) return
    setLoading(true)
    setError(null)
    try {
      await axios.post(`/api/auth/reset-password?token=${token}`, { password })
      setDone(true)
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] px-4 fade-in">
      <div className="card w-full max-w-sm p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3"
            style={{ backgroundColor: 'rgba(128,0,32,0.08)' }}>🔒</div>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--color-secondary)' }}>Reset Password</h1>
          <div className="gold-divider" />
          <p className="text-sm mt-2" style={{ color: '#6B7280' }}>Enter your new password below.</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg mb-4 text-sm font-medium"
            style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold" style={{ color: '#374151' }}>New Password</label>
            <input type={showPassword ? "text" : "password"} value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 6 characters" required minLength={6} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold" style={{ color: '#374151' }}>Confirm Password</label>
            <input type={showPassword ? "text" : "password"} value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat your password" required />
            {passError && <p className="text-xs font-medium" style={{ color: '#991B1B' }}>{passError}</p>}
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
            <input type="checkbox" checked={showPassword} onChange={() => setShowPassword(p => !p)}
              style={{ width: '1rem', height: '1rem' }} />
            Show password
          </label>

          <button type="submit" className="btn btn-primary w-full py-3 mt-1"
            disabled={loading || !password || !confirm || !!passError}>
            {loading
              ? <><span className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} /> Resetting...</>
              : "Reset Password"}
          </button>
        </form>

        <p className="text-center text-sm mt-5" style={{ color: 'var(--color-muted)' }}>
          <Link href="/login" className="font-semibold no-underline hover:underline"
            style={{ color: 'var(--color-secondary)' }}>Back to login</Link>
        </p>
      </div>
    </div>
  )
}

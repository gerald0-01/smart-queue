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

  const passError = confirm && password !== confirm ? "Passwords do not match." : null

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (passError) return
    setLoading(true); setError(null)
    try {
      await axios.post(`/api/auth/reset-password?token=${token}`, { password })
      setDone(true)
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const panel = (
    <div className="auth-panel">
      <div className="relative z-10 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl mx-auto mb-6"
          style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--color-secondary)' }}>SQ</div>
        <h1 className="text-3xl font-black text-white mb-3">New Password</h1>
        <div style={{ width:'3rem', height:'3px', background:'var(--color-tertiary)', borderRadius:'99px', margin:'0 auto 1.5rem' }} />
        <p className="text-sm leading-relaxed" style={{ color:'rgba(255,255,255,0.65)', maxWidth:'20rem' }}>
          Choose a strong password with at least 6 characters to keep your account secure.
        </p>
      </div>
    </div>
  )

  if (!token) return (
    <div className="auth-layout min-h-screen">
      {panel}
      <div className="auth-form-side">
        <div className="w-full max-w-sm text-center fade-in">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"
            style={{ backgroundColor: '#FEE2E2' }}>✕</div>
          <h2 className="text-xl font-black mb-2" style={{ color:'#991B1B' }}>Invalid Link</h2>
          <p className="text-sm mb-6" style={{ color:'#6B7280' }}>This reset link is missing a token. Please request a new one.</p>
          <Link href="/forgot-password" className="btn btn-primary w-full py-3">Request New Link</Link>
        </div>
      </div>
    </div>
  )

  if (done) return (
    <div className="auth-layout min-h-screen">
      {panel}
      <div className="auth-form-side">
        <div className="w-full max-w-sm text-center fade-in">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"
            style={{ backgroundColor: '#D1FAE5' }}>✅</div>
          <h2 className="text-2xl font-black mb-2" style={{ color:'var(--color-secondary)' }}>Password Reset!</h2>
          <div style={{ width:'3rem', height:'3px', background:'linear-gradient(90deg,var(--color-tertiary),var(--color-highlighted))', borderRadius:'99px', margin:'0 auto 1.25rem' }} />
          <p className="text-sm mb-6" style={{ color:'#6B7280' }}>Your password has been reset. You can now sign in with your new password.</p>
          <Link href="/login" className="btn btn-primary w-full py-3">Sign In</Link>
        </div>
      </div>
    </div>
  )

  return (
    <div className="auth-layout min-h-screen">
      {panel}
      <div className="auth-form-side">
        <div className="w-full fade-in" style={{ maxWidth:'26rem' }}>
          <div className="mb-8">
            <h2 className="text-2xl font-black mb-1" style={{ color:'var(--color-secondary)' }}>Set new password</h2>
            <p className="text-sm" style={{ color:'var(--color-muted)' }}>Enter and confirm your new password below</p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl mb-5 text-sm"
              style={{ backgroundColor:'#FEF2F2', border:'1px solid #FECACA', color:'#991B1B' }}>
              <span className="flex-shrink-0 mt-0.5">⚠</span><span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wide" style={{ color:'#374151' }}>New Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" required minLength={6} />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold"
                  style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-muted)' }}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wide" style={{ color:'#374151' }}>Confirm Password</label>
              <input type={showPassword ? "text" : "password"} value={confirm}
                onChange={e => setConfirm(e.target.value)} placeholder="Repeat your password" required />
              {passError && <p className="text-xs font-medium mt-0.5" style={{ color:'#991B1B' }}>{passError}</p>}
            </div>

            <button type="submit" className="btn btn-primary w-full py-3 mt-1"
              disabled={loading || !password || !confirm || !!passError}>
              {loading
                ? <><span className="spinner" style={{ width:'1rem', height:'1rem', borderWidth:'2px' }} /> Resetting...</>
                : "Reset Password"}
            </button>
          </form>

          <div className="mt-6 pt-5" style={{ borderTop:'1px solid var(--color-border)' }}>
            <p className="text-sm text-center" style={{ color:'var(--color-muted)' }}>
              <Link href="/login" className="font-bold no-underline hover:underline" style={{ color:'var(--color-secondary)' }}>
                Back to Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

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
    setLoading(true); setError(null)
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
    <div className="auth-layout min-h-screen">
      <div className="auth-panel">
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl mx-auto mb-6"
            style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--color-secondary)' }}>SQ</div>
          <h1 className="text-3xl font-black text-white mb-3">Forgot Password?</h1>
          <div style={{ width:'3rem', height:'3px', background:'var(--color-tertiary)', borderRadius:'99px', margin:'0 auto 1.5rem' }} />
          <p className="text-sm leading-relaxed" style={{ color:'rgba(255,255,255,0.65)', maxWidth:'20rem' }}>
            No worries. Enter your email and we&apos;ll send you a secure link to reset your password.
          </p>
          <div className="mt-8 p-4 rounded-xl text-xs text-left"
            style={{ backgroundColor:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', maxWidth:'20rem', margin:'2rem auto 0' }}>
            <p className="font-bold mb-1" style={{ color:'rgba(255,255,255,0.5)' }}>💡 Tip</p>
            <p style={{ color:'rgba(255,255,255,0.65)' }}>The reset link expires in 1 hour. Check your spam folder if you don&apos;t see it.</p>
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="w-full fade-in" style={{ maxWidth:'26rem' }}>
          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-5"
                style={{ backgroundColor: '#D1FAE5' }}>📬</div>
              <h2 className="text-2xl font-black mb-2" style={{ color:'var(--color-secondary)' }}>Check your email</h2>
              <div style={{ width:'3rem', height:'3px', background:'linear-gradient(90deg,var(--color-tertiary),var(--color-highlighted))', borderRadius:'99px', margin:'0 auto 1.25rem' }} />
              <p className="text-sm mb-6" style={{ color:'#6B7280' }}>{success}</p>
              <Link href="/login" className="btn btn-primary w-full py-3">Back to Sign In</Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-black mb-1" style={{ color:'var(--color-secondary)' }}>Reset your password</h2>
                <p className="text-sm" style={{ color:'var(--color-muted)' }}>We&apos;ll send a reset link to your email</p>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl mb-5 text-sm"
                  style={{ backgroundColor:'#FEF2F2', border:'1px solid #FECACA', color:'#991B1B' }}>
                  <span className="flex-shrink-0 mt-0.5">⚠</span><span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide" style={{ color:'#374151' }}>MyIIT Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="name@g.msuiit.edu.ph" required />
                </div>
                <button type="submit" className="btn btn-primary w-full py-3 mt-1" disabled={loading || !email}>
                  {loading
                    ? <><span className="spinner" style={{ width:'1rem', height:'1rem', borderWidth:'2px' }} /> Sending...</>
                    : "Send Reset Link"}
                </button>
              </form>

              <div className="mt-6 pt-5" style={{ borderTop:'1px solid var(--color-border)' }}>
                <p className="text-sm text-center" style={{ color:'var(--color-muted)' }}>
                  Remember your password?{' '}
                  <Link href="/login" className="font-bold no-underline hover:underline" style={{ color:'var(--color-secondary)' }}>Sign in</Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

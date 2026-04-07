'use client'
import { signIn } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { redirect } from "next/navigation"
import { useState } from "react"

export default function LoginContainer() {
  const [idOrEmail, setIdOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleFormSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await signIn("credentials", { idOrEmail, password, redirect: false })
    setLoading(false)
    if (res?.error) setError("Invalid credentials. Please check your ID/email and password.")
    else redirect("/dashboard")
  }

  return (
    <div className="auth-layout min-h-screen">
      {/* Left decorative panel */}
      <div className="auth-panel">
        <div className="relative z-10 text-center">
          <Image src="/favicon.ico" alt="Smart Queue" width={80} height={80} className="w-20 h-20 rounded-2xl mx-auto mb-6" />
          <h1 className="text-4xl font-black text-white mb-3 leading-tight">Smart Queue</h1>
          <div style={{ width:'3rem', height:'3px', background:'var(--color-tertiary)', borderRadius:'99px', margin:'0 auto 1.5rem' }} />
          <p className="text-base leading-relaxed" style={{ color:'rgba(255,255,255,0.7)', maxWidth:'22rem' }}>
            Request documents digitally, get your queue number instantly, and track your status in real time.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4" style={{ maxWidth:'22rem', margin:'2.5rem auto 0' }}>
            {[['📄','Request'],['🔢','Queue'],['📡','Track']].map(([icon, label]) => (
              <div key={label} className="rounded-xl p-4 text-center"
                style={{ backgroundColor:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)' }}>
                <div className="text-2xl mb-1">{icon}</div>
                <div className="text-xs font-semibold" style={{ color:'rgba(255,255,255,0.6)' }}>{label}</div>
              </div>
            ))}
          </div>
          <p className="mt-10 text-xs" style={{ color:'rgba(255,255,255,0.35)' }}>
            MSU-IIT Document Request System
          </p>
        </div>
      </div>

      {/* Right form side */}
      <div className="auth-form-side">
        <div className="w-full" style={{ maxWidth:'26rem' }}>
          <div className="mb-8">
            <h2 className="text-2xl font-black mb-1" style={{ color:'var(--color-secondary)' }}>Welcome back</h2>
            <p className="text-sm" style={{ color:'var(--color-muted)' }}>Sign in to your Smart Queue account</p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl mb-5 text-sm"
              style={{ backgroundColor:'#FEF2F2', border:'1px solid #FECACA', color:'#991B1B' }}>
              <span className="mt-0.5 flex-shrink-0">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wide" style={{ color:'#374151' }}>
                ID Number or MyIIT Email
              </label>
              <input type="text" value={idOrEmail} onChange={e => setIdOrEmail(e.target.value)}
                placeholder="e.g. 2021-0001 or name@g.msuiit.edu.ph" required />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wide" style={{ color:'#374151' }}>Password</label>
                <Link href="/forgot-password" className="text-xs font-semibold no-underline hover:underline"
                  style={{ color:'var(--color-secondary)' }}>Forgot password?</Link>
              </div>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold"
                  style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-muted)' }}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full py-3 mt-1 text-sm"
              disabled={loading || !idOrEmail || !password}>
              {loading
                ? <><span className="spinner" style={{ width:'1rem', height:'1rem', borderWidth:'2px' }} /> Signing in...</>
                : "Sign In"}
            </button>
          </form>

          <div className="mt-8 pt-6" style={{ borderTop:'1px solid var(--color-border)' }}>
            <p className="text-sm text-center" style={{ color:'var(--color-muted)' }}>
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-bold no-underline hover:underline"
                style={{ color:'var(--color-secondary)' }}>Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

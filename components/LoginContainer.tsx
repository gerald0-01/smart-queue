'use client'
import { signIn } from "next-auth/react"
import Link from "next/link"
import { useState } from "react"

export default function LoginContainer() {
  const [idOrEmail, setIdOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = await signIn("credentials", {
      idOrEmail,
      password,
      redirect: false,
    })

    setLoading(false)

    if (res?.error) {
      if (res.error === "CredentialsSignin") {
        setError("Invalid credentials. Please try again.")
      } else {
        setError(res.error)
      }
    } else if (!res?.error) {
      window.location.href = "/dashboard"
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] px-4 fade-in">
      <div className="card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-extrabold mx-auto mb-4"
            style={{ backgroundColor: 'var(--color-secondary)', color: 'var(--color-tertiary)' }}>
            SQ
          </div>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--color-secondary)' }}>Welcome back</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>Sign in to your Smart Queue account</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg mb-4 text-sm font-medium"
            style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
            <span>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold" style={{ color: '#374151' }}>ID Number or MyIIT Email</label>
            <input
              type="text"
              value={idOrEmail}
              onChange={e => setIdOrEmail(e.target.value)}
              placeholder="e.g. 2021-0001 or name@g.msuiit.edu.ph"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold" style={{ color: '#374151' }}>Password</label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={() => setShowPassword(p => !p)}
                className="accent-secondary w-4 h-4"
                style={{ width: '1rem', height: '1rem' }}
              />
              Show password
            </label>
            <Link href="/forgot-password" className="no-underline hover:underline text-sm font-medium"
              style={{ color: 'var(--color-secondary)' }}>
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full py-3 mt-2"
            disabled={loading || !idOrEmail || !password}
          >
            {loading ? <><span className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} /> Signing in...</> : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--color-muted)' }}>
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold no-underline hover:underline"
            style={{ color: 'var(--color-secondary)' }}>
            Register here
          </Link>
        </p>
      </div>
    </div>
  )
}

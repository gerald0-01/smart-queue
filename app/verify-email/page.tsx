'use client'
import Link from "next/link"
import { useSearchParams } from "next/navigation"

const ERROR_MESSAGES: Record<string, { title: string; msg: string }> = {
  missing_token:    { title: 'Invalid Link',        msg: 'The verification link is missing a token. Please use the link from your email.' },
  invalid_token:    { title: 'Link Expired',         msg: 'This verification link is invalid or has already expired. Please register again.' },
  already_verified: { title: 'Already Verified',    msg: 'This email address has already been verified. You can sign in.' },
  server_error:     { title: 'Something Went Wrong', msg: 'We encountered an error on our end. Please try again later.' },
}

export default function Page() {
  const searchParams = useSearchParams()
  const success = searchParams.get("success")
  const error   = searchParams.get("error")

  const panel = (
    <div className="auth-panel">
      <div className="relative z-10 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl mx-auto mb-6"
          style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--color-secondary)' }}>SQ</div>
        <h1 className="text-3xl font-black text-white mb-3">Email Verification</h1>
        <div style={{ width:'3rem', height:'3px', background:'var(--color-tertiary)', borderRadius:'99px', margin:'0 auto 1.5rem' }} />
        <p className="text-sm leading-relaxed" style={{ color:'rgba(255,255,255,0.65)', maxWidth:'20rem' }}>
          Verifying your MSU-IIT email address to activate your Smart Queue account.
        </p>
      </div>
    </div>
  )

  if (!success && !error) return (
    <div className="auth-layout min-h-screen">
      {panel}
      <div className="auth-form-side">
        <div className="w-full max-w-sm text-center">
          <div className="spinner mx-auto mb-4" style={{ width:'2.5rem', height:'2.5rem', borderWidth:'4px' }} />
          <p className="font-semibold" style={{ color:'#6B7280' }}>Verifying your email...</p>
        </div>
      </div>
    </div>
  )

  if (success) return (
    <div className="auth-layout min-h-screen">
      {panel}
      <div className="auth-form-side">
        <div className="w-full max-w-sm text-center fade-in">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-5"
            style={{ backgroundColor: '#D1FAE5' }}>✅</div>
          <h2 className="text-2xl font-black mb-2" style={{ color:'var(--color-secondary)' }}>Email Verified!</h2>
          <div style={{ width:'3rem', height:'3px', background:'linear-gradient(90deg,var(--color-tertiary),var(--color-highlighted))', borderRadius:'99px', margin:'0 auto 1.25rem' }} />
          <p className="text-sm mb-6" style={{ color:'#6B7280' }}>
            Your email has been verified. You can now sign in to your Smart Queue account.
          </p>
          <Link href="/login" className="btn btn-primary w-full py-3">Sign In Now</Link>
        </div>
      </div>
    </div>
  )

  const err = ERROR_MESSAGES[error ?? ''] ?? { title: 'Unexpected Error', msg: 'An unexpected error occurred.' }

  return (
    <div className="auth-layout min-h-screen">
      {panel}
      <div className="auth-form-side">
        <div className="w-full max-w-sm text-center fade-in">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-5"
            style={{ backgroundColor: '#FEE2E2' }}>✕</div>
          <h2 className="text-2xl font-black mb-2" style={{ color:'#991B1B' }}>{err.title}</h2>
          <div style={{ width:'3rem', height:'3px', background:'linear-gradient(90deg,var(--color-tertiary),var(--color-highlighted))', borderRadius:'99px', margin:'0 auto 1.25rem' }} />
          <p className="text-sm mb-6" style={{ color:'#6B7280' }}>{err.msg}</p>
          <div className="flex flex-col gap-2">
            {error === 'already_verified' ? (
              <Link href="/login" className="btn btn-primary w-full py-3">Sign In</Link>
            ) : (
              <>
                <Link href="/register" className="btn btn-primary w-full py-3">Register Again</Link>
                <Link href="/login" className="btn btn-outline w-full py-3">Back to Sign In</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

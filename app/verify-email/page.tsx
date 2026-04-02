'use client'
import Link from "next/link"
import { useSearchParams } from "next/navigation"

const ERROR_MESSAGES: Record<string, string> = {
  missing_token:    "The verification link is missing a token. Please use the link from your email.",
  invalid_token:    "This verification link is invalid or has already expired.",
  already_verified: "This email address has already been verified.",
  server_error:     "Something went wrong on our end. Please try again later.",
}

export default function Page() {
  const searchParams = useSearchParams()
  const success = searchParams.get("success")
  const error   = searchParams.get("error")

  // Still loading / direct visit with no params
  if (!success && !error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] px-4">
        <div className="card w-full max-w-sm p-8 text-center">
          <div className="spinner mx-auto mb-4" style={{ width: '2.5rem', height: '2.5rem', borderWidth: '4px' }} />
          <p className="font-semibold" style={{ color: '#6B7280' }}>Verifying your email...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] px-4 fade-in">
        <div className="card w-full max-w-sm p-8 text-center">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"
            style={{ backgroundColor: '#D1FAE5' }}>
            ✅
          </div>

          <h1 className="text-2xl font-extrabold mb-1" style={{ color: 'var(--color-secondary)' }}>
            Email Verified!
          </h1>
          <div className="gold-divider mb-4" />

          <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
            Your email address has been verified successfully. You can now sign in to your Smart Queue account.
          </p>

          <Link href="/login" className="btn btn-primary w-full py-3">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  // Error state
  const errorMsg = ERROR_MESSAGES[error ?? ''] ?? "An unexpected error occurred."

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] px-4 fade-in">
      <div className="card w-full max-w-sm p-8 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"
          style={{ backgroundColor: '#FEE2E2' }}>
          ✕
        </div>

        <h1 className="text-2xl font-extrabold mb-1" style={{ color: '#991B1B' }}>
          Verification Failed
        </h1>
        <div className="gold-divider mb-4" />

        <p className="text-sm mb-6" style={{ color: '#6B7280' }}>{errorMsg}</p>

        <div className="flex flex-col gap-2">
          {error === 'already_verified' ? (
            <Link href="/login" className="btn btn-primary w-full py-3">Sign In</Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-primary w-full py-3">Back to Login</Link>
              <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                Didn&apos;t receive an email?{' '}
                <Link href="/register" className="no-underline hover:underline font-medium"
                  style={{ color: 'var(--color-secondary)' }}>
                  Register again
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

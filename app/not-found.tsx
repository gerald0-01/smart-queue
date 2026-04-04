import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="text-center fade-in">
        {/* Big 404 */}
        <div className="relative mb-6 select-none">
          <div className="text-9xl font-black leading-none"
            style={{ color: 'var(--color-secondary)', opacity: 0.07 }}>404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl"
              style={{ backgroundColor: 'rgba(128,0,32,0.08)' }}>🔍</div>
          </div>
        </div>

        <h1 className="text-3xl font-black mb-2" style={{ color: 'var(--color-secondary)' }}>
          Page Not Found
        </h1>
        <div style={{ width:'3rem', height:'3px', background:'linear-gradient(90deg,var(--color-tertiary),var(--color-highlighted))', borderRadius:'99px', margin:'0.75rem auto 1.25rem' }} />
        <p className="text-base max-w-xs mx-auto mb-8" style={{ color: '#6B7280' }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn btn-primary px-8 py-3">Back to Home</Link>
          <Link href="/login" className="btn btn-outline px-8 py-3">Sign In</Link>
        </div>
      </div>
    </div>
  )
}

import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] px-4 text-center fade-in">
      <div className="text-8xl font-extrabold mb-2" style={{ color: 'var(--color-secondary)', opacity: 0.15 }}>
        404
      </div>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto -mt-10 mb-4"
        style={{ backgroundColor: 'rgba(128,0,32,0.08)' }}>
        🔍
      </div>
      <h1 className="text-2xl font-extrabold mb-2" style={{ color: 'var(--color-secondary)' }}>
        Page Not Found
      </h1>
      <div className="gold-divider mb-4" />
      <p className="text-base max-w-sm mb-8" style={{ color: '#6B7280' }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/" className="btn btn-primary px-8 py-3">
        Back to Home
      </Link>
    </div>
  )
}

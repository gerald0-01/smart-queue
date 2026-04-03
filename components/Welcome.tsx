'use client'
import Link from "next/link"

export default function Welcome() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] px-3 sm:px-4 fade-in">
      {/* Hero */}
      <div className="text-center max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6"
          style={{ backgroundColor: 'rgba(128,0,32,0.08)', color: 'var(--color-secondary)' }}>
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: 'var(--color-tertiary)' }} />
          MSU-IIT Document Request System
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight mb-3 sm:mb-4"
          style={{ color: 'var(--color-secondary)' }}>
          Smart Queue
        </h1>
        <div className="gold-divider mb-4 sm:mb-6" style={{ width: '4rem' }} />

        <p className="text-base sm:text-lg leading-relaxed mb-6 sm:mb-8" style={{ color: '#4B5563' }}>
          Request documents digitally, get your queue number instantly, and track your
          request status in real time — all in one place.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center w-full sm:w-auto">
          <Link href="/login" className="btn btn-primary px-6 sm:px-8 py-3 text-base w-full sm:w-auto">
            Get Started
          </Link>
          <Link href="/register" className="btn btn-outline px-6 sm:px-8 py-3 text-base w-full sm:w-auto">
            Create Account
          </Link>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mt-12 sm:mt-16 max-w-3xl w-full">
        {[
          { icon: "📄", title: "Request Documents", desc: "Submit document requests digitally — no more long lines." },
          { icon: "🔢", title: "Queue Number", desc: "Get an assigned queue number the moment you submit." },
          { icon: "📡", title: "Track Status", desc: "Monitor your request from pending to ready for pickup." },
        ].map(f => (
          <div key={f.title} className="card p-5 sm:p-6 text-center">
            <div className="text-3xl mb-2 sm:mb-3">{f.icon}</div>
            <h3 className="font-bold text-base mb-1" style={{ color: 'var(--color-secondary)' }}>{f.title}</h3>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

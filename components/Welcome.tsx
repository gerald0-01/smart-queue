'use client'
import Link from "next/link"

export default function Welcome() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] px-4 fade-in">
      {/* Hero */}
      <div className="text-center max-w-2xl">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-6"
          style={{ backgroundColor: 'rgba(128,0,32,0.08)', color: 'var(--color-secondary)' }}>
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: 'var(--color-tertiary)' }} />
          MSU-IIT Document Request System
        </div>

        <h1 className="text-5xl font-extrabold leading-tight mb-4"
          style={{ color: 'var(--color-secondary)' }}>
          Smart Queue
        </h1>
        <div className="gold-divider mb-6" style={{ width: '4rem' }} />

        <p className="text-lg leading-relaxed mb-8" style={{ color: '#4B5563' }}>
          Request documents digitally, get your queue number instantly, and track your
          request status in real time — all in one place.
        </p>

        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/login" className="btn btn-primary px-8 py-3 text-base">
            Get Started
          </Link>
          <Link href="/register" className="btn btn-outline px-8 py-3 text-base">
            Create Account
          </Link>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-16 max-w-3xl w-full">
        {[
          { icon: "📄", title: "Request Documents", desc: "Submit document requests digitally — no more long lines." },
          { icon: "🔢", title: "Queue Number", desc: "Get an assigned queue number the moment you submit." },
          { icon: "📡", title: "Track Status", desc: "Monitor your request from pending to ready for pickup." },
        ].map(f => (
          <div key={f.title} className="card p-6 text-center">
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="font-bold text-base mb-1" style={{ color: 'var(--color-secondary)' }}>{f.title}</h3>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

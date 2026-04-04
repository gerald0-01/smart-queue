'use client'
import Link from "next/link"

export default function Welcome() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Minimal nav for landing */}
      <nav className="flex h-16 items-center justify-between px-6"
        style={{ backgroundColor: 'var(--color-secondary)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
            style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--color-secondary)' }}>SQ</div>
          <span className="text-lg font-black" style={{ color: 'var(--color-tertiary)' }}>Smart Queue</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="btn btn-ghost text-sm">Sign In</Link>
          <Link href="/register" className="btn text-sm font-bold"
            style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--color-secondary)' }}>
            Register
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex flex-col items-center justify-center px-4 py-24 text-center fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-8"
          style={{ backgroundColor: 'rgba(128,0,32,0.08)', color: 'var(--color-secondary)', border: '1px solid rgba(128,0,32,0.15)' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-tertiary)' }} />
          MSU-IIT Document Request System
        </div>

        <h1 className="text-6xl font-black leading-none mb-4" style={{ color: 'var(--color-secondary)' }}>
          Smart Queue
        </h1>
        <div style={{ width:'4rem', height:'4px', background:'linear-gradient(90deg, var(--color-tertiary), var(--color-highlighted))', borderRadius:'99px', margin:'0 auto 1.5rem' }} />

        <p className="text-lg leading-relaxed mb-10 max-w-lg" style={{ color: '#4B5563' }}>
          Request documents digitally, get your queue number instantly, and track your
          request status in real time — all in one place.
        </p>

        <div className="flex flex-wrap gap-3 justify-center mb-20">
          <Link href="/login" className="btn btn-primary px-8 py-3 text-sm">Get Started</Link>
          <Link href="/register" className="btn btn-outline px-8 py-3 text-sm">Create Account</Link>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl w-full">
          {[
            { icon: '📄', title: 'Request Documents', desc: 'Submit document requests digitally — no more long lines.' },
            { icon: '🔢', title: 'Queue Number',      desc: 'Get an assigned queue number the moment you submit.' },
            { icon: '📡', title: 'Track Status',      desc: 'Monitor your request from pending to ready for pickup.' },
          ].map(f => (
            <div key={f.title} className="card p-6 text-center">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--color-secondary)' }}>{f.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-muted)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

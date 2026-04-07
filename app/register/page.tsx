'use client'
import StaffRegister from "@/components/register/StaffRegisterContainer"
import Register from "@/components/register/RegisterContainer"
import { RoleContext } from "@/context/roleRegistrationContext"
import { useContext, useState } from "react"
import Link from "next/link"
import Image from "next/image"

const ROLES = [
  {
    id: 'STUDENT',
    icon: '🎓',
    title: 'Student',
    desc: 'Currently enrolled at MSU-IIT',
    color: 'var(--color-secondary)',
    bg: 'rgba(128,0,32,0.06)',
  },
  {
    id: 'ALUMNI',
    icon: '🏛️',
    title: 'Alumni',
    desc: 'Graduate of MSU-IIT',
    color: '#1E40AF',
    bg: 'rgba(30,64,175,0.06)',
  },
  {
    id: 'STAFF',
    icon: '🪪',
    title: 'Staff',
    desc: 'MSU-IIT faculty or administrative staff',
    color: '#065F46',
    bg: 'rgba(6,95,70,0.06)',
  },
]

export default function Page() {
  const { role, setRole } = useContext(RoleContext)
  const [selected, setSelected] = useState(false)

  if (!selected) {
    return (
      <div className="auth-layout min-h-screen">
        {/* Left panel */}
        <div className="auth-panel">
          <div className="relative z-10 text-center">
            <Image src="/favicon.ico" alt="Smart Queue" width={80} height={80} className="w-20 h-20 rounded-2xl mx-auto mb-6" />
            <h1 className="text-4xl font-black text-white mb-3">Smart Queue</h1>
            <div style={{ width:'3rem', height:'3px', background:'var(--color-tertiary)', borderRadius:'99px', margin:'0 auto 1.5rem' }} />
            <p className="text-base leading-relaxed" style={{ color:'rgba(255,255,255,0.7)', maxWidth:'22rem' }}>
              Join thousands of MSU-IIT students and staff managing document requests digitally.
            </p>
            <div className="mt-10 space-y-3" style={{ maxWidth:'22rem', margin:'2.5rem auto 0' }}>
              {['No more long queues','Real-time status tracking','Instant queue numbers','Email notifications'].map(f => (
                <div key={f} className="flex items-center gap-3 text-sm"
                  style={{ color:'rgba(255,255,255,0.75)' }}>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                    style={{ backgroundColor:'rgba(212,175,55,0.25)', color:'var(--color-tertiary)' }}>✓</span>
                  {f}
                </div>
              ))}
            </div>
            <p className="mt-10 text-xs" style={{ color:'rgba(255,255,255,0.35)' }}>MSU-IIT Document Request System</p>
          </div>
        </div>

        {/* Right: role selector */}
        <div className="auth-form-side">
          <div className="w-full fade-in" style={{ maxWidth:'26rem' }}>
            <div className="mb-8">
              <h2 className="text-2xl font-black mb-1" style={{ color:'var(--color-secondary)' }}>Create an account</h2>
              <p className="text-sm" style={{ color:'var(--color-muted)' }}>Select your role to get started</p>
            </div>

            <div className="flex flex-col gap-3 mb-6">
              {ROLES.map(r => (
                <button key={r.id} onClick={() => { setRole(r.id); setSelected(true) }}
                  className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all hover:-translate-y-0.5"
                  style={{
                    background: '#fff',
                    border: `1.5px solid ${role === r.id ? r.color : 'var(--color-border)'}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    cursor: 'pointer',
                  }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: r.bg }}>
                    {r.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm" style={{ color: r.color }}>{r.title}</p>
                    <p className="text-xs mt-0.5" style={{ color:'var(--color-muted)' }}>{r.desc}</p>
                  </div>
                  <span className="text-lg" style={{ color:'var(--color-border)' }}>→</span>
                </button>
              ))}
            </div>

            <div className="pt-5" style={{ borderTop:'1px solid var(--color-border)' }}>
              <p className="text-sm text-center" style={{ color:'var(--color-muted)' }}>
                Already have an account?{' '}
                <Link href="/login" className="font-bold no-underline hover:underline"
                  style={{ color:'var(--color-secondary)' }}>Sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (role === 'STUDENT' || role === 'ALUMNI') return <Register onBack={() => setSelected(false)} />
  if (role === 'STAFF') return <StaffRegister onBack={() => setSelected(false)} />
}

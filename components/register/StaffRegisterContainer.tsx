'use client'
import { RoleContext } from "@/context/roleRegistrationContext"
import { staffRegisterInitialState, staffRegisterReducer } from "@/reducers/staffRegister"
import axios from "axios"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useState, useReducer, useContext, useEffect } from "react"

interface Props { onBack: () => void }

export default function StaffRegister({ onBack }: Props) {
  const router = useRouter()
  const [state, dispatch] = useReducer(staffRegisterReducer, staffRegisterInitialState)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [passError, setPassError] = useState<string | null>(null)
  const [isFilled, setIsFilled] = useState(false)

  useEffect(() => {
    const allFilled = Object.values(state).every(v => v !== "" && v !== null)
    setIsFilled(allFilled)
    if (state.confirmPassword === "") setPassError(null)
    else if (state.password !== state.confirmPassword) setPassError("Passwords do not match")
    else setPassError(null)
  }, [state])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_FIELD', field: e.target.name, value: e.target.value })
  }

  const handleFormSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await axios.post("/api/auth/register", {
        firstName: state.firstName, lastName: state.lastName,
        email: state.email, idNumber: state.idNumber,
        password: state.password, role: "STAFF",
      })
      if (res.status === 201) {
        setSuccess(res.data.message)
        setTimeout(() => router.push("/login"), 2000)
      } else {
        setError(res.data.message)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Server error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout min-h-screen">
      {/* Left panel */}
      <div className="auth-panel">
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl mx-auto mb-6"
            style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--color-secondary)' }}>
            SQ
          </div>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
            style={{ backgroundColor:'rgba(255,255,255,0.1)' }}>
            🪪
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Staff Registration</h1>
          <div style={{ width:'3rem', height:'3px', background:'var(--color-tertiary)', borderRadius:'99px', margin:'0 auto 1.5rem' }} />
          <p className="text-sm leading-relaxed" style={{ color:'rgba(255,255,255,0.65)', maxWidth:'20rem' }}>
            Register as MSU-IIT staff to manage and process student document requests.
          </p>
          <div className="mt-8 p-4 rounded-xl text-xs leading-relaxed text-left"
            style={{ backgroundColor:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', maxWidth:'20rem', margin:'2rem auto 0' }}>
            <p style={{ color:'rgba(255,255,255,0.5)', marginBottom:'0.5rem' }}>⚠ Note</p>
            <p style={{ color:'rgba(255,255,255,0.7)' }}>
              Your account will require administrator verification before you can sign in.
            </p>
          </div>
          <button onClick={onBack} className="mt-8 flex items-center gap-2 mx-auto text-sm font-semibold"
            style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.55)' }}>
            ← Back to role selection
          </button>
        </div>
      </div>

      {/* Right form */}
      <div className="auth-form-side">
        <div className="w-full fade-in" style={{ maxWidth:'26rem' }}>
          <div className="mb-6">
            <h2 className="text-xl font-black mb-0.5" style={{ color:'var(--color-secondary)' }}>Staff Account</h2>
            <p className="text-xs" style={{ color:'var(--color-muted)' }}>Fill in your details below</p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl mb-4 text-sm"
              style={{ backgroundColor:'#FEF2F2', border:'1px solid #FECACA', color:'#991B1B' }}>
              <span className="flex-shrink-0 mt-0.5">⚠</span><span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl mb-4 text-sm"
              style={{ backgroundColor:'#F0FDF4', border:'1px solid #BBF7D0', color:'#065F46' }}>
              <span className="flex-shrink-0 mt-0.5">✓</span><span>{success}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wide" style={{ color:'#374151' }}>First Name</label>
                <input name="firstName" value={state.firstName} onChange={handleChange} type="text" placeholder="Juan" required />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wide" style={{ color:'#374151' }}>Last Name</label>
                <input name="lastName" value={state.lastName} onChange={handleChange} type="text" placeholder="Dela Cruz" required />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wide" style={{ color:'#374151' }}>MyIIT Email</label>
              <input name="email" value={state.email} onChange={handleChange} type="email"
                placeholder="name@g.msuiit.edu.ph" required />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wide" style={{ color:'#374151' }}>ID Number</label>
              <input name="idNumber" value={state.idNumber} onChange={handleChange} type="text" placeholder="XXXX-XXXX" required />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wide" style={{ color:'#374151' }}>Password</label>
              <div className="relative">
                <input name="password" value={state.password} onChange={handleChange}
                  type={showPassword ? "text" : "password"} placeholder="Create a password" required />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold"
                  style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-muted)' }}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wide" style={{ color:'#374151' }}>Confirm Password</label>
              <input name="confirmPassword" value={state.confirmPassword} onChange={handleChange}
                type={showPassword ? "text" : "password"} placeholder="Repeat your password" required />
              {passError && <p className="text-xs font-medium mt-0.5" style={{ color:'#991B1B' }}>{passError}</p>}
            </div>

            <button type="submit" className="btn btn-primary w-full py-3 mt-1 text-sm"
              disabled={!isFilled || !!passError || loading}>
              {loading
                ? <><span className="spinner" style={{ width:'1rem', height:'1rem', borderWidth:'2px' }} /> Creating account...</>
                : "Create Staff Account"}
            </button>
          </form>

          <div className="mt-6 pt-5" style={{ borderTop:'1px solid var(--color-border)' }}>
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

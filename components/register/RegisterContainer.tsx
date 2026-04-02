'use client'
import { RoleContext } from "@/context/roleRegistrationContext"
import { registerInitialState, registerReducer } from "@/reducers/register"
import { collegeOptions } from "@/utils/enumsHelper"
import axios from "axios"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useState, useReducer, useContext, useEffect } from "react"

export default function Register() {
  const router = useRouter()
  const [state, dispatch] = useReducer(registerReducer, registerInitialState)
  const [showPassword, setShowPassword] = useState(false)
  const [passError, setPassError] = useState<string | null>(null)
  const [idError, setIdError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { role, setRole } = useContext(RoleContext)

  useEffect(() => {
    setIdError(
      state.idNumber !== "" && !/^\d{4}-\d{4}$/.test(state.idNumber)
        ? "ID must be in XXXX-XXXX format"
        : null
    )
    if (state.confirmPassword === "") setPassError(null)
    else if (state.password !== state.confirmPassword) setPassError("Passwords do not match")
    else setPassError(null)
  }, [state])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    dispatch({ type: 'SET_FIELD', field: e.target.name, value: e.target.value })
  }

  const isDisabled =
    !state.firstName || !state.lastName || !state.email ||
    !state.idNumber || !state.password || !state.confirmPassword ||
    !state.course || !!passError || !!idError || loading

  const handleFormSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await axios.post("/api/auth/register", {
        firstName: state.firstName,
        lastName: state.lastName,
        email: state.email,
        idNumber: state.idNumber,
        password: state.password,
        college: state.college,
        course: state.course,
        role,
      })
      if (res.status === 201) {
        setSuccess("Registration successful! Redirecting to login...")
        setTimeout(() => router.push("/login"), 1500)
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
    <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] px-4 py-8 fade-in">
      <div className="card w-full max-w-md p-8">

        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--color-secondary)' }}>
            {role === 'ALUMNI' ? 'Alumni' : 'Student'} Registration
          </h1>
          <div className="gold-divider" />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg mb-4 text-sm font-medium"
            style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
            ⚠ {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-3 rounded-lg mb-4 text-sm font-medium"
            style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>
            ✓ {success}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="flex flex-col gap-3">

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: '#374151' }}>First Name</label>
              <input name="firstName" value={state.firstName} onChange={handleChange}
                type="text" placeholder="Juan" required />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: '#374151' }}>Last Name</label>
              <input name="lastName" value={state.lastName} onChange={handleChange}
                type="text" placeholder="Dela Cruz" required />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold" style={{ color: '#374151' }}>
              {role === 'ALUMNI' ? 'Email' : 'MyIIT Email'}
            </label>
            <input name="email" value={state.email} onChange={handleChange}
              type="email"
              placeholder={role === 'ALUMNI' ? 'your@email.com' : 'name@g.msuiit.edu.ph'}
              required />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
            <input type="checkbox" checked={role === 'ALUMNI'}
              onChange={() => setRole(role === 'STUDENT' ? 'ALUMNI' : 'STUDENT')}
              style={{ width: '1rem', height: '1rem' }} />
            I&apos;m an alumni
          </label>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold" style={{ color: '#374151' }}>ID Number</label>
            <input name="idNumber" value={state.idNumber} onChange={handleChange}
              type="text" placeholder="XXXX-XXXX" required />
            {idError && <p className="text-xs font-medium" style={{ color: '#991B1B' }}>{idError}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: '#374151' }}>College</label>
              <select name="college" value={state.college} onChange={handleChange}>
                {collegeOptions.map(c => (
                  <option key={c.value} value={c.value}>{c.value}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: '#374151' }}>Course</label>
              <input name="course" value={state.course} onChange={handleChange}
                type="text" placeholder="e.g. BSIT" required />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold" style={{ color: '#374151' }}>Password</label>
            <input name="password" value={state.password} onChange={handleChange}
              type={showPassword ? "text" : "password"} placeholder="Create a password" required />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold" style={{ color: '#374151' }}>Confirm Password</label>
            <input name="confirmPassword" value={state.confirmPassword} onChange={handleChange}
              type={showPassword ? "text" : "password"} placeholder="Repeat your password" required />
            {passError && <p className="text-xs font-medium" style={{ color: '#991B1B' }}>{passError}</p>}
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
            <input type="checkbox" checked={showPassword}
              onChange={() => setShowPassword(p => !p)}
              style={{ width: '1rem', height: '1rem' }} />
            Show password
          </label>

          <button type="submit" className="btn btn-primary w-full py-3 mt-1" disabled={isDisabled}>
            {loading
              ? <><span className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} /> Registering...</>
              : "Create Account"}
          </button>
        </form>

        <div className="text-center text-sm mt-5 flex flex-col gap-1" style={{ color: 'var(--color-muted)' }}>
          <span>
            Already have an account?{' '}
            <Link href="/login" className="font-semibold no-underline hover:underline"
              style={{ color: 'var(--color-secondary)' }}>
              Sign in
            </Link>
          </span>
          <span>
            Staff member?{' '}
            <Link href="/register" className="font-semibold no-underline hover:underline"
              style={{ color: 'var(--color-secondary)' }}
              onClick={() => setRole("STAFF")}>
              Register here
            </Link>
          </span>
        </div>

      </div>
    </div>
  )
}

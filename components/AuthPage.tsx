'use client'
import { useState } from "react"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { collegeOptions } from "@/utils/enumsHelper"
import { RoleContext } from "@/context/roleRegistrationContext"
import { useContext } from "react"

type Tab = 'login' | 'register' | 'staff'

interface RegisterState {
  firstName: string
  lastName: string
  email: string
  idNumber: string
  college: string
  course: string
  password: string
  confirmPassword: string
}

const initialRegisterState: RegisterState = {
  firstName: "",
  lastName: "",
  email: "",
  idNumber: "",
  college: "COE",
  course: "",
  password: "",
  confirmPassword: "",
}

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<Tab>('login')
  const router = useRouter()
  const { role, setRole } = useContext(RoleContext)
  
  // Login state
  const [idOrEmail, setIdOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginLoading, setLoginLoading] = useState(false)
  
  // Register state
  const [registerState, setRegisterState] = useState<RegisterState>(initialRegisterState)
  const [registerError, setRegisterError] = useState<string | null>(null)
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null)
  const [registerLoading, setRegisterLoading] = useState(false)
  const [showRegPassword, setShowRegPassword] = useState(false)

  // Staff registration state
  const [staffState, setStaffState] = useState({
    firstName: "",
    lastName: "",
    email: "",
    idNumber: "",
    password: "",
    confirmPassword: "",
  })
  const [staffError, setStaffError] = useState<string | null>(null)
  const [staffSuccess, setStaffSuccess] = useState<string | null>(null)
  const [staffLoading, setStaffLoading] = useState(false)
  const [showStaffPassword, setShowStaffPassword] = useState(false)

  const updateStaffField = (field: string, value: string) => {
    setStaffState(prev => ({ ...prev, [field]: value }))
  }

  const isStaffDisabled = 
    !staffState.firstName || !staffState.lastName || 
    !staffState.email || !staffState.idNumber || 
    !staffState.password || !staffState.confirmPassword ||
    staffState.password !== staffState.confirmPassword

  const handleStaffRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setStaffError(null)
    setStaffLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: staffState.firstName,
          lastName: staffState.lastName,
          email: staffState.email,
          idNumber: staffState.idNumber,
          password: staffState.password,
          role: "STAFF",
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setStaffSuccess("Staff account created! Redirecting to login...")
        setTimeout(() => {
          setActiveTab('login')
          setStaffSuccess(null)
        }, 1500)
      } else {
        setStaffError(data.message || "Registration failed")
      }
    } catch {
      setStaffError("Server error. Please try again.")
    } finally {
      setStaffLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)
    setLoginLoading(true)

    const res = await signIn("credentials", {
      idOrEmail,
      password,
      redirect: false,
    })

    setLoginLoading(false)

    if (res?.error) {
      setLoginError(res.error === "CredentialsSignin" ? "Invalid credentials. Please try again." : res.error)
    } else {
      window.location.href = "/dashboard"
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegisterError(null)
    setRegisterLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: registerState.firstName,
          lastName: registerState.lastName,
          email: registerState.email,
          idNumber: registerState.idNumber,
          password: registerState.password,
          college: registerState.college,
          course: registerState.course,
          role,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setRegisterSuccess("Account created! Redirecting to login...")
        setTimeout(() => {
          setActiveTab('login')
          setRegisterSuccess(null)
        }, 1500)
      } else {
        setRegisterError(data.message || "Registration failed")
      }
    } catch {
      setRegisterError("Server error. Please try again.")
    } finally {
      setRegisterLoading(false)
    }
  }

  const updateRegisterField = (field: keyof RegisterState, value: string) => {
    setRegisterState(prev => ({ ...prev, [field]: value }))
  }

  const loading = registerLoading || loginLoading

  const isRegisterDisabled = 
    !registerState.firstName || !registerState.lastName || 
    !registerState.email || !registerState.idNumber || 
    !registerState.password || !registerState.confirmPassword ||
    !registerState.course || loading || 
    registerState.password !== registerState.confirmPassword

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-3 sm:px-4 py-8 sm:py-12 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#800020]/5 via-[#F7F3F0] to-[#D4AF37]/5" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#800020]/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#D4AF37]/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s' }} />

      <div className="card w-full max-w-md relative z-10 overflow-hidden">
        {/* Header */}
        <div className="p-6 sm:p-8 pb-4 text-center border-b border-[#E5E7EB]">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-extrabold mx-auto mb-4 shadow-lg"
            style={{ backgroundColor: 'linear-gradient(135deg, var(--color-secondary), var(--color-dark))', background: 'linear-gradient(135deg, #800020, #4A0012)', color: '#D4AF37' }}>
            SQ
          </div>
          <h1 className="text-2xl font-extrabold mb-1" style={{ color: 'var(--color-secondary)' }}>
            {activeTab === 'login' ? 'Welcome Back' : activeTab === 'staff' ? 'Staff Registration' : 'Create Account'}
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            {activeTab === 'login' ? 'Sign in to continue to Smart Queue' : activeTab === 'staff' ? 'Register as a staff member' : 'Join Smart Queue today'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#E5E7EB]">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-3 text-sm font-semibold transition-all relative`}
            style={{ 
              color: activeTab === 'login' ? 'var(--color-secondary)' : 'var(--color-muted)',
            }}
          >
            Sign In
            {activeTab === 'login' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: 'var(--color-secondary)' }} />
            )}
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-3 text-sm font-semibold transition-all relative`}
            style={{ 
              color: activeTab === 'register' ? 'var(--color-secondary)' : 'var(--color-muted)',
            }}
          >
            Student
            {activeTab === 'register' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: 'var(--color-secondary)' }} />
            )}
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`flex-1 py-3 text-sm font-semibold transition-all relative`}
            style={{ 
              color: activeTab === 'staff' ? 'var(--color-secondary)' : 'var(--color-muted)',
            }}
          >
            Staff
            {activeTab === 'staff' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: 'var(--color-secondary)' }} />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              {loginError && (
                <div className="flex items-center gap-2 p-3 rounded-lg text-sm font-medium animate-shake"
                  style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                  <span>⚠</span> {loginError}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold" style={{ color: '#374151' }}>ID Number or Email</label>
                <input
                  type="text"
                  value={idOrEmail}
                  onChange={e => setIdOrEmail(e.target.value)}
                  placeholder="2021-0001 or name@g.msuiit.edu.ph"
                  className="input-focus"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold" style={{ color: '#374151' }}>Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="input-focus pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm"
                    style={{ color: 'var(--color-muted)' }}
                  >
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={showPassword} onChange={() => setShowPassword(p => !p)}
                    className="accent-secondary" />
                  Show password
                </label>
                <Link href="/forgot-password" className="no-underline hover:underline font-medium"
                  style={{ color: 'var(--color-secondary)' }}>
                  Forgot password?
                </Link>
              </div>

              <button type="submit" className="btn btn-primary w-full py-3 mt-2" disabled={loading || !idOrEmail || !password}>
                {loginLoading ? (
                  <span className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} />
                ) : 'Sign In'}
              </button>

              <p className="text-center text-sm mt-2" style={{ color: 'var(--color-muted)' }}>
                Don&apos;t have an account?{' '}
                <button type="button" onClick={() => setActiveTab('register')} className="font-semibold hover:underline"
                  style={{ color: 'var(--color-secondary)' }}>
                  Register here
                </button>
              </p>
            </form>
          ) : activeTab === 'register' ? (
            <form onSubmit={handleRegister} className="flex flex-col gap-3">
              {registerError && (
                <div className="flex items-center gap-2 p-3 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                  ⚠ {registerError}
                </div>
              )}
              {registerSuccess && (
                <div className="flex items-center gap-2 p-3 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>
                  ✓ {registerSuccess}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: '#374151' }}>First Name</label>
                  <input type="text" value={registerState.firstName} onChange={e => updateRegisterField('firstName', e.target.value)}
                    placeholder="Juan" className="input-focus" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: '#374151' }}>Last Name</label>
                  <input type="text" value={registerState.lastName} onChange={e => updateRegisterField('lastName', e.target.value)}
                    placeholder="Dela Cruz" className="input-focus" required />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: '#374151' }}>
                  {role === 'ALUMNI' ? 'Email' : 'MyIIT Email'}
                </label>
                <input type="email" value={registerState.email} onChange={e => updateRegisterField('email', e.target.value)}
                  placeholder={role === 'ALUMNI' ? 'your@email.com' : 'name@g.msuiit.edu.ph'}
                  className="input-focus" required />
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
                <input type="checkbox" checked={role === 'ALUMNI'}
                  onChange={() => setRole(role === 'STUDENT' ? 'ALUMNI' : 'STUDENT')} />
                I&apos;m an alumni
              </label>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: '#374151' }}>ID Number</label>
                <input type="text" value={registerState.idNumber} onChange={e => updateRegisterField('idNumber', e.target.value)}
                  placeholder="XXXX-XXXX" className="input-focus" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: '#374151' }}>College</label>
                  <select value={registerState.college} onChange={e => updateRegisterField('college', e.target.value)} className="input-focus">
                    {collegeOptions.map(c => (<option key={c.value} value={c.value}>{c.value}</option>))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: '#374151' }}>Course</label>
                  <input type="text" value={registerState.course} onChange={e => updateRegisterField('course', e.target.value)}
                    placeholder="e.g. BSIT" className="input-focus" required />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: '#374151' }}>Password</label>
                <input type={showRegPassword ? "text" : "password"} value={registerState.password} 
                  onChange={e => updateRegisterField('password', e.target.value)}
                  placeholder="Create a password" className="input-focus" required />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: '#374151' }}>Confirm Password</label>
                <input type={showRegPassword ? "text" : "password"} value={registerState.confirmPassword} 
                  onChange={e => updateRegisterField('confirmPassword', e.target.value)}
                  placeholder="Repeat password" className="input-focus" required />
                {registerState.confirmPassword && registerState.password !== registerState.confirmPassword && (
                  <p className="text-xs font-medium" style={{ color: '#991B1B' }}>Passwords do not match</p>
                )}
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
                <input type="checkbox" checked={showRegPassword} onChange={() => setShowRegPassword(p => !p)} />
                Show password
              </label>

              <button type="submit" className="btn btn-primary w-full py-3 mt-1" disabled={isRegisterDisabled}>
                {registerLoading ? (
                  <span className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} />
                ) : 'Create Account'}
              </button>

              <p className="text-center text-sm mt-2" style={{ color: 'var(--color-muted)' }}>
                Already have an account?{' '}
                <button type="button" onClick={() => setActiveTab('login')} className="font-semibold hover:underline"
                  style={{ color: 'var(--color-secondary)' }}>
                  Sign in
                </button>
              </p>
            </form>
          ) : activeTab === 'staff' ? (
            <form onSubmit={handleStaffRegister} className="flex flex-col gap-3">
              {staffError && (
                <div className="flex items-center gap-2 p-3 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                  ⚠ {staffError}
                </div>
              )}
              {staffSuccess && (
                <div className="flex items-center gap-2 p-3 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>
                  ✓ {staffSuccess}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: '#374151' }}>First Name</label>
                  <input type="text" value={staffState.firstName} onChange={e => updateStaffField('firstName', e.target.value)}
                    placeholder="Juan" className="input-focus" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: '#374151' }}>Last Name</label>
                  <input type="text" value={staffState.lastName} onChange={e => updateStaffField('lastName', e.target.value)}
                    placeholder="Dela Cruz" className="input-focus" required />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: '#374151' }}>MyIIT Email</label>
                <input type="email" value={staffState.email} onChange={e => updateStaffField('email', e.target.value)}
                  placeholder="name@g.msuiit.edu.ph" className="input-focus" required />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: '#374151' }}>ID Number</label>
                <input type="text" value={staffState.idNumber} onChange={e => updateStaffField('idNumber', e.target.value)}
                  placeholder="XXXX-XXXX" className="input-focus" required />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: '#374151' }}>Password</label>
                <input type={showStaffPassword ? "text" : "password"} value={staffState.password} 
                  onChange={e => updateStaffField('password', e.target.value)}
                  placeholder="Create a password" className="input-focus" required />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: '#374151' }}>Confirm Password</label>
                <input type={showStaffPassword ? "text" : "password"} value={staffState.confirmPassword} 
                  onChange={e => updateStaffField('confirmPassword', e.target.value)}
                  placeholder="Repeat password" className="input-focus" required />
                {staffState.confirmPassword && staffState.password !== staffState.confirmPassword && (
                  <p className="text-xs font-medium" style={{ color: '#991B1B' }}>Passwords do not match</p>
                )}
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
                <input type="checkbox" checked={showStaffPassword} onChange={() => setShowStaffPassword(p => !p)} />
                Show password
              </label>

              <button type="submit" className="btn btn-primary w-full py-3 mt-1" disabled={isStaffDisabled}>
                {staffLoading ? (
                  <span className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} />
                ) : 'Create Staff Account'}
              </button>

              <p className="text-center text-sm mt-2" style={{ color: 'var(--color-muted)' }}>
                Already have an account?{' '}
                <button type="button" onClick={() => setActiveTab('login')} className="font-semibold hover:underline"
                  style={{ color: 'var(--color-secondary)' }}>
                  Sign in
                </button>
              </p>
            </form>
          ) : null}
        </div>
      </div>

      <style jsx>{`
        .input-focus {
          width: 100%;
          padding: 0.65rem 0.9rem;
          border: 1.5px solid var(--color-border);
          border-radius: 8px;
          font-size: 0.95rem;
          background-color: #FFFFFF;
          color: #1F2937;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
        }
        .input-focus:focus {
          border-color: var(--color-secondary);
          box-shadow: 0 0 0 3px rgba(128, 0, 32, 0.1);
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  )
}
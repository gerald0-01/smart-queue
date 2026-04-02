'use client'
import axios from "axios"
import { useEffect, useState } from "react"
import ErrorCard from "@/components/ErrorCard"

interface User {
  id: string
  name: string
  idNumber: string
  email: string
  role: string
  college: string | null
  course: string | null
  verified: boolean
  createdAt: string
}

type RoleFilter = 'ALL' | 'STUDENT' | 'STAFF' | 'ALUMNI' | 'ADMIN'

const ROLE_BADGE: Record<string, string> = {
  STUDENT: 'badge',
  STAFF:   'badge',
  ALUMNI:  'badge',
  ADMIN:   'badge',
}

const ROLE_STYLE: Record<string, { bg: string; color: string }> = {
  STUDENT: { bg: '#DBEAFE', color: '#1E40AF' },
  STAFF:   { bg: '#D1FAE5', color: '#065F46' },
  ALUMNI:  { bg: '#FEF3C7', color: '#92400E' },
  ADMIN:   { bg: '#EDE9FE', color: '#5B21B6' },
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL')
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null)

  const fetchUsers = async (role?: string) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (role && role !== 'ALL') params.set('role', role)
      const res = await axios.get(`/api/admin/users?${params}`)
      setUsers(res.data.data || [])
    } catch {
      setError("Failed to load users.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers(roleFilter) }, [roleFilter])

  const handleVerify = async (userId: string, verified: boolean) => {
    setActionLoading(userId)
    try {
      await axios.patch("/api/admin/users", { userId, verified })
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, verified } : u))
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update user.")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (user: User) => {
    setActionLoading(user.id)
    setConfirmDelete(null)
    try {
      await axios.delete("/api/admin/users", { data: { userId: user.id } })
      setUsers(prev => prev.filter(u => u.id !== user.id))
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete user.")
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.idNumber.includes(search) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const roleCounts: Record<string, number> = { ALL: users.length }
  for (const u of users) roleCounts[u.role] = (roleCounts[u.role] ?? 0) + 1

  return (
    <div>
      {/* Filter + search bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex gap-1 p-1 rounded-xl flex-wrap" style={{ backgroundColor: '#F3F4F6' }}>
          {(['ALL','STUDENT','STAFF','ALUMNI','ADMIN'] as RoleFilter[]).map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                backgroundColor: roleFilter === r ? '#fff' : 'transparent',
                color: roleFilter === r ? 'var(--color-secondary)' : '#6B7280',
                boxShadow: roleFilter === r ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                border: 'none', cursor: 'pointer',
              }}>
              {r === 'ALL' ? `All (${roleCounts.ALL ?? 0})` : `${r.charAt(0) + r.slice(1).toLowerCase()} (${roleCounts[r] ?? 0})`}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, ID, or email..."
          className="flex-1"
          style={{ minWidth: 0 }}
        />
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="spinner" style={{ width: '2.5rem', height: '2.5rem', borderWidth: '4px' }} />
        </div>
      )}

      {error && <ErrorCard message={error} onRetry={() => fetchUsers(roleFilter)} />}

      {!loading && !error && filtered.length === 0 && (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">👤</div>
          <p className="font-semibold" style={{ color: '#6B7280' }}>No users found.</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'rgba(128,0,32,0.05)', borderBottom: '1px solid var(--color-border)' }}>
                  {['Name', 'ID Number', 'Email', 'Role', 'College / Course', 'Verified', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide"
                      style={{ color: 'var(--color-secondary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((user, i) => {
                  const rs = ROLE_STYLE[user.role] ?? { bg: '#F3F4F6', color: '#374151' }
                  return (
                    <tr key={user.id}
                      style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: i % 2 === 0 ? '#fff' : 'rgba(0,0,0,0.01)' }}
                      className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: 'rgba(128,0,32,0.1)', color: 'var(--color-secondary)' }}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{user.idNumber}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{user.email}</td>
                      <td className="px-4 py-3">
                        <span className="badge text-xs" style={{ backgroundColor: rs.bg, color: rs.color }}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>
                        {user.college ?? '—'}{user.course ? ` · ${user.course}` : ''}
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge text-xs"
                          style={{ backgroundColor: user.verified ? '#D1FAE5' : '#FEE2E2', color: user.verified ? '#065F46' : '#991B1B' }}>
                          {user.verified ? '✓ Verified' : '✕ Unverified'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#9CA3AF' }}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {!user.verified ? (
                            <button
                              onClick={() => handleVerify(user.id, true)}
                              disabled={actionLoading === user.id}
                              className="btn text-xs px-2 py-1"
                              style={{ backgroundColor: '#D1FAE5', color: '#065F46', border: 'none' }}>
                              {actionLoading === user.id ? '...' : 'Verify'}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleVerify(user.id, false)}
                              disabled={actionLoading === user.id}
                              className="btn text-xs px-2 py-1"
                              style={{ backgroundColor: '#FEF3C7', color: '#92400E', border: 'none' }}>
                              {actionLoading === user.id ? '...' : 'Revoke'}
                            </button>
                          )}
                          <button
                            onClick={() => setConfirmDelete(user)}
                            disabled={actionLoading === user.id}
                            className="btn text-xs px-2 py-1"
                            style={{ backgroundColor: '#FEE2E2', color: '#991B1B', border: 'none' }}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={e => { if (e.target === e.currentTarget) setConfirmDelete(null) }}>
          <div className="card w-full max-w-sm p-6 fade-in text-center">
            <div className="text-3xl mb-3">⚠</div>
            <h2 className="font-extrabold text-lg mb-1" style={{ color: 'var(--color-secondary)' }}>Delete User</h2>
            <p className="text-sm mb-5" style={{ color: '#6B7280' }}>
              Are you sure you want to delete <strong>{confirmDelete.name}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => handleDelete(confirmDelete)}
                className="btn text-sm px-5 py-2"
                style={{ backgroundColor: '#991B1B', color: '#fff', border: 'none' }}>
                Yes, Delete
              </button>
              <button onClick={() => setConfirmDelete(null)} className="btn btn-outline text-sm px-5 py-2">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

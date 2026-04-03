'use client'
import axios from "axios"
import { useEffect, useRef, useState } from "react"

interface Notification {
  id: string
  message: string
  isRead: boolean
  type: string
  createdAt: string
  request?: {
    id: string
    queueNumber: number
    status: string
    documentType: { name: string }
  }
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const fetchNotifications = async () => {
    try {
      const res = await axios.get("/api/student/notifications")
      setNotifications(res.data.data || [])
    } catch { /* silent */ }
  }

  useEffect(() => {
    let ignore = false
    const load = async () => {
      try {
        const res = await axios.get("/api/student/notifications")
        if (!ignore) setNotifications(res.data.data || [])
      } catch { /* silent */ }
    }
    load()
    const interval = setInterval(() => {
      ignore = true
      load().then(() => { ignore = false })
    }, 30000)
    return () => {
      ignore = true
      clearInterval(interval)
    }
  }, [])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const unread = notifications.filter(n => !n.isRead)

  const markRead = async (ids: string[]) => {
    if (!ids.length) return
    try {
      await axios.patch("/api/student/notifications", { notificationIds: ids })
      setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, isRead: true } : n))
    } catch { /* silent */ }
  }

  const handleOpen = () => {
    setOpen(o => !o)
    if (!open && unread.length) markRead(unread.map(n => n.id))
  }

  const TYPE_ICON: Record<string, string> = {
    STATUS_UPDATE: '🔄',
    PICKUP_READY:  '📦',
    QUEUE_ROLLOVER:'🔢',
    GENERAL:       '📢',
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={handleOpen}
        className="relative flex items-center justify-center w-9 h-9 rounded-full transition-all"
        style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer' }}>
        <span className="text-lg">🔔</span>
        {unread.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--color-secondary)' }}>
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl shadow-xl overflow-hidden z-50"
          style={{ backgroundColor: '#fff', border: '1px solid var(--color-border)', top: '100%' }}>
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid var(--color-border)' }}>
            <span className="font-bold text-sm" style={{ color: 'var(--color-secondary)' }}>Notifications</span>
            {notifications.some(n => !n.isRead) && (
              <button onClick={() => markRead(notifications.map(n => n.id))}
                className="text-xs font-medium" style={{ color: 'var(--color-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: '20rem' }}>
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm" style={{ color: '#9CA3AF' }}>No notifications yet.</div>
            ) : (
              notifications.map(n => (
                <div key={n.id} className="flex gap-3 px-4 py-3 transition-colors"
                  style={{
                    borderBottom: '1px solid var(--color-border)',
                    backgroundColor: n.isRead ? '#fff' : 'rgba(128,0,32,0.03)',
                  }}>
                  <span className="text-lg shrink-0 mt-0.5">{TYPE_ICON[n.type] ?? '📢'}</span>
                  <div className="flex-1 min-w-0">
                    {n.request && (
                      <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--color-secondary)' }}>
                        {n.request.documentType.name} · Queue #{n.request.queueNumber}
                      </p>
                    )}
                    <p className="text-sm" style={{ color: '#374151' }}>{n.message}</p>
                    <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                      {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {!n.isRead && (
                    <div className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                      style={{ backgroundColor: 'var(--color-secondary)' }} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

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

const TYPE_ICON: Record<string, string> = {
  STATUS_UPDATE: '🔄',
  PICKUP_READY:  '📦',
  QUEUE_ROLLOVER:'🔢',
  GENERAL:       '📢',
}

const TYPE_COLOR: Record<string, string> = {
  STATUS_UPDATE: '#1E40AF',
  PICKUP_READY:  '#065F46',
  QUEUE_ROLLOVER:'#92400E',
  GENERAL:       '#374151',
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const res = await axios.get("/api/student/notifications")
        if (active) setNotifications(res.data.data || [])
      } catch { /* silent */ }
    }
    load()
    const interval = setInterval(load, 30000)
    return () => { active = false; clearInterval(interval) }
  }, [])

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
    const next = !open
    setOpen(next)
    if (next && unread.length) markRead(unread.map(n => n.id))
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button onClick={handleOpen}
        className="relative flex items-center justify-center w-9 h-9 rounded-full transition-all"
        style={{ backgroundColor: open ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer' }}>
        <span className="text-base">🔔</span>
        {unread.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full flex items-center justify-center text-xs font-black"
            style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--color-secondary)', fontSize: '0.6rem' }}>
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        )}
      </button>

      {/* Desktop dropdown */}
      {open && (
        <>
          {/* Mobile overlay */}
          <div className="sm:hidden fixed inset-0 z-40" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
            onClick={() => setOpen(false)} />

          {/* Panel — bottom sheet on mobile, dropdown on desktop */}
          <div className="
            fixed sm:absolute
            bottom-0 sm:bottom-auto
            left-0 sm:left-auto
            right-0
            sm:top-full sm:mt-2
            sm:w-80
            z-50
            rounded-t-2xl sm:rounded-xl
            overflow-hidden
            shadow-2xl
          " style={{ backgroundColor: '#fff', border: '1px solid var(--color-border)' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5"
              style={{ borderBottom: '1px solid var(--color-border)', background: 'linear-gradient(135deg, var(--color-secondary), var(--color-dark))' }}>
              <div className="flex items-center gap-2">
                <span className="text-base">🔔</span>
                <span className="font-black text-sm text-white">Notifications</span>
                {unread.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-xs font-black"
                    style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--color-secondary)' }}>
                    {unread.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {notifications.some(n => !n.isRead) && (
                  <button onClick={() => markRead(notifications.map(n => n.id))}
                    className="text-xs font-semibold px-2 py-1 rounded-lg"
                    style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', cursor: 'pointer' }}>
                    Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)}
                  className="sm:hidden text-white text-lg leading-none"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto" style={{ maxHeight: '60vh' }}>
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <div className="text-3xl mb-2">🔕</div>
                  <p className="text-sm font-semibold" style={{ color: '#6B7280' }}>No notifications yet</p>
                  <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>We&apos;ll notify you when your request status changes.</p>
                </div>
              ) : (
                notifications.map((n, i) => (
                  <div key={n.id}
                    className="flex gap-3 px-4 py-3.5 transition-colors"
                    style={{
                      borderBottom: i < notifications.length - 1 ? '1px solid var(--color-border)' : 'none',
                      backgroundColor: n.isRead ? '#fff' : 'rgba(128,0,32,0.025)',
                    }}>
                    {/* Icon */}
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                      style={{ backgroundColor: n.isRead ? '#F3F4F6' : 'rgba(128,0,32,0.07)' }}>
                      {TYPE_ICON[n.type] ?? '📢'}
                    </div>

                    <div className="flex-1 min-w-0">
                      {n.request && (
                        <p className="text-xs font-bold mb-0.5 truncate"
                          style={{ color: TYPE_COLOR[n.type] ?? 'var(--color-secondary)' }}>
                          {n.request.documentType.name} · Queue #{n.request.queueNumber}
                        </p>
                      )}
                      <p className="text-sm leading-snug" style={{ color: '#1F2937' }}>{n.message}</p>
                      <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{formatTime(n.createdAt)}</p>
                    </div>

                    {!n.isRead && (
                      <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                        style={{ backgroundColor: 'var(--color-secondary)' }} />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3"
      style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base mb-1"
        style={{ backgroundColor: 'var(--color-secondary)', color: 'var(--color-tertiary)' }}>
        SQ
      </div>
      <div className="spinner" style={{ width: '1.75rem', height: '1.75rem', borderWidth: '3px' }} />
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>
        Loading
      </p>
    </div>
  )
}

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] gap-3">
      <div className="spinner" style={{ width: '2rem', height: '2rem', borderWidth: '3px' }} />
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>
        Loading
      </p>
    </div>
  )
}

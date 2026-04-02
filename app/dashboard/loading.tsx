export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] gap-4">
      <div className="spinner" style={{ width: '2.5rem', height: '2.5rem', borderWidth: '4px' }} />
      <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>Loading dashboard...</p>
    </div>
  )
}

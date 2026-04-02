interface ErrorCardProps {
  message: string
  onRetry?: () => void
}

export default function ErrorCard({ message, onRetry }: ErrorCardProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl text-center"
      style={{ backgroundColor: '#FEF2F2', border: '1.5px solid #FECACA' }}>
      <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
        style={{ backgroundColor: '#FEE2E2' }}>
        ⚠
      </div>
      <div>
        <p className="font-bold text-sm" style={{ color: '#991B1B' }}>Something went wrong</p>
        <p className="text-sm mt-0.5" style={{ color: '#B91C1C' }}>{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn text-sm px-4 py-2 mt-1"
          style={{ backgroundColor: '#991B1B', color: '#fff', border: 'none' }}>
          Try again
        </button>
      )}
    </div>
  )
}

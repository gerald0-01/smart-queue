import Navbar from "@/components/Navbar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen w-full pt-16 sm:pt-20 has-bottom-nav sm:pb-0"
        style={{ backgroundColor: 'var(--color-bg)' }}>
        {children}
      </main>
    </>
  )
}

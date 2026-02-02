export default function AgencyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b" style={{ backgroundColor: '#3617CE' }}>
        <div className="container mx-auto px-4 py-4">
          <div>
            <h1 className="text-white text-2xl font-bold">T-Bridge</h1>
            <p className="text-white/70 text-sm mt-1">AI Dashboard</p>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}

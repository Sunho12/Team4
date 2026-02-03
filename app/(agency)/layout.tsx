import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AgencyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b" style={{ backgroundColor: '#3617CE' }}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/search" className="cursor-pointer">
              <div>
                <h1 className="text-white text-2xl font-bold">T-Bridge</h1>
                <p className="text-white/70 text-sm mt-1">AI Dashboard</p>
              </div>
            </Link>
            <Link href="/">
              <Button variant="outline" size="sm" className="bg-white/10 text-white hover:bg-white/20 border-white/30">
                초기화면
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}

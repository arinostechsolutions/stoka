import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { warmUpDB } from '@/lib/db-warmup'

// Warm-up da conexão com o banco em background (não bloqueia)
warmUpDB().catch(() => {
  // Ignora erros no warm-up
})

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <aside className="hidden md:block">
        <Sidebar />
      </aside>
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <div className="container mx-auto p-4 md:p-6">{children}</div>
      </main>
      <MobileNav />
    </div>
  )
}


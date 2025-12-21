import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Sidebar } from '@/components/layout/sidebar'
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
    <div className="flex h-screen flex-col md:flex-row overflow-hidden fixed inset-0">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0">
        <div className="mx-auto max-w-7xl px-4 md:px-6 pt-4 md:pt-6 pb-0">{children}</div>
      </main>
    </div>
  )
}


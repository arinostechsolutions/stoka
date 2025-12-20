'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { LayoutDashboard, Package, ArrowLeftRight, Settings, LogOut, Building2, BarChart3, FileText, Store, Users, Megaphone } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Vitrine', href: '/vitrine', icon: Store },
  { name: 'Produtos', href: '/produtos', icon: Package },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Fornecedores', href: '/fornecedores', icon: Building2 },
  { name: 'Campanhas', href: '/campanhas', icon: Megaphone },
  { name: 'Movimentações', href: '/movimentacoes', icon: ArrowLeftRight },
  { name: 'Notas Fiscais', href: '/notas-fiscais', icon: FileText },
  { name: 'Relatórios', href: '/relatorios', icon: BarChart3 },
  { name: 'Configurações', href: '/settings', icon: Settings },
]

interface SidebarContentProps {
  onLinkClick?: () => void
  showLogo?: boolean
}

export function SidebarContent({ onLinkClick, showLogo = true }: SidebarContentProps) {
  const pathname = usePathname()
  const router = useRouter()

  // Prefetch de todas as rotas ao montar o componente
  useEffect(() => {
    navigation.forEach((item) => {
      router.prefetch(item.href)
    })
  }, [router])

  return (
    <>
      {showLogo && (
        <div className="flex h-16 items-center border-b px-6">
          <h1 className="text-xl font-bold">Stoka</h1>
        </div>
      )}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              prefetch={true}
              onClick={onLinkClick}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </>
  )
}


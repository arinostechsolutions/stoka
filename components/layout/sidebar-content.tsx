'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LayoutDashboard, Package, ArrowLeftRight, Settings, LogOut, Building2, BarChart3, FileText, Store, Users, Megaphone, Globe, Crown, Lock } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PlanIndicator } from './plan-indicator'

// Definir quais rotas são de cada plano
type PlanType = 'starter' | 'premium' | 'all'

interface NavItem {
  name: string
  href: string
  icon: any
  plan: PlanType // 'all' = disponível em todos os planos
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, plan: 'all' },
  { name: 'Produtos', href: '/produtos', icon: Package, plan: 'all' },
  { name: 'Fornecedores', href: '/fornecedores', icon: Building2, plan: 'all' },
  { name: 'Movimentações', href: '/movimentacoes', icon: ArrowLeftRight, plan: 'all' },
  { name: 'Notas Fiscais', href: '/notas-fiscais', icon: FileText, plan: 'all' },
  { name: 'Relatórios', href: '/relatorios', icon: BarChart3, plan: 'all' },
  { name: 'Clientes', href: '/clientes', icon: Users, plan: 'premium' },
  { name: 'Vitrine', href: '/vitrine', icon: Store, plan: 'premium' },
  { name: 'Minha Loja', href: '/minha-loja', icon: Globe, plan: 'premium' },
  { name: 'Campanhas', href: '/campanhas', icon: Megaphone, plan: 'premium' },
  { name: 'Configurações', href: '/settings', icon: Settings, plan: 'all' },
]

interface SidebarContentProps {
  onLinkClick?: () => void
  showLogo?: boolean
}

interface SubscriptionData {
  plan: 'starter' | 'premium' | null
  isActive: boolean
  isTrialing: boolean
}

export function SidebarContent({ onLinkClick, showLogo = true }: SidebarContentProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/stripe/subscription')
      if (response.ok) {
        const data = await response.json()
        setSubscription(data)
      }
    } catch (error) {
      console.error('Erro ao buscar subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  // Prefetch de todas as rotas ao montar o componente
  useEffect(() => {
    navigation.forEach((item) => {
      router.prefetch(item.href)
    })
  }, [router])

  // Verificar se o usuário tem acesso à funcionalidade
  const hasAccess = (itemPlan: PlanType): boolean => {
    if (itemPlan === 'all') return true
    if (!subscription?.plan) return false
    if (subscription.plan === 'premium') return true // Premium tem acesso a tudo
    if (subscription.plan === 'starter' && itemPlan === 'starter') return true
    return false
  }

  // Separar itens disponíveis e bloqueados
  const availableItems = navigation.filter(item => hasAccess(item.plan))
  const premiumItems = navigation.filter(item => item.plan === 'premium' && !hasAccess(item.plan))

  return (
    <>
      {showLogo && (
        <div className="flex h-16 items-center border-b px-6">
          <h1 className="text-xl font-bold">Stoka</h1>
        </div>
      )}
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {/* Itens disponíveis */}
        {availableItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          const Icon = item.icon
          const isPremiumFeature = item.plan === 'premium'
          
          return (
            <Link
              key={item.name}
              href={item.href}
              prefetch={true}
              onClick={onLinkClick}
              data-tour={item.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-')}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1">{item.name}</span>
              {isPremiumFeature && (
                <Crown className="h-3.5 w-3.5 text-amber-500" />
              )}
            </Link>
          )
        })}

        {/* Seção de itens Premium bloqueados */}
        {premiumItems.length > 0 && (
          <>
            <div className="pt-4 pb-2">
              <div className="flex items-center gap-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Crown className="h-3.5 w-3.5 text-amber-500" />
                <span>Premium</span>
              </div>
            </div>
            {premiumItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href="/precos"
                  onClick={onLinkClick}
                  data-tour={item.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-')}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground/50 hover:bg-accent/50 transition-colors group"
                >
                  <Icon className="h-5 w-5" />
                  <span className="flex-1">{item.name}</span>
                  <Lock className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100" />
                </Link>
              )
            })}
          </>
        )}
      </nav>
      <div className="border-t">
        <PlanIndicator />
        <div className="px-4 pb-4">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
    </>
  )
}

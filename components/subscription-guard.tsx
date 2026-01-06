'use client'

import { useState, useEffect, ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AlertCircle, CreditCard, Clock, XCircle, Crown, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import Link from 'next/link'

interface SubscriptionData {
  isActive: boolean
  isTrialing: boolean
  plan: 'starter' | 'premium' | null
  status: string | null
  daysLeftInTrial: number | null
  currentPeriodEnd: string | null
  trialEndsAt: string | null
}

interface SubscriptionGuardProps {
  children: ReactNode
}

// Rotas permitidas sem assinatura
const ALLOWED_ROUTES = ['/settings', '/precos', '/checkout']

// Rotas que são exclusivas do plano Premium
const PREMIUM_ONLY_ROUTES = ['/clientes', '/vitrine', '/minha-loja', '/campanhas']

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [blockReason, setBlockReason] = useState<'no_subscription' | 'expired' | 'past_due' | 'premium_required' | null>(null)

  useEffect(() => {
    checkAccess()
  }, [pathname])

  const checkAccess = async () => {
    try {
      const response = await fetch('/api/stripe/subscription')
      if (!response.ok) {
        setLoading(false)
        return
      }

      const data: SubscriptionData = await response.json()
      setSubscription(data)

      // Verificar se a rota atual é permitida sem assinatura
      const isAllowedRoute = ALLOWED_ROUTES.some(route => pathname.startsWith(route))
      
      if (isAllowedRoute) {
        setBlockReason(null)
        setLoading(false)
        return
      }

      const now = new Date()
      
      // Sem plano
      if (!data.plan || !data.status) {
        setBlockReason('no_subscription')
        setLoading(false)
        return
      }

      // Verificar se tem acesso ativo
      let hasActiveAccess = false

      // Em trial
      if (data.status === 'trialing' && data.trialEndsAt) {
        hasActiveAccess = new Date(data.trialEndsAt) > now
      }
      // Ativo
      else if (data.status === 'active') {
        hasActiveAccess = true
      }
      // Cancelado - verificar se ainda está no período
      else if (data.status === 'canceled' && data.currentPeriodEnd) {
        hasActiveAccess = new Date(data.currentPeriodEnd) > now
      }
      // Pagamento atrasado
      else if (data.status === 'past_due') {
        setBlockReason('past_due')
        setLoading(false)
        return
      }

      if (!hasActiveAccess) {
        setBlockReason('expired')
        setLoading(false)
        return
      }

      // Verificar se é rota premium e usuário tem plano starter
      const isPremiumRoute = PREMIUM_ONLY_ROUTES.some(route => pathname.startsWith(route))
      if (isPremiumRoute && data.plan === 'starter') {
        setBlockReason('premium_required')
        setLoading(false)
        return
      }

      // Tem acesso!
      setBlockReason(null)
      setLoading(false)

    } catch (error) {
      console.error('Erro ao verificar subscription:', error)
      setLoading(false)
    }
  }

  // Loading state
  if (loading) {
    return <>{children}</>
  }

  // Tem acesso - mostrar conteúdo normal
  if (!blockReason) {
    return <>{children}</>
  }

  // Bloqueio por funcionalidade Premium
  if (blockReason === 'premium_required') {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          {/* Ícone */}
          <div className="mx-auto w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center">
            <Crown className="h-10 w-10 text-amber-500" />
          </div>

          {/* Título */}
          <div>
            <h2 className="text-2xl font-bold mb-2">
              Funcionalidade Premium
            </h2>
            <p className="text-muted-foreground">
              Esta funcionalidade está disponível apenas no plano Premium.
            </p>
          </div>

          {/* Benefícios */}
          <div className="bg-muted/50 rounded-lg p-4 text-left">
            <p className="text-sm font-medium mb-3">Com o Premium você tem acesso a:</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-500" />
                Cadastro completo de clientes
              </li>
              <li className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-500" />
                Vitrine online com preços
              </li>
              <li className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-500" />
                Minha Loja + Analytics
              </li>
              <li className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-500" />
                Campanhas e promoções
              </li>
            </ul>
          </div>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link href="/precos">Fazer Upgrade</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">Voltar ao Dashboard</Link>
            </Button>
          </div>

          {/* Preço */}
          <p className="text-sm text-muted-foreground">
            Premium por apenas <strong className="text-foreground">R$ 79,90/mês</strong>
          </p>
        </div>
      </div>
    )
  }

  // Sem acesso por outros motivos (no_subscription, expired, past_due)
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        {/* Ícone */}
        <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center">
          {blockReason === 'past_due' ? (
            <CreditCard className="h-10 w-10 text-destructive" />
          ) : blockReason === 'expired' ? (
            <Clock className="h-10 w-10 text-amber-500" />
          ) : (
            <XCircle className="h-10 w-10 text-muted-foreground" />
          )}
        </div>

        {/* Título */}
        <div>
          <h2 className="text-2xl font-bold mb-2">
            {blockReason === 'past_due' 
              ? 'Pagamento Pendente' 
              : blockReason === 'expired'
                ? 'Assinatura Expirada'
                : 'Assinatura Necessária'
            }
          </h2>
          <p className="text-muted-foreground">
            {blockReason === 'past_due'
              ? 'Seu pagamento está atrasado. Atualize seu método de pagamento para continuar.'
              : blockReason === 'expired'
                ? 'Sua assinatura expirou. Escolha um plano para continuar usando o sistema.'
                : 'Você ainda não possui um plano ativo. Escolha um plano para começar.'
            }
          </p>
        </div>

        {/* Alerta específico */}
        {blockReason === 'past_due' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Ação necessária</AlertTitle>
            <AlertDescription>
              Atualize seu método de pagamento nas configurações para continuar usando o sistema.
            </AlertDescription>
          </Alert>
        )}

        {/* Botões */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {blockReason === 'past_due' ? (
            <Button asChild>
              <Link href="/settings">Atualizar Pagamento</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/precos">Ver Planos</Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href="/settings">Configurações</Link>
          </Button>
        </div>

        {/* Info adicional */}
        <p className="text-xs text-muted-foreground">
          {blockReason === 'expired' 
            ? 'Escolha um novo plano para recuperar acesso aos seus dados.'
            : 'Seus dados estão seguros e serão mantidos.'
          }
        </p>
      </div>
    </div>
  )
}

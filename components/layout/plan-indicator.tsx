'use client'

import Link from 'next/link'
import { Crown, Sparkles, Clock, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useSubscription } from '@/hooks/useSubscription'

export function PlanIndicator() {
  const { data: subscription, isLoading: loading } = useSubscription()

  // Calcular dias até próxima cobrança
  const getDaysUntilBilling = () => {
    if (!subscription?.currentPeriodEnd) return null
    const now = new Date()
    const periodEnd = new Date(subscription.currentPeriodEnd)
    const diffTime = periodEnd.getTime() - now.getTime()
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return days > 0 ? days : 0
  }

  if (loading) {
    return (
      <div className="px-4 py-3">
        <div className="h-16 bg-muted/50 rounded-lg animate-pulse" />
      </div>
    )
  }

  // Sem plano
  if (!subscription?.isActive && !subscription?.isTrialing) {
    return (
      <Link href="/precos" className="block px-4 py-3">
        <div className="rounded-lg border border-dashed border-muted-foreground/30 p-3 hover:border-primary/50 hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Sem plano ativo</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Clique para escolher um plano
          </p>
        </div>
      </Link>
    )
  }

  const daysUntilBilling = getDaysUntilBilling()
  const isPremium = subscription?.plan === 'premium'
  const isTrialing = subscription?.isTrialing
  const isPastDue = subscription?.status === 'past_due'

  return (
    <div className="px-4 py-3">
      <div
        className={cn(
          'rounded-lg p-3 transition-colors',
          isPastDue 
            ? 'bg-destructive/10 border border-destructive/30' 
            : isTrialing 
              ? 'bg-blue-500/10 border border-blue-500/30'
              : isPremium 
                ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30' 
                : 'bg-primary/10 border border-primary/30'
        )}
      >
        {/* Plano e Status */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {isPremium ? (
              <Crown className="h-4 w-4 text-amber-500" />
            ) : (
              <Sparkles className="h-4 w-4 text-primary" />
            )}
            <span className="text-sm font-semibold">
              {isPremium ? 'Premium' : 'Starter'}
            </span>
          </div>
          
          {isTrialing && (
            <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-600 border-0">
              Trial
            </Badge>
          )}
          
          {isPastDue && (
            <Badge variant="destructive" className="text-xs">
              Atrasado
            </Badge>
          )}
          
          {!isTrialing && !isPastDue && subscription?.isActive && (
            <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-600 border-0">
              Ativo
            </Badge>
          )}
        </div>

        {/* Dias restantes */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {isPastDue ? (
            <span className="text-destructive">Pagamento pendente</span>
          ) : isTrialing && subscription.daysLeftInTrial !== null ? (
            <span>
              {subscription.daysLeftInTrial} {subscription.daysLeftInTrial === 1 ? 'dia' : 'dias'} de trial
            </span>
          ) : daysUntilBilling !== null ? (
            <span>
              Renova em {daysUntilBilling} {daysUntilBilling === 1 ? 'dia' : 'dias'}
            </span>
          ) : null}
        </div>

        {/* Link para gerenciar */}
        {isPastDue && (
          <Link 
            href="/settings" 
            className="text-xs text-destructive hover:underline mt-2 block"
          >
            Atualizar pagamento →
          </Link>
        )}
      </div>
    </div>
  )
}


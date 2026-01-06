'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { X, Clock, AlertTriangle, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface SubscriptionData {
  isActive: boolean
  isTrialing: boolean
  plan: 'starter' | 'premium' | null
  status: string | null
  daysLeftInTrial: number | null
  currentPeriodEnd: string | null
}

export function SubscriptionBanner() {
  const pathname = usePathname()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [dismissed, setDismissed] = useState(false)
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

  // Não mostrar em certas páginas
  if (pathname.startsWith('/settings') || pathname.startsWith('/precos') || pathname.startsWith('/checkout')) {
    return null
  }

  if (loading || dismissed || !subscription) {
    return null
  }

  const now = new Date()
  
  // Calcular dias restantes
  const getDaysLeft = () => {
    if (subscription.isTrialing && subscription.daysLeftInTrial !== null) {
      return subscription.daysLeftInTrial
    }
    if (subscription.currentPeriodEnd) {
      const periodEnd = new Date(subscription.currentPeriodEnd)
      return Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    }
    return null
  }

  const daysLeft = getDaysLeft()

  // Banner para trial com poucos dias
  if (subscription.isTrialing && daysLeft !== null && daysLeft <= 3) {
    return (
      <div className="bg-blue-500 text-white px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 shrink-0" />
            <span>
              <strong>Seu teste gratuito termina em {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'}!</strong>
              {' '}Assine agora para não perder acesso.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="secondary">
              <Link href="/precos">Assinar Agora</Link>
            </Button>
            <button 
              onClick={() => setDismissed(true)}
              className="p-1 hover:bg-white/20 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Banner para assinatura cancelada
  if (subscription.status === 'canceled' && daysLeft !== null && daysLeft > 0) {
    return (
      <div className="bg-amber-500 text-white px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              <strong>Assinatura cancelada.</strong>
              {' '}Você ainda tem acesso por {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'}.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="secondary">
              <Link href="/settings">Reativar</Link>
            </Button>
            <button 
              onClick={() => setDismissed(true)}
              className="p-1 hover:bg-white/20 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Banner para pagamento atrasado
  if (subscription.status === 'past_due') {
    return (
      <div className="bg-destructive text-destructive-foreground px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm">
            <CreditCard className="h-4 w-4 shrink-0" />
            <span>
              <strong>Pagamento atrasado!</strong>
              {' '}Atualize seu método de pagamento para continuar usando.
            </span>
          </div>
          <Button asChild size="sm" variant="secondary">
            <Link href="/settings">Atualizar Pagamento</Link>
          </Button>
        </div>
      </div>
    )
  }

  return null
}


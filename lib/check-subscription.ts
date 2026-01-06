import { IUser } from './models/User'

export interface SubscriptionCheck {
  hasAccess: boolean
  reason: 'active' | 'trialing' | 'expired' | 'canceled' | 'no_subscription' | 'past_due'
  message: string
  daysLeft?: number
}

/**
 * Verifica se o usuário tem acesso ao sistema
 * Considera tanto o status quanto a data de expiração
 */
export function checkSubscriptionAccess(user: IUser | null): SubscriptionCheck {
  if (!user) {
    return {
      hasAccess: false,
      reason: 'no_subscription',
      message: 'Faça login para continuar',
    }
  }

  const status = user.subscriptionStatus
  const plan = user.plan
  const currentPeriodEnd = user.stripeCurrentPeriodEnd
  const trialEndsAt = user.trialEndsAt

  // Sem plano/status = sem acesso
  if (!status || !plan) {
    return {
      hasAccess: false,
      reason: 'no_subscription',
      message: 'Você ainda não possui um plano. Escolha um plano para começar a usar o sistema.',
    }
  }

  const now = new Date()

  // Verificar se está em trial
  if (status === 'trialing') {
    if (trialEndsAt && new Date(trialEndsAt) > now) {
      const daysLeft = Math.ceil((new Date(trialEndsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return {
        hasAccess: true,
        reason: 'trialing',
        message: `Você está no período de teste. Restam ${daysLeft} dias.`,
        daysLeft,
      }
    } else {
      // Trial expirou
      return {
        hasAccess: false,
        reason: 'expired',
        message: 'Seu período de teste expirou. Escolha um plano para continuar usando o sistema.',
      }
    }
  }

  // Verificar se está ativo
  if (status === 'active') {
    if (currentPeriodEnd && new Date(currentPeriodEnd) > now) {
      const daysLeft = Math.ceil((new Date(currentPeriodEnd).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return {
        hasAccess: true,
        reason: 'active',
        message: 'Sua assinatura está ativa.',
        daysLeft,
      }
    }
  }

  // Verificar se está cancelado mas ainda no período
  if (status === 'canceled') {
    if (currentPeriodEnd && new Date(currentPeriodEnd) > now) {
      const daysLeft = Math.ceil((new Date(currentPeriodEnd).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return {
        hasAccess: true,
        reason: 'canceled',
        message: `Sua assinatura foi cancelada. Você ainda tem acesso por ${daysLeft} dias.`,
        daysLeft,
      }
    } else {
      // Período expirou
      return {
        hasAccess: false,
        reason: 'expired',
        message: 'Sua assinatura expirou. Escolha um plano para continuar usando o sistema.',
      }
    }
  }

  // Pagamento atrasado
  if (status === 'past_due') {
    return {
      hasAccess: false,
      reason: 'past_due',
      message: 'Seu pagamento está atrasado. Atualize seu método de pagamento para continuar.',
    }
  }

  // Status desconhecido ou outros casos
  return {
    hasAccess: false,
    reason: 'no_subscription',
    message: 'Escolha um plano para começar a usar o sistema.',
  }
}

/**
 * Rotas que são permitidas mesmo sem assinatura ativa
 */
export const ALLOWED_ROUTES_WITHOUT_SUBSCRIPTION = [
  '/settings',
  '/precos',
  '/checkout',
  '/api/stripe',
  '/api/auth',
]

/**
 * Verifica se uma rota é permitida sem assinatura
 */
export function isRouteAllowedWithoutSubscription(pathname: string): boolean {
  return ALLOWED_ROUTES_WITHOUT_SUBSCRIPTION.some(route => 
    pathname.startsWith(route) || pathname === route
  )
}


import { IUser, SubscriptionStatus, PlanType } from './models/User'

export interface SubscriptionInfo {
  isActive: boolean
  isTrialing: boolean
  plan: PlanType
  status: SubscriptionStatus | null
  trialEndsAt: Date | null
  currentPeriodEnd: Date | null
  daysLeftInTrial: number | null
  canAccessFeature: (feature: string) => boolean
}

// Features por plano
const PLAN_FEATURES: Record<string, string[]> = {
  starter: [
    'produtos',
    'fornecedores',
    'movimentacoes',
    'relatorios',
    'notas-fiscais',
  ],
  premium: [
    'produtos',
    'fornecedores',
    'movimentacoes',
    'relatorios',
    'notas-fiscais',
    'clientes',
    'vitrine',
    'minha-loja',
    'campanhas',
  ],
}

export function getSubscriptionInfo(user: IUser | null): SubscriptionInfo {
  if (!user) {
    return {
      isActive: false,
      isTrialing: false,
      plan: null,
      status: null,
      trialEndsAt: null,
      currentPeriodEnd: null,
      daysLeftInTrial: null,
      canAccessFeature: () => false,
    }
  }

  const status = user.subscriptionStatus || null
  const plan = user.plan || null
  const trialEndsAt = user.trialEndsAt || null
  const currentPeriodEnd = user.stripeCurrentPeriodEnd || null

  // Se o status for canceled, não considerar trial mesmo que trialEndsAt ainda não tenha passado
  // Isso garante que usuários que cancelam durante trial sejam bloqueados imediatamente
  const isCanceled = status === 'canceled'
  
  // Verificar se está em trial (apenas se não estiver cancelado)
  const isTrialing = !!(status === 'trialing' && !isCanceled && trialEndsAt && new Date(trialEndsAt) > new Date())

  // Verificar se subscription está ativa (canceled não é considerado ativo, mesmo durante trial)
  const activeStatuses: SubscriptionStatus[] = ['active', 'trialing']
  const isActive = status !== null && activeStatuses.includes(status) && !isCanceled

  // Calcular dias restantes no trial
  let daysLeftInTrial: number | null = null
  if (isTrialing && trialEndsAt) {
    const now = new Date()
    const trialEnd = new Date(trialEndsAt)
    const diffTime = trialEnd.getTime() - now.getTime()
    daysLeftInTrial = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (daysLeftInTrial < 0) daysLeftInTrial = 0
  }

  // Função para verificar acesso a features
  const canAccessFeature = (feature: string): boolean => {
    if (!isActive || !plan) return false
    const allowedFeatures = PLAN_FEATURES[plan] || []
    return allowedFeatures.includes(feature)
  }

  return {
    isActive,
    isTrialing,
    plan,
    status,
    trialEndsAt,
    currentPeriodEnd,
    daysLeftInTrial,
    canAccessFeature,
  }
}

// Helper para verificar se o plano permite acessar uma rota
export function canAccessRoute(user: IUser | null, route: string): boolean {
  const subscription = getSubscriptionInfo(user)

  // Mapear rotas para features
  const routeToFeature: Record<string, string> = {
    '/clientes': 'clientes',
    '/vitrine': 'vitrine',
    '/minha-loja': 'minha-loja',
    '/campanhas': 'campanhas',
    '/produtos': 'produtos',
    '/fornecedores': 'fornecedores',
    '/movimentacoes': 'movimentacoes',
    '/relatorios': 'relatorios',
    '/notas-fiscais': 'notas-fiscais',
  }

  const feature = routeToFeature[route]
  if (!feature) return true // Rotas não mapeadas são permitidas

  return subscription.canAccessFeature(feature)
}

// Formatar status para exibição
export function formatSubscriptionStatus(status: SubscriptionStatus | null): string {
  const statusMap: Record<SubscriptionStatus, string> = {
    trialing: 'Em período de teste',
    active: 'Ativa',
    canceled: 'Cancelada',
    incomplete: 'Pagamento pendente',
    incomplete_expired: 'Pagamento expirado',
    past_due: 'Pagamento atrasado',
    unpaid: 'Não pago',
    paused: 'Pausada',
  }

  return status ? statusMap[status] : 'Sem assinatura'
}

// Formatar nome do plano
export function formatPlanName(plan: PlanType): string {
  const planMap: Record<string, string> = {
    starter: 'Starter',
    premium: 'Premium',
  }

  return plan ? planMap[plan] : 'Sem plano'
}


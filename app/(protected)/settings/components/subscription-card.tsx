'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { CreditCard, ExternalLink, AlertCircle, Clock, XCircle, RefreshCcw, Crown, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface SubscriptionData {
  isActive: boolean
  isTrialing: boolean
  plan: 'starter' | 'premium' | null
  status: string | null
  statusFormatted: string
  planFormatted: string
  trialEndsAt: string | null
  currentPeriodEnd: string | null
  daysLeftInTrial: number | null
  hasStripeCustomer: boolean
}

export function SubscriptionCard() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [reactivateLoading, setReactivateLoading] = useState(false)

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
      console.error('Erro ao buscar assinatura:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    setPortalLoading(true)
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Erro ao acessar portal')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao acessar portal de pagamentos')
    } finally {
      setPortalLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    setCancelLoading(true)
    try {
      const response = await fetch('/api/stripe/cancel', {
        method: 'POST',
      })
      const data = await response.json()
      
      if (data.success) {
        await fetchSubscription()
        await update() // Atualizar sessão
        router.refresh()
        // Redirecionar para dashboard imediatamente
        router.push('/dashboard')
      } else {
        alert(data.error || 'Erro ao cancelar assinatura')
        setCancelLoading(false)
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao cancelar assinatura')
      setCancelLoading(false)
    }
  }

  const handleReactivateSubscription = async () => {
    setReactivateLoading(true)
    try {
      const response = await fetch('/api/stripe/cancel', {
        method: 'DELETE',
      })
      const data = await response.json()
      
      if (data.success) {
        alert('Assinatura reativada com sucesso!')
        await fetchSubscription()
        await update() // Atualizar sessão
        router.refresh()
      } else {
        alert(data.error || 'Erro ao reativar assinatura')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao reativar assinatura')
    } finally {
      setReactivateLoading(false)
    }
  }

  const getStatusBadge = () => {
    if (!subscription) return null

    switch (subscription.status) {
      case 'active':
        return <Badge className="bg-green-500 hover:bg-green-500">Ativa</Badge>
      case 'trialing':
        return <Badge className="bg-blue-500 hover:bg-blue-500">Período de Teste</Badge>
      case 'past_due':
        return <Badge variant="destructive">Pagamento Atrasado</Badge>
      case 'canceled':
        return <Badge variant="secondary">Cancelamento Agendado</Badge>
      default:
        return <Badge variant="outline">{subscription.statusFormatted}</Badge>
    }
  }

  const getPlanIcon = () => {
    if (subscription?.plan === 'premium') {
      return <Crown className="h-5 w-5 text-amber-500" />
    }
    return <Sparkles className="h-5 w-5 text-primary" />
  }

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
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  const daysUntilBilling = getDaysUntilBilling()
  const isCanceled = subscription?.status === 'canceled'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Assinatura
        </CardTitle>
        <CardDescription>
          Gerencie seu plano e método de pagamento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscription?.isActive || isCanceled ? (
          <>
            {/* Info do Plano */}
            <div className="rounded-lg border p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-3">
                  {/* Nome do Plano e Status */}
                  <div className="flex items-center gap-3">
                    {getPlanIcon()}
                    <span className="font-semibold text-xl">
                      Plano {subscription.planFormatted}
                    </span>
                    {getStatusBadge()}
                  </div>

                  {/* Preço */}
                  <div className="text-2xl font-bold">
                    R$ {subscription.plan === 'premium' ? '79,90' : '49,90'}
                    <span className="text-sm font-normal text-muted-foreground">/mês</span>
                  </div>
                  
                  {/* Dias restantes no trial */}
                  {subscription.isTrialing && subscription.daysLeftInTrial !== null && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 rounded-md px-3 py-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        <strong>{subscription.daysLeftInTrial}</strong> dias restantes no teste gratuito
                      </span>
                    </div>
                  )}

                  {/* Data da próxima cobrança ou fim do período */}
                  {subscription.currentPeriodEnd && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {isCanceled ? (
                        <span>
                          Acesso até{' '}
                          <strong>{format(new Date(subscription.currentPeriodEnd), "d 'de' MMMM", { locale: ptBR })}</strong>
                        </span>
                      ) : subscription.isTrialing ? (
                        <span>
                          Primeira cobrança em{' '}
                          <strong>{format(new Date(subscription.trialEndsAt || subscription.currentPeriodEnd), "d 'de' MMMM", { locale: ptBR })}</strong>
                        </span>
                      ) : (
                        <span>
                          Próxima cobrança em{' '}
                          <strong>{daysUntilBilling} dias</strong>
                          {' '}({format(new Date(subscription.currentPeriodEnd), "d 'de' MMMM", { locale: ptBR })})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Aviso de cancelamento */}
              {isCanceled && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800">Cancelamento agendado</p>
                    <p className="text-amber-700">
                      Sua assinatura será cancelada no final do período atual. 
                      Você ainda pode reativar antes dessa data.
                    </p>
                  </div>
                </div>
              )}

              {/* Aviso de pagamento atrasado */}
              {subscription.status === 'past_due' && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-destructive">Pagamento atrasado</p>
                    <p className="text-destructive/80">
                      Seu pagamento não foi processado. Atualize seu método de pagamento para continuar usando.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Botão de Upgrade (se Starter) */}
            {subscription.plan === 'starter' && !isCanceled && (
              <div className="p-4 rounded-lg bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Crown className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-900">Faça upgrade para o Premium</p>
                      <p className="text-sm text-amber-700">
                        Desbloqueie Top Clientes, Aniversários e muito mais!
                      </p>
                    </div>
                  </div>
                  <Button 
                    asChild
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md whitespace-nowrap"
                  >
                    <a href="/precos">
                      <Crown className="mr-2 h-4 w-4" />
                      Fazer Upgrade
                    </a>
                  </Button>
                </div>
              </div>
            )}

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Botão Gerenciar Pagamento */}
              <Button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                variant="outline"
                className="flex-1"
              >
                {portalLoading ? 'Carregando...' : 'Gerenciar Pagamento'}
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>

              {/* Botão Reativar (se cancelado) */}
              {isCanceled ? (
                <Button
                  onClick={handleReactivateSubscription}
                  disabled={reactivateLoading}
                  className="flex-1"
                >
                  {reactivateLoading ? 'Reativando...' : 'Reativar Assinatura'}
                  <RefreshCcw className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                /* Botão Cancelar - só mostra se não estiver cancelado */
                !isCanceled && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        disabled={cancelLoading}
                      >
                        {cancelLoading ? 'Cancelando...' : 'Cancelar Plano'}
                        <XCircle className="ml-2 h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancelar Assinatura?</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                          <p>
                            Tem certeza que deseja cancelar sua assinatura do <strong>Plano {subscription.planFormatted}</strong>?
                          </p>
                          <p>
                            Você ainda terá acesso até o final do período atual
                            {subscription.currentPeriodEnd && (
                              <> ({format(new Date(subscription.currentPeriodEnd), "d 'de' MMMM 'de' yyyy", { locale: ptBR })})</>
                            )}.
                          </p>
                          <p className="text-sm">
                            Você pode reativar a qualquer momento antes dessa data.
                          </p>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Voltar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleCancelSubscription}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Sim, Cancelar Assinatura
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )
              )}
            </div>
          </>
        ) : (
          /* Sem assinatura ativa */
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Nenhuma assinatura ativa</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Escolha um plano para ter acesso a todas as funcionalidades e gerenciar seu negócio com eficiência
            </p>
            <Button asChild size="lg">
              <a href="/precos">Ver Planos Disponíveis</a>
            </Button>
          </div>
        )}

        {/* Histórico de pagamentos (para quem já foi cliente) */}
        {subscription?.hasStripeCustomer && !subscription?.isActive && !isCanceled && (
          <div className="pt-4 border-t">
            <Button
              onClick={handleManageSubscription}
              disabled={portalLoading}
              variant="outline"
              size="sm"
            >
              {portalLoading ? 'Carregando...' : 'Ver Histórico de Pagamentos'}
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

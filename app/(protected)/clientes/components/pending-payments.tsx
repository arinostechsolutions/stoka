'use client'

import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Clock } from 'lucide-react'

interface PendingPaymentsProps {
  customerId: string
  onStatusChange?: (hasOverdue: boolean, hasPending: boolean) => void
}

async function fetchInstallments(customerId: string) {
  const res = await fetch(`/api/customers/${customerId}/installments`)
  if (!res.ok) throw new Error('Erro ao carregar parcelas')
  return res.json()
}

export function PendingPayments({ customerId, onStatusChange }: PendingPaymentsProps) {
  const { data: installments = [], isLoading } = useQuery({
    queryKey: ['installments', customerId],
    queryFn: () => fetchInstallments(customerId),
  })

  // Filtra parcelas pendentes (ignora entrada que tem installmentNumber = 0)
  const pendingInstallments = installments.filter((inst: any) => !inst.isPaid && inst.installmentNumber !== 0)
  const overdueInstallments = pendingInstallments.filter((inst: any) => {
    const dueDate = new Date(inst.dueDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return dueDate < today
  })

  const hasOverdue = overdueInstallments.length > 0
  const hasPending = pendingInstallments.length > 0

  // Usa useRef para rastrear o status anterior e evitar chamadas desnecessárias
  const prevStatusRef = useRef<{ hasOverdue: boolean; hasPending: boolean } | null>(null)

  // Notifica o componente pai sobre o status apenas quando mudar
  useEffect(() => {
    if (onStatusChange && !isLoading) {
      const prevStatus = prevStatusRef.current
      if (!prevStatus || prevStatus.hasOverdue !== hasOverdue || prevStatus.hasPending !== hasPending) {
        prevStatusRef.current = { hasOverdue, hasPending }
        onStatusChange(hasOverdue, hasPending)
      }
    }
  }, [hasOverdue, hasPending, isLoading, onStatusChange])

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4 animate-spin" />
        Carregando...
      </div>
    )
  }

  if (!hasPending) {
    return null
  }

  return (
    <div className="space-y-2">
      {hasOverdue && (
        <Badge variant="destructive" className="w-full justify-center">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Pagamento Atrasado ({overdueInstallments.length} parcela{overdueInstallments.length > 1 ? 's' : ''})
        </Badge>
      )}
      {hasPending && !hasOverdue && (
        <Badge variant="outline" className="w-full justify-center border-yellow-500 text-yellow-700">
          <Clock className="h-3 w-3 mr-1" />
          Pagamento Pendente ({pendingInstallments.length} parcela{pendingInstallments.length > 1 ? 's' : ''})
        </Badge>
      )}
    </div>
  )
}


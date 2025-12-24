'use client'

import { useState, useTransition, useMemo } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Package, Calendar, Clock, CreditCard, DollarSign, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useQuery } from '@tanstack/react-query'
import { AddPurchaseModal } from './add-purchase-modal'
import { associateMovementToCustomer } from '../../actions'

async function fetchInstallments(customerId: string) {
  const res = await fetch(`/api/customers/${customerId}/installments`)
  if (!res.ok) throw new Error('Erro ao buscar parcelas')
  return res.json()
}

interface Movement {
  _id: string
  productId: {
    _id: string
    name: string
    nome_vitrine?: string
    brand?: string
    size?: string
  }
  quantity: number
  salePrice?: number
  totalRevenue?: number
  paymentMethod?: 'cartao_credito' | 'cartao_debito' | 'pix' | 'pix_parcelado'
  createdAt: string
  saleGroupId?: string
  installmentsCount?: number
  notes?: string
  type?: 'saida' | 'entrada'
}

interface PurchaseHistoryCompactProps {
  customerId: string
  initialMovements: Movement[]
}

const paymentMethodLabels = {
  cartao_credito: 'Cartão de Crédito',
  cartao_debito: 'Cartão de Débito',
  pix: 'PIX',
  pix_parcelado: 'PIX Parcelado',
}

const ITEMS_PER_PAGE = 6

export function PurchaseHistoryCompact({ customerId, initialMovements }: PurchaseHistoryCompactProps) {
  const [movements, setMovements] = useState<Movement[]>(initialMovements)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isPending, startTransition] = useTransition()
  const [expandedSales, setExpandedSales] = useState<Set<string>>(new Set())

  // Busca parcelas do cliente
  const { data: installments = [] } = useQuery({
    queryKey: ['installments', customerId],
    queryFn: () => fetchInstallments(customerId),
  })

  // Agrupa movimentações por saleGroupId
  const groupedSales = useMemo(() => {
    console.log('=== PurchaseHistoryCompact: Agrupando movimentações ===')
    console.log('Total de movimentações:', movements.length)
    console.log('Movimentações:', movements.map(m => ({
      _id: m._id,
      saleGroupId: m.saleGroupId,
      productName: m.productId?.name,
      type: m.type,
      notes: m.notes,
    })))

    // Separa movimentações de entrada (pagamentos de parcelas) das vendas
    const installmentPayments = movements.filter((m: Movement) => 
      m.type === 'entrada' && m.notes && m.notes.includes('Pagamento de parcela')
    )
    const salesMovements = movements.filter((m: Movement) => 
      m.type !== 'entrada' || !m.notes || !m.notes.includes('Pagamento de parcela')
    )

    const grouped = new Map<string, {
      saleGroupId: string
      movements: Movement[]
      totalRevenue: number
      paymentMethod?: 'cartao_credito' | 'cartao_debito' | 'pix' | 'pix_parcelado'
      installmentsCount?: number
      createdAt: string
    }>()
    const ungrouped: Movement[] = []

    salesMovements.forEach((movement) => {
      if (movement.saleGroupId) {
        const groupId = movement.saleGroupId
        if (!grouped.has(groupId)) {
          grouped.set(groupId, {
            saleGroupId: groupId,
            movements: [],
            totalRevenue: 0,
            paymentMethod: movement.paymentMethod,
            installmentsCount: movement.installmentsCount,
            createdAt: movement.createdAt,
          })
        }
        const group = grouped.get(groupId)!
        group.movements.push(movement)
        group.totalRevenue += movement.totalRevenue || 0
      } else {
        ungrouped.push(movement)
      }
    })

    const result = [
      ...Array.from(grouped.values()),
      ...ungrouped.map(m => ({
        saleGroupId: undefined,
        movements: [m],
        totalRevenue: m.totalRevenue || 0,
        paymentMethod: m.paymentMethod,
        installmentsCount: m.installmentsCount,
        createdAt: m.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    console.log('Grupos criados:', result.length)
    console.log('Grupos com saleGroupId:', result.filter(r => r.saleGroupId).length)
    console.log('Grupos sem saleGroupId:', result.filter(r => !r.saleGroupId).length)

    return result
  }, [movements])

  const totalPages = Math.ceil(groupedSales.length / ITEMS_PER_PAGE)
  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    return groupedSales.slice(start, end)
  }, [groupedSales, currentPage])

  const toggleSale = (saleId: string) => {
    setExpandedSales(prev => {
      const newSet = new Set(prev)
      if (newSet.has(saleId)) {
        newSet.delete(saleId)
      } else {
        newSet.add(saleId)
      }
      return newSet
    })
  }

  const handleAssociate = async (movementId: string) => {
    const result = await associateMovementToCustomer(customerId, movementId)
    if (result.success) {
      // Recarrega a página para atualizar o histórico
      window.location.reload()
      return { success: true }
    } else {
      alert(result.error || 'Erro ao associar compra')
      return { success: false, error: result.error }
    }
  }

  // Reseta a página quando o modal fecha
  const handleModalOpenChange = (open: boolean) => {
    setIsHistoryModalOpen(open)
    if (!open) {
      setCurrentPage(1)
    }
  }

  return (
    <>
      <div className="flex justify-between items-center">
        <Button
          onClick={() => setIsHistoryModalOpen(true)}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Package className="h-4 w-4" />
          Ver Histórico ({groupedSales.length})
        </Button>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          size="sm"
          variant="outline"
          className="gap-1 h-7 text-xs"
        >
          <Plus className="h-3 w-3" />
          Adicionar
        </Button>
      </div>

      {/* Modal de Histórico */}
      <Dialog open={isHistoryModalOpen} onOpenChange={handleModalOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico de Compras</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {groupedSales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma compra registrada</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {paginatedSales.map((sale) => {
                    const saleId = sale.saleGroupId || sale.movements[0]._id
                    const isExpanded = expandedSales.has(saleId)
                    const isGrouped = sale.movements.length > 1
                    const date = new Date(sale.createdAt)
                    const dateStr = formatDate(date)
                    const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

                    // Calcula valor da entrada e status das parcelas para PIX Parcelado
                    let downPaymentAmount = 0
                    let paidInstallmentsCount = 0
                    let totalInstallmentsCount = sale.installmentsCount || 0
                    if (sale.paymentMethod === 'pix_parcelado' && sale.saleGroupId) {
                      const saleGroupIdStr = sale.saleGroupId.toString()
                      const relatedInstallments = installments.filter((inst: any) => {
                        if (!inst.saleGroupId) return false
                        const instSaleGroupId = inst.saleGroupId._id 
                          ? inst.saleGroupId._id.toString() 
                          : inst.saleGroupId.toString()
                        return instSaleGroupId === saleGroupIdStr
                      })
                      
                      // Conta parcelas pagas (EXCLUINDO entrada - parcela 0)
                      paidInstallmentsCount = relatedInstallments.filter((inst: any) => 
                        inst.isPaid && inst.installmentNumber !== 0
                      ).length
                      
                      // Busca entrada (parcela 0)
                      const downPayment = relatedInstallments.find((inst: any) => inst.installmentNumber === 0)
                      if (downPayment) {
                        downPaymentAmount = downPayment.isPaid && downPayment.paidAmount > 0
                          ? downPayment.paidAmount
                          : (downPayment.amount || 0)
                      }
                      
                      // Se não tiver installmentsCount na venda, usa o total de installments encontrados (excluindo entrada)
                      if (totalInstallmentsCount === 0 && relatedInstallments.length > 0) {
                        const maxTotal = Math.max(...relatedInstallments.map((inst: any) => inst.totalInstallments || 0))
                        // O totalInstallments já não inclui a entrada, então usamos direto
                        totalInstallmentsCount = maxTotal
                      }
                    }

                    // Calcula valor total a exibir (entrada se houver, senão totalRevenue)
                    const displayAmount = downPaymentAmount > 0 ? downPaymentAmount : sale.totalRevenue

                    return (
                      <Collapsible
                        key={saleId}
                        open={isExpanded}
                        onOpenChange={() => toggleSale(saleId)}
                      >
                        <Card className="border-muted">
                          <CollapsibleTrigger asChild>
                            <CardContent className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                  {isGrouped ? (
                                    <>
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-semibold text-base">
                                          Compra com {sale.movements.length} item{sale.movements.length !== 1 ? 's' : ''}
                                        </h4>
                                        {!isExpanded && (
                                          <span className="text-sm text-muted-foreground">
                                            ({sale.movements.slice(0, 2).map(m => m.productId.nome_vitrine || m.productId.name).join(', ')}
                                            {sale.movements.length > 2 && ` +${sale.movements.length - 2} mais`})
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                          <Calendar className="h-4 w-4" />
                                          <span>{dateStr}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Clock className="h-4 w-4" />
                                          <span>{timeStr}</span>
                                        </div>
                                        {sale.paymentMethod && (
                                          <div className="flex items-center gap-2">
                                            <CreditCard className="h-4 w-4" />
                                            <span>
                                              {paymentMethodLabels[sale.paymentMethod]}
                                              {sale.paymentMethod === 'pix_parcelado' && totalInstallmentsCount > 0 && (
                                                <span className="ml-1 text-xs">
                                                  ({paidInstallmentsCount}/{totalInstallmentsCount})
                                                </span>
                                              )}
                                            </span>
                                          </div>
                                        )}
                                        <div className="flex items-center gap-2 font-semibold text-primary">
                                          <DollarSign className="h-4 w-4" />
                                          <span>
                                            {sale.paymentMethod === 'pix_parcelado' && downPaymentAmount > 0 ? (
                                              <>
                                                Entrada: {formatCurrency(downPaymentAmount)}
                                                {sale.totalRevenue > downPaymentAmount && (
                                                  <span className="text-muted-foreground font-normal ml-1">
                                                    (Total: {formatCurrency(sale.totalRevenue)})
                                                  </span>
                                                )}
                                              </>
                                            ) : (
                                              formatCurrency(displayAmount)
                                            )}
                                          </span>
                                        </div>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <h4 className="font-semibold text-base">
                                        {sale.movements[0].productId.nome_vitrine || sale.movements[0].productId.name}
                                      </h4>
                                      {sale.movements[0].productId.name && sale.movements[0].productId.name !== (sale.movements[0].productId.nome_vitrine || sale.movements[0].productId.name) && (
                                        <p className="text-sm text-muted-foreground">{sale.movements[0].productId.name}</p>
                                      )}
                                      <div className="flex flex-wrap gap-2 mt-2">
                                        {sale.movements[0].productId.brand && (
                                          <Badge variant="outline" className="text-xs">
                                            {sale.movements[0].productId.brand}
                                          </Badge>
                                        )}
                                        {sale.movements[0].productId.size && (
                                          <Badge variant="outline" className="text-xs">
                                            Tamanho: {sale.movements[0].productId.size}
                                          </Badge>
                                        )}
                                        <Badge variant="outline" className="text-xs">
                                          Qtd: {sale.movements[0].quantity}
                                        </Badge>
                                      </div>
                                      <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                          <Calendar className="h-4 w-4" />
                                          <span>{dateStr}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                          <Clock className="h-4 w-4" />
                                          <span>{timeStr}</span>
                                        </div>
                                        {sale.paymentMethod && (
                                          <div className="flex items-center gap-2 text-muted-foreground">
                                            <CreditCard className="h-4 w-4" />
                                            <span>
                                              {paymentMethodLabels[sale.paymentMethod]}
                                              {sale.paymentMethod === 'pix_parcelado' && totalInstallmentsCount > 0 && (
                                                <span className="ml-1 text-xs">
                                                  ({paidInstallmentsCount}/{totalInstallmentsCount})
                                                </span>
                                              )}
                                            </span>
                                          </div>
                                        )}
                                        {displayAmount > 0 && (
                                          <div className="flex items-center gap-2 font-semibold text-primary">
                                            <DollarSign className="h-4 w-4" />
                                            <span>
                                              {sale.paymentMethod === 'pix_parcelado' && downPaymentAmount > 0 ? (
                                                <>
                                                  Entrada: {formatCurrency(downPaymentAmount)}
                                                  {sale.totalRevenue > downPaymentAmount && (
                                                    <span className="text-muted-foreground font-normal ml-1">
                                                      (Total: {formatCurrency(sale.totalRevenue)})
                                                    </span>
                                                  )}
                                                </>
                                              ) : (
                                                formatCurrency(displayAmount)
                                              )}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>
                                {isGrouped && (
                                  <div className="shrink-0">
                                    {isExpanded ? (
                                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                    ) : (
                                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                    )}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </CollapsibleTrigger>
                          {isGrouped && (
                            <CollapsibleContent>
                              <CardContent className="pt-0 pb-4 px-4">
                                <div className="space-y-3 border-t pt-3">
                                  {sale.movements.map((movement) => {
                                    const displayName = movement.productId.nome_vitrine || movement.productId.name
                                    return (
                                      <div key={movement._id} className="space-y-2">
                                        <h5 className="font-medium text-sm">{displayName}</h5>
                                        {movement.productId.name && movement.productId.name !== displayName && (
                                          <p className="text-xs text-muted-foreground">{movement.productId.name}</p>
                                        )}
                                        <div className="flex flex-wrap gap-2">
                                          {movement.productId.brand && (
                                            <Badge variant="outline" className="text-xs">
                                              {movement.productId.brand}
                                            </Badge>
                                          )}
                                          {movement.productId.size && (
                                            <Badge variant="outline" className="text-xs">
                                              Tamanho: {movement.productId.size}
                                            </Badge>
                                          )}
                                          <Badge variant="outline" className="text-xs">
                                            Qtd: {movement.quantity}
                                          </Badge>
                                          {movement.totalRevenue && (
                                            <Badge variant="outline" className="text-xs">
                                              {formatCurrency(movement.totalRevenue)}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </CardContent>
                            </CollapsibleContent>
                          )}
                        </Card>
                      </Collapsible>
                    )
                  })}
                </div>

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Página {currentPage} de {totalPages} ({groupedSales.length} compra{groupedSales.length !== 1 ? 's' : ''})
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Próxima
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AddPurchaseModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        customerId={customerId}
        onAssociate={handleAssociate}
      />
    </>
  )
}


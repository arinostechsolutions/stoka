'use client'

import { useState, useTransition, useMemo, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Package, Calendar, Clock, CreditCard, DollarSign, Megaphone, FileText, CheckCircle2, ChevronDown, ChevronUp, LayoutGrid, List } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { AddPurchaseModal } from './add-purchase-modal'
import { associateMovementToCustomer } from '../../actions'

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
  campaignId?: {
    _id: string
    name: string
  } | string | null
  notes?: string
  saleGroupId?: string | { toString(): string } | null
  installmentsCount?: number
  type?: 'entrada' | 'saida' | 'ajuste'
  createdAt: string
}

interface PurchaseHistoryProps {
  customerId: string
  initialMovements: Movement[]
}

interface GroupedSale {
  saleGroupId?: string
  movements: Movement[]
  totalRevenue: number
  createdAt: string
  paymentMethod?: 'cartao_credito' | 'cartao_debito' | 'pix' | 'pix_parcelado'
  installmentsCount?: number
  campaignId?: {
    _id: string
    name: string
  }
  notes?: string
}

const paymentMethodLabels = {
  cartao_credito: 'Cartão de Crédito',
  cartao_debito: 'Cartão de Débito',
  pix: 'PIX',
  pix_parcelado: 'PIX Parcelado',
}

async function fetchInstallments(customerId: string) {
  const res = await fetch(`/api/customers/${customerId}/installments`)
  if (!res.ok) throw new Error('Erro ao carregar parcelas')
  return res.json()
}

export function PurchaseHistory({ customerId, initialMovements }: PurchaseHistoryProps) {
  // Log inicial para debug
  useEffect(() => {
    console.log('=== PurchaseHistory RENDERIZADO ===')
    console.log('customerId:', customerId)
    console.log('initialMovements:', initialMovements)
    console.log('initialMovements.length:', initialMovements.length)
    console.log('initialMovements com saleGroupId:', initialMovements.map(m => ({
      _id: m._id,
      saleGroupId: m.saleGroupId,
      productName: m.productId?.name,
    })))
  }, [customerId, initialMovements])
  
  const [movements, setMovements] = useState<Movement[]>(initialMovements)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [expandedSales, setExpandedSales] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(6)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table')

  console.log('movements state:', movements)
  console.log('movements.length:', movements.length)

  // Busca parcelas do cliente
  const { data: installments = [] } = useQuery({
    queryKey: ['installments', customerId],
    queryFn: () => fetchInstallments(customerId),
  })
  
  console.log('installments:', installments)

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

  // Agrupa movimentações pelo saleGroupId
  // Separa vendas (saída) de pagamentos de parcelas (entrada)
  const { groupedSales, installmentPayments } = useMemo(() => {
    console.log('=== AGRUPANDO MOVIMENTAÇÕES ===')
    console.log('Total de movimentações:', movements.length)
    console.log('Movimentações:', movements.map(m => ({
      _id: m._id,
      saleGroupId: m.saleGroupId,
      type: m.type,
      productName: m.productId?.name,
    })))

    const grouped = new Map<string | 'ungrouped', GroupedSale>()
    const ungrouped: Movement[] = []
    const installmentPaymentsList: Movement[] = []

    movements.forEach((movement) => {
      // Se for uma entrada de pagamento de parcela, trata separadamente
      if (movement.type === 'entrada' && movement.notes && movement.notes.includes('Pagamento de parcela')) {
        installmentPaymentsList.push(movement)
        return
      }

      // Converte saleGroupId para string, tratando diferentes formatos
      let groupId: string | null = null
      console.log('Processando movimento:', {
        _id: movement._id,
        saleGroupId: movement.saleGroupId,
        tipo: typeof movement.saleGroupId,
      })
      
      if (movement.saleGroupId) {
        if (typeof movement.saleGroupId === 'string') {
          groupId = movement.saleGroupId
        } else if (typeof movement.saleGroupId === 'object' && movement.saleGroupId !== null) {
          // Pode ser um ObjectId do MongoDB ou objeto com $oid
          if ('$oid' in movement.saleGroupId) {
            groupId = (movement.saleGroupId as any).$oid
          } else if ('toString' in movement.saleGroupId) {
            groupId = (movement.saleGroupId as any).toString()
          } else if ('_id' in movement.saleGroupId) {
            groupId = String((movement.saleGroupId as any)._id)
          } else {
            // Tenta converter diretamente
            groupId = String(movement.saleGroupId)
          }
        } else {
          groupId = String(movement.saleGroupId)
        }
      }

      if (groupId) {
        console.log('groupId encontrado:', groupId)
        if (!grouped.has(groupId)) {
          console.log('Criando novo grupo:', groupId)
          // Normaliza campaignId
          let campaign: { _id: string; name: string } | undefined = undefined
          if (movement.campaignId) {
            if (typeof movement.campaignId === 'object' && movement.campaignId !== null && '_id' in movement.campaignId) {
              campaign = movement.campaignId as { _id: string; name: string }
            }
          }

          grouped.set(groupId, {
            saleGroupId: groupId,
            movements: [],
            totalRevenue: 0,
            createdAt: movement.createdAt,
            paymentMethod: movement.paymentMethod,
            installmentsCount: movement.installmentsCount,
            campaignId: campaign || undefined,
            notes: movement.notes,
          })
        }
        const group = grouped.get(groupId)!
        console.log('Adicionando movimento ao grupo:', groupId, 'Total de movimentos no grupo:', group.movements.length + 1)
        group.movements.push(movement)
        group.totalRevenue += movement.totalRevenue || 0
      } else {
        console.log('Movimento sem saleGroupId, adicionando a ungrouped')
        ungrouped.push(movement)
      }
    })

    // Adiciona movimentações não agrupadas como vendas individuais
    ungrouped.forEach((movement) => {
      // Normaliza campaignId para ungrouped também
      let campaign: { _id: string; name: string } | undefined = undefined
      if (movement.campaignId) {
        if (typeof movement.campaignId === 'object' && movement.campaignId !== null && '_id' in movement.campaignId) {
          campaign = movement.campaignId as { _id: string; name: string }
        }
      }

      grouped.set(`ungrouped-${movement._id}`, {
        movements: [movement],
        totalRevenue: movement.totalRevenue || 0,
        createdAt: movement.createdAt,
        paymentMethod: movement.paymentMethod,
        installmentsCount: movement.installmentsCount,
        campaignId: campaign,
        notes: movement.notes,
      })
    })

    // Converte para array e ordena por data (mais recente primeiro)
    const salesArray = Array.from(grouped.values()).sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    console.log('=== RESULTADO DO AGRUPAMENTO ===')
    console.log('Total de grupos:', salesArray.length)
    console.log('Grupos:', salesArray.map(s => ({
      saleGroupId: s.saleGroupId,
      movementsCount: s.movements.length,
      totalRevenue: s.totalRevenue,
    })))
    console.log('Pagamentos de parcelas:', installmentPaymentsList.length)

    return {
      groupedSales: salesArray,
      installmentPayments: installmentPaymentsList.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
    }
  }, [movements])

  // Log antes do render
  console.log('=== ANTES DO RENDER ===')
  console.log('groupedSales:', groupedSales)
  console.log('groupedSales.length:', groupedSales.length)
  console.log('installmentPayments.length:', installmentPayments.length)
  console.log('Detalhes dos grupos:', groupedSales.map(s => ({
    saleGroupId: s.saleGroupId,
    movementsCount: s.movements.length,
    movements: s.movements.map(m => ({
      _id: m._id,
      productName: m.productId?.name,
      saleGroupId: m.saleGroupId,
    })),
  })))

  // Calcula paginação
  const totalPages = Math.ceil(groupedSales.length / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedSales = groupedSales.slice(startIndex, endIndex)

  // Reset para primeira página quando itens por página mudar
  useEffect(() => {
    setCurrentPage(1)
  }, [itemsPerPage])

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">
            {groupedSales.length} compra{groupedSales.length !== 1 ? 's' : ''} registrada{groupedSales.length !== 1 ? 's' : ''}
            {installmentPayments.length > 0 && (
              <> • {installmentPayments.length} pagamento{installmentPayments.length !== 1 ? 's' : ''} de parcela{installmentPayments.length !== 1 ? 's' : ''}</>
            )}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Label htmlFor="itemsPerPage" className="text-sm">
              Compras por página:
            </Label>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => setItemsPerPage(Number(value))}
            >
              <SelectTrigger id="itemsPerPage" className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="6">6</SelectItem>
                <SelectItem value="9">9</SelectItem>
                <SelectItem value="12">12</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className="rounded-r-none"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Adicionar Compra Antiga
          </Button>
        </div>
      </div>

      {groupedSales.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Nenhuma compra registrada ainda</p>
        </div>
      ) : viewMode === 'cards' ? (
        <>
          <div className="space-y-3">
            {paginatedSales.map((sale, saleIndex) => {
            const date = new Date(sale.createdAt)
            const dateStr = formatDate(date)
            const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            const isGrouped = sale.movements.length > 1
            const saleId = sale.saleGroupId || `sale-${saleIndex}`
            const isExpanded = expandedSales.has(saleId)

            // Calcula valor da entrada para PIX Parcelado
            let downPaymentAmount = 0
            if (sale.paymentMethod === 'pix_parcelado' && sale.saleGroupId) {
              const saleGroupIdStr = sale.saleGroupId.toString()
              const relatedInstallments = installments.filter((inst: any) => {
                if (!inst.saleGroupId) return false
                const instSaleGroupId = inst.saleGroupId._id 
                  ? inst.saleGroupId._id.toString() 
                  : inst.saleGroupId.toString()
                return instSaleGroupId === saleGroupIdStr
              })
              const downPayment = relatedInstallments.find((inst: any) => inst.installmentNumber === 0)
              if (downPayment) {
                downPaymentAmount = downPayment.isPaid && downPayment.paidAmount > 0
                  ? downPayment.paidAmount
                  : (downPayment.amount || 0)
              }
            }

            // Calcula valor total a exibir (entrada se houver, senão totalRevenue)
            const displayAmount = downPaymentAmount > 0 ? downPaymentAmount : sale.totalRevenue

            return (
              <Card key={saleId}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Cabeçalho da venda - clicável se tiver múltiplos produtos */}
                    <div 
                      className={`flex items-start justify-between pb-2 border-b ${isGrouped ? 'cursor-pointer hover:bg-muted/50 -m-4 p-4 rounded-t-lg transition-colors' : ''}`}
                      onClick={() => isGrouped && toggleSale(saleId)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {isGrouped && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 -ml-2"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleSale(saleId)
                                }}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                              <Badge variant="secondary" className="text-xs">
                                {sale.movements.length} produto{sale.movements.length !== 1 ? 's' : ''}
                              </Badge>
                            </>
                          )}
                          <span className="text-sm font-semibold text-muted-foreground">
                            {dateStr} às {timeStr}
                          </span>
                        </div>
                        {sale.campaignId && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Megaphone className="h-3 w-3" />
                            <span>{sale.campaignId.name}</span>
                          </div>
                        )}
                        {/* Mostra resumo quando colapsado */}
                        {isGrouped && !isExpanded && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            {sale.movements.slice(0, 2).map((m, idx) => {
                              const name = m.productId?.nome_vitrine || m.productId?.name || 'Produto'
                              return (
                                <span key={m._id}>
                                  {name}
                                  {idx < Math.min(2, sale.movements.length - 1) && ', '}
                                </span>
                              )
                            })}
                            {sale.movements.length > 2 && ` +${sale.movements.length - 2} mais`}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {displayAmount > 0 && (
                          <div className="flex items-center gap-1 font-bold text-primary">
                            <DollarSign className="h-4 w-4" />
                            <span>{formatCurrency(displayAmount)}</span>
                          </div>
                        )}
                        {downPaymentAmount > 0 && sale.totalRevenue > downPaymentAmount && (
                          <div className="text-xs text-muted-foreground">
                            Total: {formatCurrency(sale.totalRevenue)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Lista de produtos - só mostra se expandido ou se não for agrupado */}
                    {(isExpanded || !isGrouped) && (
                      <div className="space-y-2">
                        {sale.movements.map((movement) => {
                          // Exibição normal para produtos
                          const displayName = movement.productId?.nome_vitrine || movement.productId?.name || 'Produto'
                          const itemTotal = movement.totalRevenue || (movement.salePrice || 0) * movement.quantity

                          return (
                            <div key={movement._id} className="p-3 bg-muted rounded-lg">
                              <div>
                                <h4 className="font-semibold text-base">{displayName}</h4>
                                {movement.productId?.name && movement.productId.name !== displayName && (
                                  <p className="text-sm text-muted-foreground">{movement.productId.name}</p>
                                )}
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {movement.productId?.brand && (
                                    <Badge variant="outline" className="text-xs">
                                      {movement.productId.brand}
                                    </Badge>
                                  )}
                                  {movement.productId?.size && (
                                    <Badge variant="outline" className="text-xs">
                                      Tamanho: {movement.productId.size}
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="text-xs">
                                    Qtd: {movement.quantity}
                                  </Badge>
                                  {movement.salePrice && (
                                    <Badge variant="outline" className="text-xs">
                                      {formatCurrency(movement.salePrice)}/un
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {isGrouped && itemTotal > 0 && (
                                <div className="mt-2 text-sm text-muted-foreground">
                                  Subtotal: <span className="font-semibold">{formatCurrency(itemTotal)}</span>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Informações da compra */}
                    <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t">
                      {sale.paymentMethod && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CreditCard className="h-4 w-4" />
                          <span>{paymentMethodLabels[sale.paymentMethod]}</span>
                        </div>
                      )}
                      {/* Informações de parcelas para PIX Parcelado */}
                      {sale.paymentMethod === 'pix_parcelado' && sale.saleGroupId && (
                        <InstallmentInfo 
                          saleGroupId={sale.saleGroupId} 
                          installments={installments}
                          totalRevenue={sale.totalRevenue}
                        />
                      )}
                      {sale.notes && (
                        <div className="flex items-start gap-2 text-muted-foreground col-span-2">
                          <FileText className="h-4 w-4 mt-0.5" />
                          <span className="text-xs">{sale.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
            })}
          </div>
        </>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Produtos</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Forma de Pagamento</TableHead>
                  <TableHead>Campanha</TableHead>
                  <TableHead>Status Parcelas</TableHead>
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSales.map((sale, saleIndex) => {
                  const date = new Date(sale.createdAt)
                  const dateStr = formatDate(date)
                  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                  const saleId = sale.saleGroupId || `sale-${saleIndex}`

                  // Calcula valor da entrada para PIX Parcelado
                  let downPaymentAmount = 0
                  if (sale.paymentMethod === 'pix_parcelado' && sale.saleGroupId) {
                    const saleGroupIdStr = sale.saleGroupId.toString()
                    const relatedInstallments = installments.filter((inst: any) => {
                      if (!inst.saleGroupId) return false
                      const instSaleGroupId = inst.saleGroupId._id 
                        ? inst.saleGroupId._id.toString() 
                        : inst.saleGroupId.toString()
                      return instSaleGroupId === saleGroupIdStr
                    })
                    const downPayment = relatedInstallments.find((inst: any) => inst.installmentNumber === 0)
                    if (downPayment) {
                      downPaymentAmount = downPayment.isPaid && downPayment.paidAmount > 0
                        ? downPayment.paidAmount
                        : (downPayment.amount || 0)
                    }
                  }

                  // Calcula valor total a exibir (entrada se houver, senão totalRevenue)
                  const displayAmount = downPaymentAmount > 0 ? downPaymentAmount : sale.totalRevenue

                  // Quantidade total de produtos
                  const totalQuantity = sale.movements.reduce((sum, m) => sum + m.quantity, 0)

                  // Status de parcelas
                  let installmentStatus = null
                  if (sale.paymentMethod === 'pix_parcelado' && sale.saleGroupId) {
                    const saleGroupIdStr = sale.saleGroupId.toString()
                    const relatedInstallments = installments.filter((inst: any) => {
                      if (!inst.saleGroupId) return false
                      const instSaleGroupId = inst.saleGroupId._id 
                        ? inst.saleGroupId._id.toString() 
                        : inst.saleGroupId.toString()
                      return instSaleGroupId === saleGroupIdStr
                    })
                    const totalInst = relatedInstallments.filter((inst: any) => inst.installmentNumber !== 0).length
                    const paidInst = relatedInstallments.filter((inst: any) => inst.isPaid && inst.installmentNumber !== 0).length
                    installmentStatus = `${paidInst}/${totalInst} pagas`
                  }

                  return (
                    <TableRow key={saleId}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{dateStr}</span>
                          <span className="text-xs text-muted-foreground">{timeStr}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {sale.movements.length > 1 ? (
                            <div className="space-y-1">
                              <div className="font-medium">{sale.movements[0].productId?.nome_vitrine || sale.movements[0].productId?.name || 'Produto'}</div>
                              <div className="text-xs text-muted-foreground">
                                +{sale.movements.length - 1} outro{sale.movements.length - 1 !== 1 ? 's' : ''}
                              </div>
                            </div>
                          ) : (
                            <div className="font-medium">
                              {sale.movements[0]?.productId?.nome_vitrine || sale.movements[0]?.productId?.name || 'Produto'}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{totalQuantity}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold">{formatCurrency(displayAmount)}</span>
                          {downPaymentAmount > 0 && sale.totalRevenue > downPaymentAmount && (
                            <span className="text-xs text-muted-foreground">
                              Total: {formatCurrency(sale.totalRevenue)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {sale.paymentMethod ? (
                          <div className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{paymentMethodLabels[sale.paymentMethod]}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {sale.campaignId ? (
                          <div className="flex items-center gap-1">
                            <Megaphone className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{sale.campaignId.name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {installmentStatus ? (
                          <Badge variant="secondary" className="text-xs">
                            {installmentStatus}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {sale.notes ? (
                          <div className="flex items-start gap-1 max-w-xs">
                            <FileText className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs text-muted-foreground line-clamp-2">{sale.notes}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Paginação */}
          {totalPages > 1 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="text-sm text-muted-foreground text-center md:text-left">
                    Página {currentPage} de {totalPages} • Mostrando {startIndex + 1} a {Math.min(endIndex, groupedSales.length)} de {groupedSales.length} compra{groupedSales.length !== 1 ? 's' : ''}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => {
                        const pageNum = i + 1
                        // Mostra todas as páginas se houver 7 ou menos, senão mostra uma janela
                        if (totalPages <= 7) {
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className="min-w-[36px] md:min-w-[40px] text-xs md:text-sm"
                            >
                              {pageNum}
                            </Button>
                          )
                        } else {
                          // Mostra janela de páginas
                          if (
                            pageNum === 1 ||
                            pageNum === totalPages ||
                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                          ) {
                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className="min-w-[36px] md:min-w-[40px] text-xs md:text-sm"
                              >
                                {pageNum}
                              </Button>
                            )
                          } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                            return (
                              <span key={pageNum} className="px-2 text-muted-foreground">
                                ...
                              </span>
                            )
                          }
                          return null
                        }
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

      <AddPurchaseModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        customerId={customerId}
        onAssociate={handleAssociate}
      />
    </div>
  )
}

// Componente para exibir informações de parcelas
function InstallmentInfo({ 
  saleGroupId, 
  installments, 
  totalRevenue 
}: { 
  saleGroupId: string
  installments: any[]
  totalRevenue: number
}) {
  console.log('=== InstallmentInfo - INÍCIO ===')
  console.log('saleGroupId recebido:', saleGroupId)
  console.log('tipo do saleGroupId:', typeof saleGroupId)
  console.log('total de installments recebidos:', installments.length)
  console.log('installments completo:', JSON.stringify(installments, null, 2))
  
  // Normaliza saleGroupId para string
  const normalizedSaleGroupId = saleGroupId?.toString()
  console.log('normalizedSaleGroupId:', normalizedSaleGroupId)
  
  // Filtra parcelas relacionadas a este saleGroupId
  // O saleGroupId pode vir como string, ObjectId, ou objeto populado
  const relatedInstallments = installments.filter((inst: any) => {
    console.log('--- Verificando inst ---')
    console.log('inst.saleGroupId:', inst.saleGroupId)
    console.log('tipo de inst.saleGroupId:', typeof inst.saleGroupId)
    
    if (!inst.saleGroupId) {
      console.log('inst.saleGroupId é null/undefined, retornando false')
      return false
    }
    
    // Se for objeto populado, pega o _id
    let instSaleGroupId: string
    if (inst.saleGroupId._id) {
      instSaleGroupId = inst.saleGroupId._id.toString()
      console.log('inst.saleGroupId._id encontrado:', instSaleGroupId)
    } else if (typeof inst.saleGroupId === 'object' && inst.saleGroupId.toString) {
      instSaleGroupId = inst.saleGroupId.toString()
      console.log('inst.saleGroupId é objeto com toString:', instSaleGroupId)
    } else {
      instSaleGroupId = String(inst.saleGroupId)
      console.log('inst.saleGroupId convertido para string:', instSaleGroupId)
    }
    
    const matches = instSaleGroupId === normalizedSaleGroupId
    console.log('Comparação:', instSaleGroupId, '===', normalizedSaleGroupId, '=', matches)
    return matches
  })

  console.log('=== RESULTADO DO FILTRO ===')
  console.log('relatedInstallments encontradas:', relatedInstallments.length)
  console.log('relatedInstallments completo:', JSON.stringify(relatedInstallments, null, 2))

  if (relatedInstallments.length === 0) {
    console.log('Nenhuma parcela encontrada, retornando null')
    return null
  }
  
  // Calcula entrada (parcela 0) e parcelas normais
  const downPayment = relatedInstallments.find((inst: any) => inst.installmentNumber === 0)
  console.log('=== DOWN PAYMENT ===')
  console.log('downPayment encontrado:', downPayment)
  console.log('downPayment completo:', JSON.stringify(downPayment, null, 2))
  
  const regularInstallments = relatedInstallments.filter((inst: any) => inst.installmentNumber > 0)
  
  const paidInstallments = regularInstallments.filter((inst: any) => inst.isPaid).length
  const totalInstallments = regularInstallments.length
  
  // Calcula valor da entrada: se foi paga, usa paidAmount, senão usa amount
  // Se paidAmount existe e é maior que 0, significa que foi paga (mesmo que parcialmente)
  let downPaymentAmount = 0
  let downPaymentPaid = false
  
  if (downPayment) {
    console.log('=== CALCULANDO ENTRADA ===')
    console.log('downPayment.amount:', downPayment.amount)
    console.log('downPayment.paidAmount:', downPayment.paidAmount)
    console.log('downPayment.isPaid:', downPayment.isPaid)
    
    // Se tem paidAmount e é maior que 0, foi paga (pode ser parcial ou total)
    if (downPayment.paidAmount && downPayment.paidAmount > 0) {
      downPaymentAmount = downPayment.paidAmount
      downPaymentPaid = downPayment.isPaid || false
      console.log('Entrada foi paga, usando paidAmount:', downPaymentAmount)
    } else {
      // Se não foi paga ainda, mostra o valor que deveria ser pago (amount)
      downPaymentAmount = downPayment.amount || 0
      downPaymentPaid = false
      console.log('Entrada não foi paga, usando amount:', downPaymentAmount)
    }
  } else {
    console.log('Nenhuma entrada (parcela 0) encontrada')
  }
  
  console.log('=== RESULTADO FINAL ===')
  console.log('downPaymentAmount:', downPaymentAmount)
  console.log('downPaymentPaid:', downPaymentPaid)
  console.log('paidInstallments:', paidInstallments)
  console.log('totalInstallments:', totalInstallments)
  console.log('=== InstallmentInfo - FIM ===')

  // Calcula valor total pago
  const totalPaid = relatedInstallments
    .filter((inst: any) => inst.isPaid)
    .reduce((sum: number, inst: any) => sum + (inst.paidAmount || 0), 0)

  return (
    <div className="col-span-2 space-y-2">
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-blue-700">Status de Pagamento</span>
          <Badge variant={totalPaid >= totalRevenue ? "default" : "secondary"} className="text-xs">
            {totalPaid >= totalRevenue ? 'Quitado' : 'Pendente'}
          </Badge>
        </div>
        
        {downPayment && downPaymentAmount > 0 && (
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-blue-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`h-4 w-4 ${downPaymentPaid ? 'text-green-500' : 'text-gray-400'}`} />
              <span className="text-sm text-blue-700">Entrada:</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${downPaymentPaid ? 'text-green-600' : 'text-gray-600'}`}>
                {formatCurrency(downPaymentAmount)}
              </span>
              {downPaymentPaid && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm text-blue-700">Parcelas:</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-blue-700">
              {paidInstallments}/{totalInstallments} pagas
            </span>
            {paidInstallments === totalInstallments && (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-blue-600">Total Pago:</span>
            <span className="text-sm font-bold text-blue-700">{formatCurrency(totalPaid)}</span>
          </div>
          {totalPaid < totalRevenue && (
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-blue-600">Restante:</span>
              <span className="text-sm font-semibold text-orange-600">
                {formatCurrency(totalRevenue - totalPaid)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

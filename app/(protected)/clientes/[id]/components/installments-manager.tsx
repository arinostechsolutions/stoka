'use client'

import { useState, useTransition } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CurrencyInput } from '@/components/ui/currency-input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AlertTriangle, CheckCircle2, Clock, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface InstallmentsManagerProps {
  customerId: string
  initialMovements?: any[]
}

async function fetchInstallments(customerId: string) {
  const res = await fetch(`/api/customers/${customerId}/installments`)
  if (!res.ok) throw new Error('Erro ao carregar parcelas')
  return res.json()
}

export function InstallmentsManager({ customerId, initialMovements = [] }: InstallmentsManagerProps) {
  const [open, setOpen] = useState(false)
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null) // ID da compra selecionada para filtrar
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null)
  const [paidAmount, setPaidAmount] = useState('')
  const [paidDate, setPaidDate] = useState('')
  const [notes, setNotes] = useState('')
  const [isPending, startTransition] = useTransition()
  const [showBulkPayment, setShowBulkPayment] = useState(false)
  const [bulkPayments, setBulkPayments] = useState<Record<string, { amount: string; date: string }>>({})
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const queryClient = useQueryClient()

  const { data: installments = [], isLoading } = useQuery({
    queryKey: ['installments', customerId],
    queryFn: () => fetchInstallments(customerId),
    enabled: true,
  })

  const handlePayInstallment = (installment: any) => {
    setSelectedInstallment(installment)
    const remaining = installment.amount - (installment.paidAmount || 0)
    setPaidAmount(remaining > 0 ? remaining.toString() : '')
    setPaidDate(new Date().toISOString().split('T')[0])
    setNotes('')
  }

  const handleSubmitPayment = async () => {
    if (!selectedInstallment || !paidAmount) return

    startTransition(async () => {
      try {
        const res = await fetch('/api/installments/pay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            installmentId: selectedInstallment._id,
            paidAmount: Number(paidAmount.replace(/[^\d,.-]/g, '').replace(',', '.')),
            paidDate: paidDate || new Date().toISOString(),
            notes: notes,
          }),
        })

        if (!res.ok) {
          const error = await res.json()
          setErrorMessage(error.error || 'Erro ao registrar pagamento')
          setShowErrorModal(true)
          return
        }

        await queryClient.invalidateQueries({ queryKey: ['installments', customerId] })
        await queryClient.invalidateQueries({ queryKey: ['customers'] })

        setSuccessMessage('Pagamento registrado com sucesso!')
        setShowSuccessModal(true)
        setSelectedInstallment(null)
        setPaidAmount('')
        setPaidDate('')
        setNotes('')
      } catch (error: any) {
        setErrorMessage(error.message || 'Erro ao registrar pagamento')
        setShowErrorModal(true)
      }
    })
  }

  // Agrupa parcelas por saleGroupId
  const groupedBySale = installments.reduce((acc: any, inst: any) => {
    const saleId = inst.saleGroupId?._id || inst.saleGroupId || 'no-group'
    if (!acc[saleId]) {
      acc[saleId] = []
    }
    acc[saleId].push(inst)
    return acc
  }, {})

  // Filtra groupedBySale se houver uma compra específica selecionada
  const filteredGroupedBySale = selectedSaleId 
    ? { [selectedSaleId]: groupedBySale[selectedSaleId] || [] }
    : groupedBySale

  // Filtra parcelas pendentes (ignora entrada que tem installmentNumber = 0)
  // Se houver uma compra específica selecionada, filtra apenas as parcelas dessa compra
  let pendingInstallments = installments.filter((inst: any) => !inst.isPaid && inst.installmentNumber !== 0)
  if (selectedSaleId) {
    const saleInstallments = filteredGroupedBySale[selectedSaleId] || []
    const saleInstallmentIds = new Set(saleInstallments.map((inst: any) => inst._id.toString()))
    pendingInstallments = pendingInstallments.filter((inst: any) => saleInstallmentIds.has(inst._id.toString()))
  }
  const overdueInstallments = pendingInstallments.filter((inst: any) => {
    const dueDate = new Date(inst.dueDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return dueDate < today
  })

  // Calcula totais (filtrados se houver compra específica selecionada)
  let installmentsToCalculate = installments.filter((inst: any) => inst.installmentNumber !== 0)
  if (selectedSaleId) {
    const saleInstallments = filteredGroupedBySale[selectedSaleId] || []
    const saleInstallmentIds = new Set(saleInstallments.map((inst: any) => inst._id.toString()))
    installmentsToCalculate = installmentsToCalculate.filter((inst: any) => saleInstallmentIds.has(inst._id.toString()))
  }
  const totalInstallments = installmentsToCalculate.length
  const paidInstallments = installmentsToCalculate.filter((inst: any) => inst.isPaid).length
  const totalAmount = installmentsToCalculate.reduce((sum: number, inst: any) => sum + inst.amount, 0)
  const totalPaid = installmentsToCalculate.reduce((sum: number, inst: any) => sum + (inst.paidAmount || 0), 0)

  // Calcula valor restante da parcela selecionada
  const remainingAmount = selectedInstallment 
    ? selectedInstallment.amount - (selectedInstallment.paidAmount || 0)
    : 0

  return (
    <div className="space-y-4">
      {/* Resumo no card */}
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Clock className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : installments.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">
          Nenhuma parcela encontrada
        </div>
      ) : (
        <div className="space-y-3">
          {/* Resumo das parcelas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-xs text-muted-foreground">Total de Parcelas</div>
              <div className="text-lg font-bold">{totalInstallments}</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="text-xs text-green-700">Parcelas Pagas</div>
              <div className="text-lg font-bold text-green-700">{paidInstallments}</div>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-xs text-yellow-700">Pendentes</div>
              <div className="text-lg font-bold text-yellow-700">{pendingInstallments.length}</div>
            </div>
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="text-xs text-red-700">Atrasadas</div>
              <div className="text-lg font-bold text-red-700">{overdueInstallments.length}</div>
            </div>
          </div>

          {/* Valor total e pago */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <div className="text-sm text-muted-foreground">Valor Total</div>
              <div className="text-lg font-bold">{formatCurrency(totalAmount)}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Valor Pago</div>
              <div className="text-lg font-bold text-green-600">{formatCurrency(totalPaid)}</div>
            </div>
          </div>

          {/* Tabela de compras parceladas */}
          {Object.keys(groupedBySale).length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-semibold">Compras Parceladas:</div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Itens Comprados</TableHead>
                      <TableHead>Parcelas</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>Entrada</TableHead>
                      <TableHead>Valor Restante</TableHead>
                      <TableHead>Parcelas Faltando</TableHead>
                      <TableHead>Próximo Vencimento</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(groupedBySale).map(([saleId, saleInstallments]: [string, any]) => {
                      const sortedInstallments = [...saleInstallments].sort((a: any, b: any) => {
                        if (a.installmentNumber === 0) return -1
                        if (b.installmentNumber === 0) return 1
                        return a.installmentNumber - b.installmentNumber
                      })
                      const firstInst = sortedInstallments[0]
                      const totalInst = firstInst.totalInstallments || sortedInstallments.length
                      
                      // Busca movimentos relacionados a esta compra
                      const saleGroupIdStr = saleId === 'no-group' ? null : saleId
                      const relatedMovements = initialMovements.filter((mov: any) => {
                        if (!mov.saleGroupId) return saleGroupIdStr === null
                        const movSaleGroupId = mov.saleGroupId.toString()
                        return movSaleGroupId === saleGroupIdStr
                      })
                      
                      // Calcula valores
                      const saleTotal = sortedInstallments.reduce((sum: number, inst: any) => sum + inst.amount, 0)
                      const downPayment = sortedInstallments
                        .filter((inst: any) => inst.installmentNumber === 0)
                        .reduce((sum: number, inst: any) => sum + inst.amount, 0)
                      const totalPaid = sortedInstallments.reduce((sum: number, inst: any) => sum + (inst.paidAmount || 0), 0)
                      const remainingAmount = saleTotal - totalPaid
                      
                      // Conta parcelas
                      const paidCount = sortedInstallments.filter((inst: any) => inst.isPaid && inst.installmentNumber !== 0).length
                      const pendingCount = totalInst - paidCount
                      
                      // Encontra próxima parcela pendente para pegar data de vencimento
                      const nextPending = sortedInstallments
                        .filter((inst: any) => !inst.isPaid && inst.installmentNumber !== 0)
                        .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]
                      
                      return (
                        <TableRow key={saleId}>
                          <TableCell>
                            {relatedMovements.length > 0 ? (
                              <div className="space-y-1">
                                {relatedMovements.map((mov: any) => {
                                  const productName = mov.productId?.nome_vitrine || mov.productId?.name || 'Produto removido'
                                  return (
                                    <div key={mov._id} className="text-sm">
                                      <span className="font-medium">{productName}</span>
                                      {mov.quantity > 1 && (
                                        <span className="text-muted-foreground ml-1">(x{mov.quantity})</span>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {paidCount}/{totalInst} pagas
                          </TableCell>
                          <TableCell>{formatCurrency(saleTotal)}</TableCell>
                          <TableCell>
                            {downPayment > 0 ? (
                              <span className="text-green-600">{formatCurrency(downPayment)}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={remainingAmount > 0 ? "font-semibold text-yellow-700" : "text-green-600"}>
                              {formatCurrency(remainingAmount)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={pendingCount > 0 ? "outline" : "default"} className={pendingCount > 0 ? "border-yellow-500 text-yellow-700" : "bg-green-500"}>
                              {pendingCount}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {nextPending ? (
                              <span className={new Date(nextPending.dueDate) < new Date() ? "text-red-600 font-semibold" : ""}>
                                {new Date(nextPending.dueDate).toLocaleDateString('pt-BR')}
                              </span>
                            ) : (
                              <span className="text-green-600">Todas pagas</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {pendingCount > 0 ? (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => {
                                  // Abre o modal e filtra para mostrar apenas esta compra
                                  setSelectedSaleId(saleId)
                                  setOpen(true)
                                }}
                              >
                                Pagar
                              </Button>
                            ) : (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Pago
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Botão para abrir modal com detalhes */}
      <Dialog 
        open={open} 
        onOpenChange={(isOpen) => {
          setOpen(isOpen)
          if (!isOpen) {
            // Limpa a seleção quando o modal fecha
            setSelectedSaleId(null)
          }
        }}
      >
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setSelectedSaleId(null)}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Ver Detalhes e Gerenciar Parcelas
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedSaleId ? 'Parcelas desta Compra' : 'Gerenciar Parcelas de Pagamento'}
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : installments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma parcela encontrada
            </div>
          ) : (
            <div className="space-y-4">
              {/* Resumo */}
              <div className="flex items-center justify-between">
                <div className="grid grid-cols-3 gap-4 flex-1">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Total de Parcelas</div>
                    <div className="text-2xl font-bold">{totalInstallments}</div>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="text-sm text-yellow-700">Pendentes</div>
                    <div className="text-2xl font-bold text-yellow-700">{pendingInstallments.length}</div>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-sm text-red-700">Atrasadas</div>
                    <div className="text-2xl font-bold text-red-700">{overdueInstallments.length}</div>
                  </div>
                </div>
                {pendingInstallments.length > 0 && !selectedSaleId && (
                  <Button
                    onClick={() => {
                      setShowBulkPayment(!showBulkPayment)
                      // Inicializa os campos de pagamento em lote
                      if (!showBulkPayment) {
                        const initialPayments: Record<string, { amount: string; date: string }> = {}
                        pendingInstallments.forEach((inst: any) => {
                          const remaining = inst.amount - (inst.paidAmount || 0)
                          initialPayments[inst._id] = {
                            amount: remaining > 0 ? remaining.toString() : '',
                            date: new Date().toISOString().split('T')[0],
                          }
                        })
                        setBulkPayments(initialPayments)
                      }
                    }}
                    variant={showBulkPayment ? "default" : "outline"}
                    className="ml-4"
                  >
                    {showBulkPayment ? 'Cancelar' : 'Registrar Parcelas Restantes'}
                  </Button>
                )}
              </div>

              {/* Formulário de pagamento em lote (apenas quando não está filtrando por compra específica) */}
              {showBulkPayment && pendingInstallments.length > 0 && !selectedSaleId && (
                <div className="border rounded-lg p-4 space-y-4 bg-blue-50">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Registrar Pagamentos em Lote</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowBulkPayment(false)
                        setBulkPayments({})
                      }}
                    >
                      ✕
                    </Button>
                  </div>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {pendingInstallments.map((inst: any) => {
                      const remaining = inst.amount - (inst.paidAmount || 0)
                      const payment = bulkPayments[inst._id] || { amount: '', date: '' }
                      
                      return (
                        <div key={inst._id} className="p-3 bg-white rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="font-medium">
                                Parcela {inst.installmentNumber}/{inst.totalInstallments}
                              </span>
                              <span className="text-sm text-muted-foreground ml-2">
                                Vencimento: {new Date(inst.dueDate).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">Valor:</div>
                              <div className="font-semibold">{formatCurrency(inst.amount)}</div>
                              <div className="text-xs text-muted-foreground">
                                Restante: {formatCurrency(remaining)}
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Valor a Pagar</Label>
                              <CurrencyInput
                                value={payment.amount}
                                onChange={(value) => {
                                  setBulkPayments({
                                    ...bulkPayments,
                                    [inst._id]: { ...payment, amount: value },
                                  })
                                }}
                                placeholder="0,00"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Data do Pagamento</Label>
                              <Input
                                type="date"
                                value={payment.date}
                                onChange={(e) => {
                                  setBulkPayments({
                                    ...bulkPayments,
                                    [inst._id]: { ...payment, date: e.target.value },
                                  })
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex gap-2 justify-end pt-2 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowBulkPayment(false)
                        setBulkPayments({})
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={async () => {
                        const paymentsToProcess = pendingInstallments.filter((inst: any) => {
                          const payment = bulkPayments[inst._id]
                          return payment && payment.amount && payment.date
                        })

                        if (paymentsToProcess.length === 0) {
                          setErrorMessage('Preencha pelo menos um pagamento')
                          setShowErrorModal(true)
                          return
                        }

                        startTransition(async () => {
                          try {
                            let successCount = 0
                            let errorCount = 0

                            for (const inst of paymentsToProcess) {
                              const payment = bulkPayments[inst._id]
                              try {
                                const res = await fetch('/api/installments/pay', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    installmentId: inst._id,
                                    paidAmount: Number(payment.amount.replace(/[^\d,.-]/g, '').replace(',', '.')),
                                    paidDate: payment.date,
                                    notes: notes,
                                  }),
                                })

                                if (res.ok) {
                                  successCount++
                                } else {
                                  errorCount++
                                }
                              } catch (error) {
                                errorCount++
                              }
                            }

                            await queryClient.invalidateQueries({ queryKey: ['installments', customerId] })
                            await queryClient.invalidateQueries({ queryKey: ['customers'] })

                            if (errorCount === 0) {
                              setSuccessMessage(`${successCount} pagamento(s) registrado(s) com sucesso!`)
                              setShowSuccessModal(true)
                              setShowBulkPayment(false)
                              setBulkPayments({})
                              setNotes('')
                            } else {
                              setErrorMessage(`${successCount} pagamento(s) registrado(s), ${errorCount} erro(s)`)
                              setShowErrorModal(true)
                            }
                          } catch (error: any) {
                            setErrorMessage(error.message || 'Erro ao registrar pagamentos')
                            setShowErrorModal(true)
                          }
                        })
                      }}
                      disabled={isPending}
                    >
                      {isPending ? 'Registrando...' : `Registrar ${pendingInstallments.filter((inst: any) => bulkPayments[inst._id]?.amount && bulkPayments[inst._id]?.date).length} Pagamento(s)`}
                    </Button>
                  </div>
                </div>
              )}

              {/* Botão para voltar a ver todas as compras, se estiver filtrando */}
              {selectedSaleId && (
                <Button
                  variant="outline"
                  onClick={() => setSelectedSaleId(null)}
                  className="mb-4"
                >
                  ← Ver todas as compras
                </Button>
              )}

              {/* Lista de compras parceladas agrupadas */}
              <div className="space-y-4">
                {Object.entries(filteredGroupedBySale).map(([saleId, saleInstallments]: [string, any]) => {
                  const sortedInstallments = [...saleInstallments].sort((a: any, b: any) => {
                    if (a.installmentNumber === 0) return -1
                    if (b.installmentNumber === 0) return 1
                    return a.installmentNumber - b.installmentNumber
                  })
                  
                  const firstInstallment = sortedInstallments[0]
                  const totalInst = firstInstallment.totalInstallments || sortedInstallments.length
                  const paidCount = sortedInstallments.filter((inst: any) => inst.isPaid && inst.installmentNumber !== 0).length
                  
                  const saleTotal = sortedInstallments.reduce((sum: number, inst: any) => sum + inst.amount, 0)
                  const salePaid = sortedInstallments.reduce((sum: number, inst: any) => sum + (inst.paidAmount || 0), 0)
                  
                  // Filtra parcelas pendentes apenas desta compra para pagamento em lote
                  const salePendingInstallments = sortedInstallments.filter((inst: any) => !inst.isPaid && inst.installmentNumber !== 0)
                  
                  return (
                    <div key={saleId} id={`sale-${saleId}`} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">Compra Parcelada</h3>
                          <p className="text-sm text-muted-foreground">
                            {paidCount} de {totalInst} parcelas pagas
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Total</div>
                          <div className="font-bold">{formatCurrency(saleTotal)}</div>
                          <div className="text-sm text-green-600">Pago: {formatCurrency(salePaid)}</div>
                        </div>
                      </div>
                      
                      {/* Botão de pagamento em lote para esta compra específica */}
                      {selectedSaleId && salePendingInstallments.length > 0 && (
                        <div className="border-t pt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowBulkPayment(!showBulkPayment)
                              if (!showBulkPayment) {
                                const initialPayments: Record<string, { amount: string; date: string }> = {}
                                salePendingInstallments.forEach((inst: any) => {
                                  const remaining = inst.amount - (inst.paidAmount || 0)
                                  initialPayments[inst._id] = {
                                    amount: remaining > 0 ? remaining.toString() : '',
                                    date: new Date().toISOString().split('T')[0],
                                  }
                                })
                                setBulkPayments(initialPayments)
                              }
                            }}
                            className="w-full mb-3"
                          >
                            {showBulkPayment ? 'Cancelar Pagamento em Lote' : `Registrar ${salePendingInstallments.length} Parcela(s) Restante(s)`}
                          </Button>
                        </div>
                      )}

                      {/* Formulário de pagamento em lote para compra específica */}
                      {selectedSaleId && showBulkPayment && salePendingInstallments.length > 0 && (
                        <div className="border rounded-lg p-4 space-y-4 bg-blue-50 mb-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-lg">Registrar Pagamentos em Lote</h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setShowBulkPayment(false)
                                setBulkPayments({})
                              }}
                            >
                              ✕
                            </Button>
                          </div>
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {salePendingInstallments.map((inst: any) => {
                              const remaining = inst.amount - (inst.paidAmount || 0)
                              const payment = bulkPayments[inst._id] || { amount: '', date: '' }
                              
                              return (
                                <div key={inst._id} className="p-3 bg-white rounded-lg border">
                                  <div className="flex items-center justify-between mb-2">
                                    <div>
                                      <span className="font-medium">
                                        Parcela {inst.installmentNumber}/{inst.totalInstallments}
                                      </span>
                                      <span className="text-sm text-muted-foreground ml-2">
                                        Vencimento: {new Date(inst.dueDate).toLocaleDateString('pt-BR')}
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm text-muted-foreground">Valor:</div>
                                      <div className="font-semibold">{formatCurrency(inst.amount)}</div>
                                      <div className="text-xs text-muted-foreground">
                                        Restante: {formatCurrency(remaining)}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <Label className="text-xs">Valor a Pagar</Label>
                                      <CurrencyInput
                                        value={payment.amount}
                                        onChange={(value) => {
                                          setBulkPayments({
                                            ...bulkPayments,
                                            [inst._id]: { ...payment, amount: value },
                                          })
                                        }}
                                        placeholder="0,00"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Data do Pagamento</Label>
                                      <Input
                                        type="date"
                                        value={payment.date}
                                        onChange={(e) => {
                                          setBulkPayments({
                                            ...bulkPayments,
                                            [inst._id]: { ...payment, date: e.target.value },
                                          })
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          <div className="flex gap-2 justify-end pt-2 border-t">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setShowBulkPayment(false)
                                setBulkPayments({})
                              }}
                            >
                              Cancelar
                            </Button>
                            <Button
                              onClick={async () => {
                                const paymentsToProcess = salePendingInstallments.filter((inst: any) => {
                                  const payment = bulkPayments[inst._id]
                                  return payment && payment.amount && payment.date
                                })

                                if (paymentsToProcess.length === 0) {
                                  setErrorMessage('Preencha pelo menos um pagamento')
                                  setShowErrorModal(true)
                                  return
                                }

                                startTransition(async () => {
                                  try {
                                    let successCount = 0
                                    let errorCount = 0

                                    for (const inst of paymentsToProcess) {
                                      const payment = bulkPayments[inst._id]
                                      try {
                                        const res = await fetch('/api/installments/pay', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({
                                            installmentId: inst._id,
                                            paidAmount: Number(payment.amount.replace(/[^\d,.-]/g, '').replace(',', '.')),
                                            paidDate: payment.date,
                                            notes: notes,
                                          }),
                                        })

                                        if (res.ok) {
                                          successCount++
                                        } else {
                                          errorCount++
                                        }
                                      } catch (error) {
                                        errorCount++
                                      }
                                    }

                                    await queryClient.invalidateQueries({ queryKey: ['installments', customerId] })
                                    await queryClient.invalidateQueries({ queryKey: ['customers'] })

                                    if (errorCount === 0) {
                                      setSuccessMessage(`${successCount} pagamento(s) registrado(s) com sucesso!`)
                                      setShowSuccessModal(true)
                                      setShowBulkPayment(false)
                                      setBulkPayments({})
                                      setNotes('')
                                    } else {
                                      setErrorMessage(`${successCount} pagamento(s) registrado(s), ${errorCount} erro(s)`)
                                      setShowErrorModal(true)
                                    }
                                  } catch (error: any) {
                                    setErrorMessage(error.message || 'Erro ao registrar pagamentos')
                                    setShowErrorModal(true)
                                  }
                                })
                              }}
                              disabled={isPending}
                            >
                              {isPending ? 'Registrando...' : `Registrar ${salePendingInstallments.filter((inst: any) => bulkPayments[inst._id]?.amount && bulkPayments[inst._id]?.date).length} Pagamento(s)`}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Lista de parcelas */}
                      <div className="border-t pt-3 space-y-2">
                        {sortedInstallments
                          .filter((inst: any) => inst.installmentNumber !== 0)
                          .map((inst: any) => {
                            const dueDate = new Date(inst.dueDate)
                            const today = new Date()
                            today.setHours(0, 0, 0, 0)
                            const isOverdue = !inst.isPaid && dueDate < today
                            const remainingAmount = inst.amount - (inst.paidAmount || 0)

                            return (
                              <div
                                key={inst._id}
                                className={`flex items-center justify-between p-3 rounded-lg border ${
                                  inst.isPaid ? 'bg-green-50 border-green-200' : 
                                  isOverdue ? 'bg-red-50 border-red-200' : 
                                  'bg-muted/50'
                                }`}
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    inst.isPaid 
                                      ? 'bg-green-500 border-green-500' 
                                      : 'border-gray-300'
                                  }`}>
                                    {inst.isPaid && (
                                      <CheckCircle2 className="h-4 w-4 text-white" />
                                    )}
                                  </div>
                                  
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">
                                        Parcela {inst.installmentNumber}/{totalInst}
                                      </span>
                                      {inst.isPaid ? (
                                        <Badge variant="default" className="bg-green-500">
                                          <CheckCircle2 className="h-3 w-3 mr-1" />
                                          Pago
                                        </Badge>
                                      ) : isOverdue ? (
                                        <Badge variant="destructive">
                                          <AlertTriangle className="h-3 w-3 mr-1" />
                                          Atrasado
                                        </Badge>
                                      ) : (
                                        <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                                          <Clock className="h-3 w-3 mr-1" />
                                          Pendente
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      Vencimento: {dueDate.toLocaleDateString('pt-BR')}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="text-right">
                                  <div className="font-semibold">{formatCurrency(inst.amount)}</div>
                                  {!inst.isPaid && (
                                    <div className="text-xs text-muted-foreground">
                                      Restante: {formatCurrency(remainingAmount)}
                                    </div>
                                  )}
                                  {inst.isPaid && (
                                    <div className="text-xs text-green-600">
                                      Pago em: {inst.paidDate ? new Date(inst.paidDate).toLocaleDateString('pt-BR') : '-'}
                                    </div>
                                  )}
                                </div>
                                
                                {!inst.isPaid && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handlePayInstallment(inst)}
                                    className="ml-3"
                                  >
                                    Pagar
                                  </Button>
                                )}
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Modal de pagamento */}
              {selectedInstallment && (
                <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Registrar Pagamento</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedInstallment(null)
                        setPaidAmount('')
                        setPaidDate('')
                        setNotes('')
                      }}
                    >
                      ✕
                    </Button>
                  </div>
                  
                  {/* Informações da parcela */}
                  <div className="p-3 bg-white rounded-lg border">
                    <div className="text-sm text-muted-foreground">Parcela</div>
                    <div className="font-semibold text-lg">
                      {selectedInstallment.installmentNumber}/{selectedInstallment.totalInstallments}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Valor da Parcela:</span>
                      <span className="font-bold">{formatCurrency(selectedInstallment.amount)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Já Pago:</span>
                      <span className="text-green-600">{formatCurrency(selectedInstallment.paidAmount || 0)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between border-t pt-2">
                      <span className="text-sm font-semibold">Restante:</span>
                      <span className="font-bold text-lg">{formatCurrency(remainingAmount)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Valor a Pagar *</Label>
                      <CurrencyInput
                        value={paidAmount}
                        onChange={setPaidAmount}
                        placeholder="0,00"
                      />
                      <p className="text-xs text-muted-foreground">
                        Valor restante: {formatCurrency(remainingAmount)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Data do Pagamento *</Label>
                      <Input
                        type="date"
                        value={paidDate}
                        onChange={(e) => setPaidDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Observações (opcional)</Label>
                    <Input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Observações sobre o pagamento..."
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-2 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedInstallment(null)
                        setPaidAmount('')
                        setPaidDate('')
                        setNotes('')
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleSubmitPayment} disabled={isPending || !paidAmount || !paidDate}>
                      {isPending ? 'Registrando...' : 'Registrar Pagamento'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Sucesso */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Sucesso!
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-lg">{successMessage}</p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowSuccessModal(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Erro */}
      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Erro
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-lg text-red-600">{errorMessage}</p>
          </div>
          <div className="flex justify-end">
            <Button variant="destructive" onClick={() => setShowErrorModal(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

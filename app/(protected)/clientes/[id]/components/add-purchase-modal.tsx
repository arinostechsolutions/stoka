'use client'

import { useState, useTransition, useMemo, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Package, Search, Calendar, Clock, DollarSign, Loader2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'

interface AddPurchaseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerId: string
  onAssociate: (movementId: string) => Promise<{ success: boolean; error?: string }>
}

async function fetchAvailableMovements() {
  const res = await fetch('/api/movements/available')
  if (!res.ok) throw new Error('Erro ao carregar movimentações')
  return res.json()
}

export function AddPurchaseModal({ open, onOpenChange, customerId, onAssociate }: AddPurchaseModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isPending, startTransition] = useTransition()
  const [associatedMovements, setAssociatedMovements] = useState<Set<string>>(new Set())

  const { data: movements = [], isLoading, refetch } = useQuery({
    queryKey: ['available-movements'],
    queryFn: fetchAvailableMovements,
    enabled: open,
  })

  // Reseta o estado quando o modal fecha
  useEffect(() => {
    if (!open) {
      setAssociatedMovements(new Set())
      setSearchTerm('')
    }
  }, [open])

  const filteredMovements = useMemo(() => {
    if (!searchTerm) return movements

    const term = searchTerm.toLowerCase()
    return movements.filter((m: any) => {
      const productName = m.productId?.name || ''
      const productVitrine = m.productId?.nome_vitrine || ''
      return (
        productName.toLowerCase().includes(term) ||
        productVitrine.toLowerCase().includes(term) ||
        m.productId?.brand?.toLowerCase().includes(term)
      )
    })
  }, [movements, searchTerm])

  const handleAssociate = async (movementId: string) => {
    startTransition(async () => {
      const result = await onAssociate(movementId)
      if (result?.success) {
        // Marca como associado
        setAssociatedMovements(prev => new Set(prev).add(movementId))
        // Recarrega a lista de movimentações disponíveis
        await refetch()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Compra Antiga</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search">Buscar Movimentação</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome do produto, marca..."
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
              <p className="text-lg font-medium">Carregando movimentações...</p>
              <p className="text-sm mt-2">Aguarde enquanto buscamos as compras disponíveis</p>
            </div>
          ) : filteredMovements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>
                {searchTerm
                  ? 'Nenhuma movimentação encontrada'
                  : 'Nenhuma movimentação de saída disponível para associar'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {filteredMovements.map((movement: any) => {
                const displayName = movement.productId?.nome_vitrine || movement.productId?.name || 'Produto desconhecido'
                const date = new Date(movement.createdAt)
                const dateStr = formatDate(date)
                const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

                return (
                  <div
                    key={movement._id}
                    className={`p-4 border rounded-lg transition-colors ${
                      associatedMovements.has(movement._id)
                        ? 'bg-muted/30 opacity-75'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div>
                          <h4 className="font-semibold">{displayName}</h4>
                          {movement.productId?.name && movement.productId.name !== displayName && (
                            <p className="text-sm text-muted-foreground">{movement.productId.name}</p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
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
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{dateStr}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{timeStr}</span>
                          </div>
                          {movement.totalRevenue && (
                            <div className="flex items-center gap-1 font-semibold text-primary">
                              <DollarSign className="h-3 w-3" />
                              <span>{formatCurrency(movement.totalRevenue)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleAssociate(movement._id)}
                        size="sm"
                        disabled={isPending || associatedMovements.has(movement._id)}
                        variant={associatedMovements.has(movement._id) ? 'secondary' : 'default'}
                      >
                        {isPending && !associatedMovements.has(movement._id) 
                          ? 'Associando...' 
                          : associatedMovements.has(movement._id) 
                          ? 'Associado' 
                          : 'Associar'}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}


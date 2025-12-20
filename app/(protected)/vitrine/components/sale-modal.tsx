'use client'

import { useState, useTransition, useMemo } from 'react'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, ShoppingCart, DollarSign, Percent, Tag, Package, Megaphone } from 'lucide-react'
import { createMovement } from '@/app/(protected)/movimentacoes/actions'
import { formatCurrency } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'

interface SaleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: any
}

async function fetchCampaigns() {
  const res = await fetch('/api/campaigns')
  if (!res.ok) throw new Error('Erro ao carregar campanhas')
  return res.json()
}

export function SaleModal({ open, onOpenChange, product }: SaleModalProps) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [quantity, setQuantity] = useState('1')
  const [salePrice, setSalePrice] = useState(product?.salePrice?.toString() || '')
  const [discountType, setDiscountType] = useState<'percent' | 'fixed' | ''>('')
  const [discountValue, setDiscountValue] = useState('')
  const [selectedCampaign, setSelectedCampaign] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [quantityError, setQuantityError] = useState('')

  const { data: campaigns = [], isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: fetchCampaigns,
  })

  // Calcula valores
  const basePrice = product?.salePrice || 0
  const quantityNum = Number(quantity) || 0
  const subtotal = basePrice * quantityNum
  const discountAmount = useMemo(() => {
    if (!discountType || !discountValue) return 0
    const discount = Number(discountValue) || 0
    if (discountType === 'percent') {
      return subtotal * (discount / 100)
    }
    return discount
  }, [discountType, discountValue, subtotal])
  const total = Math.max(0, subtotal - discountAmount)

  // Reset quando o modal abre/fecha ou produto muda
  React.useEffect(() => {
    if (open && product) {
      setSalePrice(product.salePrice?.toString() || '')
      setQuantity('1')
      setDiscountType('')
      setDiscountValue('')
      setSelectedCampaign('')
      setNotes('')
      setError('')
      setQuantityError('')
    }
  }, [open, product])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!product) {
      setError('Produto não selecionado')
      return
    }

    if (quantityNum <= 0) {
      setError('Quantidade deve ser maior que zero')
      setQuantityError('Quantidade deve ser maior que zero')
      return
    }

    if (quantityNum > product.quantity) {
      setError(`Quantidade não pode ser maior que o estoque disponível (${product.quantity} unidade${product.quantity !== 1 ? 's' : ''})`)
      setQuantityError(`Estoque disponível: ${product.quantity} unidade${product.quantity !== 1 ? 's' : ''}`)
      return
    }
    
    setQuantityError('')

    if (!salePrice || Number(salePrice.replace(/[^\d,.-]/g, '').replace(',', '.')) <= 0) {
      setError('Preço de venda é obrigatório')
      return
    }

    const formData = new FormData()
    formData.set('productId', product._id)
    formData.set('type', 'saida')
    formData.set('quantity', quantity)
    formData.set('salePrice', salePrice)
    
    if (discountType && discountValue) {
      formData.set('discountType', discountType)
      formData.set('discountValue', discountValue)
    }
    
    if (selectedCampaign) {
      formData.set('campaignId', selectedCampaign)
    }
    
    if (notes) {
      formData.set('notes', notes)
    }

    startTransition(async () => {
      const result = await createMovement(formData)

      if (result.error) {
        setError(result.error)
      } else {
        onOpenChange(false)
        router.refresh()
      }
    })
  }

  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-primary" />
            Registrar Venda
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Informações do Produto */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{product.name}</span>
            </div>
            {product.brand && (
              <p className="text-sm text-muted-foreground">Marca: {product.brand}</p>
            )}
            {product.size && (
              <p className="text-sm text-muted-foreground">Tamanho: {product.size}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Estoque disponível: <span className="font-semibold">{product.quantity}</span>
            </p>
          </div>

          {/* Quantidade */}
          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-sm font-semibold">
              Quantidade *
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={product.quantity}
              value={quantity}
              onChange={(e) => {
                const value = e.target.value
                const numValue = Number(value)
                
                if (value === '') {
                  setQuantity('')
                  setQuantityError('')
                  return
                }
                
                if (numValue <= 0) {
                  setQuantityError('Quantidade deve ser maior que zero')
                  setQuantity(value)
                  return
                }
                
                if (numValue > product.quantity) {
                  setQuantityError(`Estoque disponível: ${product.quantity} unidade${product.quantity !== 1 ? 's' : ''}`)
                  setQuantity(value)
                  return
                }
                
                setQuantityError('')
                setQuantity(value)
              }}
              onBlur={(e) => {
                const numValue = Number(e.target.value)
                if (numValue > product.quantity) {
                  setQuantity(product.quantity.toString())
                  setQuantityError('')
                }
              }}
              required
              className={`h-11 ${quantityError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              title={quantityError || `Máximo: ${product.quantity} unidade${product.quantity !== 1 ? 's' : ''}`}
            />
            {quantityError && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {quantityError}
              </p>
            )}
            {!quantityError && product.quantity > 0 && (
              <p className="text-xs text-muted-foreground">
                Estoque disponível: {product.quantity} unidade{product.quantity !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Preço de Venda */}
          <div className="space-y-2">
            <Label htmlFor="salePrice" className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Preço de Venda *
            </Label>
            <CurrencyInput
              id="salePrice"
              value={salePrice}
              onChange={setSalePrice}
              placeholder="0,00"
              className="h-11"
              required
            />
          </div>

          {/* Desconto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discountType" className="text-sm font-semibold flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tipo de Desconto
              </Label>
              <Select value={discountType} onValueChange={(value: any) => {
                setDiscountType(value)
                setDiscountValue('')
              }}>
                <SelectTrigger>
                  <SelectValue 
                    placeholder="Selecione um tipo"
                    displayValue={discountType === 'percent' ? 'Percentual (%)' : discountType === 'fixed' ? 'Valor Fixo (R$)' : undefined}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sem desconto</SelectItem>
                  <SelectItem value="percent">Percentual (%)</SelectItem>
                  <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {discountType && (
              <div className="space-y-2">
                <Label htmlFor="discountValue" className="text-sm font-semibold flex items-center gap-2">
                  {discountType === 'percent' ? (
                    <Percent className="h-4 w-4" />
                  ) : (
                    <DollarSign className="h-4 w-4" />
                  )}
                  Valor do Desconto *
                </Label>
                {discountType === 'percent' ? (
                  <Input
                    id="discountValue"
                    type="number"
                    min="0"
                    max="100"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder="0"
                    className="h-11"
                    required
                  />
                ) : (
                  <CurrencyInput
                    id="discountValue"
                    value={discountValue}
                    onChange={setDiscountValue}
                    placeholder="0,00"
                    className="h-11"
                    required
                  />
                )}
              </div>
            )}
          </div>

          {/* Resumo */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal ({quantityNum} unidade{quantityNum !== 1 ? 's' : ''}):</span>
              <span className="font-semibold">{formatCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Desconto:</span>
                <span className="font-semibold">- {formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Campanha */}
          <div className="space-y-2">
            <Label htmlFor="campaign" className="text-sm font-semibold flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              Campanha (opcional)
            </Label>
            <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
              <SelectTrigger>
                <SelectValue 
                  placeholder="Selecione uma campanha"
                  displayValue={selectedCampaign ? campaigns.find((c: any) => c._id === selectedCampaign)?.name : undefined}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sem campanha</SelectItem>
                {campaigns.map((campaign: any) => (
                  <SelectItem key={campaign._id} value={campaign._id}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-semibold">
              Observações (opcional)
            </Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações sobre a venda..."
              className="h-11"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Registrando...' : 'Confirmar Venda'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}


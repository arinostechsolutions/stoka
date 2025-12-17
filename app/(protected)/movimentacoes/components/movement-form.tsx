'use client'

import { useState, useTransition, useEffect } from 'react'
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
import { AlertCircle, Package, Building2, ArrowLeftRight, Hash, FileText, TrendingUp, TrendingDown, Settings, DollarSign, Percent, Tag } from 'lucide-react'
import { createMovement } from '../actions'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'

interface MovementFormProps {
  children: React.ReactNode
  productId?: string
}

async function fetchProducts(supplierId?: string) {
  const params = new URLSearchParams()
  if (supplierId && supplierId !== '') {
    params.append('supplierId', supplierId)
  }
  const res = await fetch(`/api/products?${params.toString()}`)
  if (!res.ok) throw new Error('Erro ao carregar produtos')
  return res.json()
}

async function fetchSuppliers() {
  const res = await fetch('/api/suppliers')
  if (!res.ok) throw new Error('Erro ao carregar fornecedores')
  return res.json()
}

export function MovementForm({ children, productId }: MovementFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [selectedProduct, setSelectedProduct] = useState(productId || '')
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [type, setType] = useState<'entrada' | 'saida' | 'ajuste'>('entrada')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [discountType, setDiscountType] = useState<'percent' | 'fixed' | ''>('')
  const [discountValue, setDiscountValue] = useState('')
  const [notes, setNotes] = useState('')
  const [currentStock, setCurrentStock] = useState<number | null>(null)

  // Busca produtos filtrados por fornecedor
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', selectedSupplier],
    queryFn: () => fetchProducts(selectedSupplier),
    enabled: true, // Sempre busca, mesmo sem fornecedor selecionado
  })

  const { data: suppliers = [], isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: fetchSuppliers,
  })

  useEffect(() => {
    if (productId) {
      setSelectedProduct(productId)
    }
  }, [productId])

  // Limpa a seleção de produto quando o fornecedor muda
  useEffect(() => {
    if (selectedSupplier && selectedProduct) {
      // Verifica se o produto selecionado pertence ao fornecedor
      const product = products.find((p: any) => p._id === selectedProduct)
      const productSupplierId = product?.supplierId?._id || product?.supplierId
      if (product && productSupplierId && productSupplierId.toString() !== selectedSupplier) {
        setSelectedProduct('')
        setCurrentStock(null)
      }
    } else if (selectedSupplier && !selectedProduct) {
      // Se mudou o fornecedor e não há produto selecionado, não faz nada
    } else if (!selectedSupplier) {
      // Se removeu o fornecedor, mantém o produto selecionado (se houver)
    }
  }, [selectedSupplier, products, selectedProduct])

  // Atualiza o estoque atual quando o produto é selecionado
  useEffect(() => {
    if (selectedProduct) {
      const product = products.find((p: any) => p._id === selectedProduct)
      if (product) {
        setCurrentStock(product.quantity || 0)
      } else {
        setCurrentStock(null)
      }
    } else {
      setCurrentStock(null)
    }
  }, [selectedProduct, products])

  // Reseta campos específicos quando o tipo de movimentação muda
  useEffect(() => {
    if (type === 'entrada') {
      // Limpa campos de saída
      setSalePrice('')
      setDiscountType('')
      setDiscountValue('')
    } else if (type === 'saida') {
      // Limpa campos de entrada
      setPrice('')
    } else if (type === 'ajuste') {
      // Limpa todos os campos de preço
      setPrice('')
      setSalePrice('')
      setDiscountType('')
      setDiscountValue('')
    }
  }, [type])

  // Calcula se o estoque ficaria negativo
  const wouldBeNegative = React.useMemo(() => {
    if (type === 'saida' && currentStock !== null && quantity) {
      const quantityNum = Number(quantity)
      if (!isNaN(quantityNum) && quantityNum > 0) {
        return currentStock - quantityNum < 0
      }
    }
    return false
  }, [type, currentStock, quantity])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!selectedProduct) {
      setError('Selecione um produto')
      return
    }

    // Validação: não permite saída que deixe estoque negativo
    if (wouldBeNegative) {
      setError(`Quantidade insuficiente em estoque. Estoque atual: ${currentStock}`)
      return
    }

    const formData = new FormData()
    formData.append('productId', selectedProduct)
    formData.append('type', type)
    formData.append('quantity', quantity)
    if (price) formData.append('price', price)
    if (salePrice) formData.append('salePrice', salePrice)
    if (discountType && discountValue) {
      formData.append('discountType', discountType)
      formData.append('discountValue', discountValue)
    }
    if (selectedSupplier) formData.append('supplierId', selectedSupplier)
    if (notes) formData.append('notes', notes)

    startTransition(async () => {
      const result = await createMovement(formData)

      if (result.error) {
        setError(result.error)
      } else {
        setOpen(false)
        // Reset all fields
        setSelectedProduct('')
        setSelectedSupplier('')
        setType('entrada')
        setQuantity('')
        setPrice('')
        setSalePrice('')
        setDiscountType('')
        setDiscountValue('')
        setNotes('')
        setCurrentStock(null)
        router.refresh()
      }
    })
  }

  const getTypeIcon = () => {
    switch (type) {
      case 'entrada':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'saida':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'ajuste':
        return <Settings className="h-4 w-4 text-blue-600" />
    }
  }

  const getTypeColor = () => {
    switch (type) {
      case 'entrada':
        return 'border-green-200 bg-green-50'
      case 'saida':
        return 'border-red-200 bg-red-50'
      case 'ajuste':
        return 'border-blue-200 bg-blue-50'
    }
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>{children}</div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-6 w-6 text-primary" />
              Nova Movimentação
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            <div className="space-y-4">
              {/* Fornecedor - PRIMEIRO CAMPO */}
              <div className="space-y-2">
                <Label htmlFor="supplier" className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Fornecedor
                </Label>
                {isLoadingSuppliers ? (
                  <div className="h-11 w-full rounded-md border bg-muted animate-pulse" />
                ) : (
                  <Select
                    value={selectedSupplier}
                    onValueChange={(value) => {
                      setSelectedSupplier(value)
                      // Limpa a seleção de produto quando o fornecedor muda
                      setSelectedProduct('')
                    }}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue 
                        placeholder="Selecione um fornecedor (opcional)"
                        displayValue={
                          selectedSupplier
                            ? suppliers.find((s: any) => s._id === selectedSupplier)?.name || ''
                            : undefined
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os produtos</SelectItem>
                      {suppliers.map((supplier: any) => (
                        <SelectItem key={supplier._id} value={supplier._id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Produto - filtrado pelo fornecedor selecionado */}
              <div className="space-y-2">
                <Label htmlFor="product" className="text-sm font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Produto *
                  {selectedSupplier && (
                    <span className="text-xs font-normal text-muted-foreground ml-1">
                      (filtrado por fornecedor)
                    </span>
                  )}
                </Label>
                {isLoading ? (
                  <div className="h-11 w-full rounded-md border bg-muted animate-pulse" />
                ) : (
                      <Select
                        value={selectedProduct}
                        onValueChange={setSelectedProduct}
                      >
                        <SelectTrigger className="h-11" disabled={!selectedSupplier && products.length === 0}>
                      <SelectValue
                        placeholder={
                          selectedSupplier
                            ? "Selecione um produto do fornecedor"
                            : "Selecione um produto"
                        }
                        displayValue={
                          selectedProduct
                            ? products.find((p: any) => p._id === selectedProduct)?.name || ''
                            : undefined
                        }
                      />
                    </SelectTrigger>
                      <SelectContent>
                        {products.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            {selectedSupplier
                              ? "Nenhum produto associado a este fornecedor"
                              : "Nenhum produto disponível"}
                          </div>
                        ) : (
                        products.map((product: any) => (
                          <SelectItem key={product._id} value={product._id}>
                            {product.name} ({product.quantity} em estoque)
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className={`space-y-2 p-4 rounded-lg border-2 ${getTypeColor()}`}>
                <Label htmlFor="type" className="text-sm font-semibold flex items-center gap-2">
                  {getTypeIcon()}
                  Tipo de Movimentação *
                </Label>
                  <Select
                    value={type}
                    onValueChange={(v) => setType(v as 'entrada' | 'saida' | 'ajuste')}
                  >
                  <SelectTrigger className="h-11 bg-background">
                    <SelectValue
                      displayValue={
                        type === 'entrada'
                          ? 'Entrada'
                          : type === 'saida'
                          ? 'Saída'
                          : type === 'ajuste'
                          ? 'Ajuste Manual'
                          : undefined
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                    <SelectItem value="ajuste">Ajuste Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="quantity" className="text-sm font-semibold flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Quantidade *
                    {type === 'ajuste' && (
                      <span className="text-xs font-normal text-muted-foreground ml-1">
                        (nova quantidade)
                      </span>
                    )}
                  </Label>
                  {currentStock !== null && selectedProduct && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Estoque atual: </span>
                      <span className="font-bold text-primary">{currentStock}</span>
                    </div>
                  )}
                </div>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  placeholder="0"
                  className="h-11 text-lg font-semibold"
                />
                {currentStock !== null && selectedProduct && quantity && !isNaN(Number(quantity)) && Number(quantity) > 0 && (
                  <div className="mt-2 p-3 rounded-lg border-2 bg-muted/50">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Estoque após movimentação:</span>
                      <span className={`font-bold text-lg ${
                        type === 'entrada' 
                          ? 'text-green-600' 
                          : type === 'saida' 
                          ? 'text-red-600' 
                          : 'text-blue-600'
                      }`}>
                        {type === 'entrada' 
                          ? currentStock + Number(quantity)
                          : type === 'saida'
                          ? Math.max(0, currentStock - Number(quantity))
                          : Number(quantity)
                        }
                      </span>
                    </div>
                    {type === 'saida' && currentStock - Number(quantity) < 0 && (
                      <div className="mt-2 text-xs text-destructive font-medium">
                        ⚠️ Atenção: Estoque ficará negativo!
                      </div>
                    )}
                  </div>
                )}
              </div>

              {type === 'entrada' && (
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-sm font-semibold flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Preço Unitário (opcional)
                  </Label>
                  <CurrencyInput
                    id="price"
                    name="price"
                    value={price}
                    onChange={setPrice}
                    placeholder="0,00"
                    className="h-11"
                  />
                </div>
              )}

              {type === 'saida' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200"
                >
                  <div className="space-y-2">
                    <Label htmlFor="salePrice" className="text-sm font-semibold flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Preço de Venda Unitário (opcional)
                    </Label>
                    <CurrencyInput
                      id="salePrice"
                      name="salePrice"
                      value={salePrice}
                      onChange={setSalePrice}
                      placeholder="0,00"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discountType" className="text-sm font-semibold flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Tipo de Desconto
                    </Label>
                    <Select
                      value={discountType}
                      onValueChange={(v) => {
                        setDiscountType(v as 'percent' | 'fixed' | '')
                        if (!v) setDiscountValue('')
                      }}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Sem desconto" />
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
                        Valor do Desconto
                      </Label>
                      {discountType === 'percent' ? (
                        <Input
                          id="discountValue"
                          name="discountValue"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={discountValue}
                          onChange={(e) => setDiscountValue(e.target.value)}
                          placeholder="0,00"
                          className="h-11"
                        />
                      ) : (
                        <CurrencyInput
                          id="discountValue"
                          name="discountValue"
                          value={discountValue}
                          onChange={setDiscountValue}
                          placeholder="0,00"
                          className="h-11"
                        />
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Observações
                </Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Compra de fornecedor X"
                  className="h-11"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="h-11"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isPending || wouldBeNegative || !selectedProduct || !quantity || Number(quantity) <= 0} 
                className="h-11 min-w-[120px]"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <motion.div
                      className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    />
                    Salvando...
                  </span>
                ) : (
                  'Criar Movimentação'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

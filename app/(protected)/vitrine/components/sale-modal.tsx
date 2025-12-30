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
import { AlertCircle, ShoppingCart, DollarSign, Percent, Tag, Package, Megaphone, User, CreditCard, MessageCircle, Plus, X } from 'lucide-react'
import { createSale } from '@/app/(protected)/movimentacoes/actions'
import { formatCurrency, formatPhone, getWhatsAppUrl } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import Image from 'next/image'

interface SaleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: any
  allProducts?: any[] // Todos os produtos disponíveis para adicionar à venda
}

interface SaleItem {
  productId: string
  product: any
  quantity: number
  salePrice: number
  discountType?: 'percent' | 'fixed'
  discountValue?: number
}

async function fetchCampaigns() {
  const res = await fetch('/api/campaigns')
  if (!res.ok) throw new Error('Erro ao carregar campanhas')
  return res.json()
}

async function fetchCustomers() {
  const res = await fetch('/api/customers')
  if (!res.ok) throw new Error('Erro ao carregar clientes')
  return res.json()
}

async function fetchProducts() {
  const res = await fetch('/api/products')
  if (!res.ok) throw new Error('Erro ao carregar produtos')
  return res.json()
}

export function SaleModal({ open, onOpenChange, product, allProducts }: SaleModalProps) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [saleItems, setSaleItems] = useState<SaleItem[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<string>('')
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cartao_credito' | 'cartao_debito' | 'pix' | 'pix_parcelado' | ''>('')
  const [installmentsCount, setInstallmentsCount] = useState<number>(1)
  const [installmentDueDate, setInstallmentDueDate] = useState<string>('')
  const [downPayment, setDownPayment] = useState<string>('0')
  const [notes, setNotes] = useState('')
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [productSearch, setProductSearch] = useState('')

  const { data: campaigns = [], isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: fetchCampaigns,
  })

  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
  })

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
    enabled: showAddProduct,
  })

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers
    const search = customerSearch.toLowerCase()
    return customers.filter((c: any) => 
      c.name.toLowerCase().includes(search) ||
      c.phone?.toLowerCase().includes(search) ||
      c.instagram?.toLowerCase().includes(search)
    )
  }, [customers, customerSearch])

  const filteredProducts = useMemo(() => {
    if (!productSearch) return products
    const search = productSearch.toLowerCase()
    return products.filter((p: any) => 
      p.name.toLowerCase().includes(search) ||
      p.nome_vitrine?.toLowerCase().includes(search) ||
      p.brand?.toLowerCase().includes(search)
    )
  }, [products, productSearch])

  // Inicializa com o produto selecionado quando o modal abre
  React.useEffect(() => {
    if (open && product) {
      setSaleItems([{
        productId: product._id,
        product: product,
        quantity: 1,
        salePrice: product.salePrice || 0,
        discountType: undefined,
        discountValue: undefined,
      }])
      setSelectedCampaign('')
      setSelectedCustomer('')
      setCustomerSearch('')
      setPaymentMethod('')
      setInstallmentsCount(1)
      setInstallmentDueDate('')
      setDownPayment('0')
      setNotes('')
      setError('')
      setShowAddProduct(false)
      setProductSearch('')
    }
  }, [open, product])

  // Calcula totais
  const totals = useMemo(() => {
    let subtotal = 0
    let totalDiscount = 0
    let total = 0

    saleItems.forEach(item => {
      const itemSubtotal = item.salePrice * item.quantity
      subtotal += itemSubtotal

      let itemDiscount = 0
      if (item.discountType && item.discountValue !== undefined) {
        if (item.discountType === 'percent') {
          itemDiscount = itemSubtotal * (item.discountValue / 100)
        } else {
          itemDiscount = item.discountValue
        }
      }
      totalDiscount += itemDiscount
    })

    total = Math.max(0, subtotal - totalDiscount)

    return { subtotal, totalDiscount, total }
  }, [saleItems])

  const addProductToSale = (productToAdd: any) => {
    // Verifica se o produto já está na lista
    if (saleItems.some(item => item.productId === productToAdd._id)) {
      setError('Este produto já está na venda')
      return
    }

    setSaleItems([...saleItems, {
      productId: productToAdd._id,
      product: productToAdd,
      quantity: 1,
      salePrice: productToAdd.salePrice || 0,
      discountType: undefined,
      discountValue: undefined,
    }])
    setProductSearch('')
    setShowAddProduct(false)
    setError('')
  }

  const removeProductFromSale = (productId: string) => {
    if (saleItems.length === 1) {
      setError('A venda deve ter pelo menos um produto')
      return
    }
    setSaleItems(saleItems.filter(item => item.productId !== productId))
  }

  const updateSaleItem = (productId: string, field: keyof SaleItem, value: any) => {
    setSaleItems(saleItems.map(item => {
      if (item.productId === productId) {
        return { ...item, [field]: value }
      }
      return item
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (saleItems.length === 0) {
      setError('Adicione pelo menos um produto à venda')
      return
    }

    // Valida todos os itens
    for (const item of saleItems) {
      if (item.quantity <= 0) {
        setError(`Quantidade inválida para ${item.product.name || item.product.nome_vitrine}`)
        return
      }

      if (item.quantity > item.product.quantity) {
        setError(`Quantidade insuficiente para ${item.product.name || item.product.nome_vitrine}. Estoque disponível: ${item.product.quantity}`)
        return
      }

      if (!item.salePrice || item.salePrice <= 0) {
        setError(`Preço de venda inválido para ${item.product.name || item.product.nome_vitrine}`)
        return
      }
    }

    const formData = new FormData()
    
    // Prepara os itens da venda
    const items = saleItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      salePrice: item.salePrice,
      discountType: item.discountType,
      discountValue: item.discountValue,
    }))
    
    formData.set('items', JSON.stringify(items))
    
    if (selectedCampaign) {
      formData.set('campaignId', selectedCampaign)
    }
    
    if (selectedCustomer) {
      formData.set('customerId', selectedCustomer)
    }
    
    if (paymentMethod) {
      formData.set('paymentMethod', paymentMethod)
    }
    
    // Adiciona informações de parcelamento se for PIX Parcelado
    if (paymentMethod === 'pix_parcelado') {
      formData.set('installmentsCount', installmentsCount.toString())
      if (installmentDueDate) {
        formData.set('installmentDueDate', installmentDueDate)
      }
      if (downPayment) {
        formData.set('downPayment', downPayment)
      }
    }
    
    if (notes) {
      formData.set('notes', notes)
    }

    startTransition(async () => {
      const result = await createSale(formData)

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-primary" />
            Registrar Venda {saleItems.length > 1 && `(${saleItems.length} produtos)`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Lista de Produtos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Produtos na Venda</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddProduct(!showAddProduct)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Produto
              </Button>
            </div>

            {showAddProduct && (
              <Card className="p-4 space-y-2">
                <Input
                  placeholder="Buscar produto por nome, nome vitrine ou marca..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="h-10"
                />
                {productSearch && filteredProducts.length > 0 && (
                  <div className="border rounded-md max-h-48 overflow-y-auto bg-background">
                    {filteredProducts
                      .filter((p: any) => !saleItems.some(item => item.productId === p._id))
                      .map((p: any) => (
                        <div
                          key={p._id}
                          onClick={() => addProductToSale(p)}
                          className="p-2 cursor-pointer hover:bg-muted transition-colors flex items-start gap-3"
                        >
                          {p.imageUrl && (
                            <div className="relative w-12 h-12 rounded-md overflow-hidden border bg-muted shrink-0">
                              <Image
                                src={p.imageUrl}
                                alt={p.name || p.nome_vitrine || 'Produto'}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{p.name || p.nome_vitrine}</div>
                            {p.brand && <div className="text-xs text-muted-foreground">Marca: {p.brand}</div>}
                            {p.size && (
                              <div className="text-xs font-semibold text-primary mt-0.5">
                                Tamanho: {p.size}
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground">
                              Estoque: {p.quantity} | Preço: {formatCurrency(p.salePrice || 0)}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </Card>
            )}

            {saleItems.map((item, index) => {
              const itemSubtotal = item.salePrice * item.quantity
              // Calcula desconto diretamente (sem hook)
              let itemDiscount = 0
              if (item.discountType && item.discountValue !== undefined) {
                if (item.discountType === 'percent') {
                  itemDiscount = itemSubtotal * (item.discountValue / 100)
                } else {
                  itemDiscount = item.discountValue
                }
              }
              const itemTotal = Math.max(0, itemSubtotal - itemDiscount)

              return (
                <Card key={item.productId} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{item.product.name || item.product.nome_vitrine}</span>
                        {saleItems.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeProductFromSale(item.productId)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      {item.product.brand && (
                        <p className="text-sm text-muted-foreground">Marca: {item.product.brand}</p>
                      )}
                      {item.product.size && (
                        <p className="text-sm text-muted-foreground">Tamanho: {item.product.size}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Estoque disponível: <span className="font-semibold">{item.product.quantity}</span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Quantidade *</Label>
                      <Input
                        type="number"
                        min="1"
                        max={item.product.quantity}
                        value={item.quantity}
                        onChange={(e) => {
                          const value = Number(e.target.value)
                          if (value > 0 && value <= item.product.quantity) {
                            updateSaleItem(item.productId, 'quantity', value)
                          }
                        }}
                        required
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Preço de Venda *</Label>
                      <CurrencyInput
                        value={item.salePrice.toString()}
                        onChange={(value) => updateSaleItem(item.productId, 'salePrice', Number(value.replace(/[^\d,.-]/g, '').replace(',', '.')))}
                        placeholder="0,00"
                        className="h-10"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Tipo de Desconto</Label>
                      <Select
                        value={item.discountType || ''}
                        onValueChange={(value: string) => {
                          updateSaleItem(item.productId, 'discountType', value || undefined)
                          if (!value) {
                            updateSaleItem(item.productId, 'discountValue', undefined)
                          }
                        }}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Sem desconto" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Sem desconto</SelectItem>
                          <SelectItem value="percent">Percentual (%)</SelectItem>
                          <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {item.discountType && (
                    <div className="space-y-2">
                      <Label className="text-xs">
                        Valor do Desconto *
                        {item.discountType === 'percent' && ' (%)'}
                        {item.discountType === 'fixed' && ' (R$)'}
                      </Label>
                      {item.discountType === 'percent' ? (
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discountValue || ''}
                          onChange={(e) => updateSaleItem(item.productId, 'discountValue', Number(e.target.value))}
                          placeholder="0"
                          className="h-10"
                          required
                        />
                      ) : (
                        <CurrencyInput
                          value={item.discountValue?.toString() || ''}
                          onChange={(value) => updateSaleItem(item.productId, 'discountValue', Number(value.replace(/[^\d,.-]/g, '').replace(',', '.')))}
                          placeholder="0,00"
                          className="h-10"
                          required
                        />
                      )}
                    </div>
                  )}

                  <div className="pt-2 border-t">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span className="font-semibold">{formatCurrency(itemSubtotal)}</span>
                    </div>
                    {itemDiscount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Desconto:</span>
                        <span>- {formatCurrency(itemDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold mt-1">
                      <span>Total do Item:</span>
                      <span>{formatCurrency(itemTotal)}</span>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Resumo Geral */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal ({saleItems.reduce((sum, item) => sum + item.quantity, 0)} unidade{saleItems.reduce((sum, item) => sum + item.quantity, 0) !== 1 ? 's' : ''}):</span>
              <span className="font-semibold">{formatCurrency(totals.subtotal)}</span>
            </div>
            {totals.totalDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Desconto Total:</span>
                <span className="font-semibold">- {formatCurrency(totals.totalDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total da Venda:</span>
              <span className="text-primary">{formatCurrency(totals.total)}</span>
            </div>
            
            {/* Mostra valor pendente e valor por parcela se for PIX Parcelado */}
            {paymentMethod === 'pix_parcelado' && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                {(() => {
                  const downPaymentValue = downPayment ? Number(downPayment.replace(/[^\d,.-]/g, '').replace(',', '.')) : 0
                  const pendingAmount = Math.max(0, totals.total - downPaymentValue)
                  const installmentValue = installmentsCount > 1 ? pendingAmount / installmentsCount : 0
                  
                  return (
                    <div className="space-y-2">
                      {downPaymentValue > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Entrada:</span>
                          <span className="font-semibold text-green-600">{formatCurrency(downPaymentValue)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-semibold">
                        <span>Pendente de pagamento:</span>
                        <span className="text-blue-700">{formatCurrency(pendingAmount)}</span>
                      </div>
                      {installmentsCount > 1 && installmentValue > 0 && (
                        <div className="flex justify-between text-sm pt-2 border-t border-blue-300">
                          <span>Valor por parcela ({installmentsCount}x):</span>
                          <span className="font-bold text-blue-800">{formatCurrency(installmentValue)}</span>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            )}
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

          {/* Cliente */}
          <div className="space-y-2">
            <Label htmlFor="customer" className="text-sm font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Cliente (opcional)
            </Label>
            <div className="space-y-2">
              <Input
                id="customerSearch"
                placeholder="Buscar cliente por nome, telefone ou Instagram..."
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value)
                  if (!e.target.value) {
                    setSelectedCustomer('')
                  }
                }}
                className="h-11"
              />
              {customerSearch && filteredCustomers.length > 0 && !selectedCustomer && (
                <div className="border rounded-md max-h-48 overflow-y-auto bg-background z-10">
                  {filteredCustomers.map((customer: any) => (
                    <div
                      key={customer._id}
                      onClick={() => {
                        setSelectedCustomer(customer._id)
                        setCustomerSearch(customer.name)
                      }}
                      className="p-2 cursor-pointer hover:bg-muted transition-colors"
                    >
                      <div className="font-medium">{customer.name}</div>
                      {customer.phone && (
                        <a
                          href={getWhatsAppUrl(customer.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                        >
                          <MessageCircle className="h-3 w-3" />
                          {formatPhone(customer.phone)}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {customerSearch && filteredCustomers.length === 0 && (
                <div className="text-sm text-muted-foreground p-2">
                  Nenhum cliente encontrado
                </div>
              )}
              {selectedCustomer && !customerSearch && (
                <div className="text-sm text-muted-foreground flex items-center justify-between p-2 bg-muted rounded-md">
                  <span>Cliente: {customers.find((c: any) => c._id === selectedCustomer)?.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCustomer('')
                      setCustomerSearch('')
                    }}
                  >
                    Remover
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Meio de Pagamento */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod" className="text-sm font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Meio de Pagamento (opcional)
            </Label>
            <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
              <SelectTrigger>
                <SelectValue 
                  placeholder="Selecione o meio de pagamento"
                  displayValue={
                    paymentMethod === 'cartao_credito' ? 'Cartão de Crédito' :
                    paymentMethod === 'cartao_debito' ? 'Cartão de Débito' :
                    paymentMethod === 'pix' ? 'PIX' :
                    paymentMethod === 'pix_parcelado' ? 'PIX Parcelado' :
                    undefined
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Não especificado</SelectItem>
                <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="pix_parcelado">PIX Parcelado</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Campos de parcelamento - só aparece se for PIX Parcelado */}
            {paymentMethod === 'pix_parcelado' && (
              <div className="mt-4 space-y-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <div className="space-y-2">
                  <Label htmlFor="installmentsCount" className="text-sm font-semibold flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Quantidade de Parcelas
                  </Label>
                  <Select 
                    value={installmentsCount.toString()} 
                    onValueChange={(value) => setInstallmentsCount(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a quantidade de parcelas" />
                    </SelectTrigger>
                    <SelectContent>
                      {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}x
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="downPayment" className="text-sm font-semibold flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Valor de Entrada (opcional)
                  </Label>
                  <CurrencyInput
                    id="downPayment"
                    value={downPayment}
                    onChange={setDownPayment}
                    placeholder="0,00"
                    className="h-11"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="installmentDueDate" className="text-sm font-semibold flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Data da Primeira Parcela {(() => {
                      const downPaymentValue = downPayment ? Number(downPayment.replace(/[^\d,.-]/g, '').replace(',', '.')) : 0
                      return downPaymentValue > 0 ? '(opcional)' : ''
                    })()}
                  </Label>
                  <Input
                    id="installmentDueDate"
                    type="date"
                    value={installmentDueDate}
                    onChange={(e) => setInstallmentDueDate(e.target.value)}
                    className="h-11"
                    required={(() => {
                      const downPaymentValue = downPayment ? Number(downPayment.replace(/[^\d,.-]/g, '').replace(',', '.')) : 0
                      return paymentMethod === 'pix_parcelado' && downPaymentValue === 0
                    })()}
                  />
                  {(() => {
                    const downPaymentValue = downPayment ? Number(downPayment.replace(/[^\d,.-]/g, '').replace(',', '.')) : 0
                    if (downPaymentValue > 0 && !installmentDueDate) {
                      return (
                        <p className="text-xs text-muted-foreground">
                          Se não informar, a primeira parcela será em 1 mês a partir de hoje
                        </p>
                      )
                    }
                    return null
                  })()}
                </div>
              </div>
            )}
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

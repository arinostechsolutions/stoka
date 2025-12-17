'use client'

import { useState, useTransition } from 'react'
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
import { AlertCircle, Package, ShoppingCart, Hash, FileText, DollarSign } from 'lucide-react'
import { createMovement } from '@/app/(protected)/movimentacoes/actions'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'

interface PurchaseFormProps {
  children: React.ReactNode
  supplierId: string
}

async function fetchProducts() {
  const res = await fetch('/api/products')
  if (!res.ok) throw new Error('Erro ao carregar produtos')
  return res.json()
}

export function PurchaseForm({ children, supplierId }: PurchaseFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [selectedProduct, setSelectedProduct] = useState('')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [notes, setNotes] = useState('')

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!selectedProduct) {
      setError('Selecione um produto')
      return
    }

    const formData = new FormData()
    formData.append('productId', selectedProduct)
    formData.append('supplierId', supplierId)
    formData.append('type', 'entrada')
    formData.append('quantity', quantity)
    if (price) formData.append('price', price)
    if (notes) formData.append('notes', notes)

    startTransition(async () => {
      const result = await createMovement(formData)

      if (result.error) {
        setError(result.error)
      } else {
        setOpen(false)
        setSelectedProduct('')
        setQuantity('')
        setPrice('')
        setNotes('')
        router.refresh()
      }
    })
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>{children}</div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-primary" />
              Registrar Compra
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
              <div className="space-y-2">
                <Label htmlFor="product" className="text-sm font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Produto *
                </Label>
                {isLoading ? (
                  <div className="h-11 w-full rounded-md border bg-muted animate-pulse" />
                ) : (
                  <Select
                    value={selectedProduct}
                    onValueChange={setSelectedProduct}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue
                        placeholder="Selecione um produto"
                        displayValue={
                          selectedProduct
                            ? products.find((p: any) => p._id === selectedProduct)?.name || ''
                            : undefined
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product: any) => (
                        <SelectItem key={product._id} value={product._id}>
                          {product.name} ({product.quantity} em estoque)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2 p-4 bg-green-50 rounded-lg border-2 border-green-200">
                <Label htmlFor="quantity" className="text-sm font-semibold flex items-center gap-2">
                  <Hash className="h-4 w-4 text-green-600" />
                  Quantidade Comprada *
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  placeholder="0"
                  className="h-11 text-lg font-semibold bg-background"
                />
              </div>

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

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Observações
                </Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Nota fiscal, lote, etc."
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
              <Button type="submit" disabled={isPending} className="h-11 min-w-[120px]">
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <motion.div
                      className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    />
                    Registrando...
                  </span>
                ) : (
                  'Registrar Compra'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}


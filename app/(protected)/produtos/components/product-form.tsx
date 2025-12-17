'use client'

import { useState, useTransition } from 'react'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Package, Hash, Tag, Building2, Box, AlertTriangle, DollarSign, Ruler, Palette, Award, Shirt } from 'lucide-react'
import { createProduct, updateProduct } from '../actions'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'

async function fetchSuppliers() {
  const res = await fetch('/api/suppliers')
  if (!res.ok) throw new Error('Erro ao carregar fornecedores')
  const data = await res.json()
  // Retorna fornecedores com category incluída
  return data
}

interface ProductFormProps {
  children: React.ReactNode
  product?: {
    _id: string
    name: string
    sku?: string
    category?: string
    supplierId?: string
    quantity: number
    minQuantity: number
    purchasePrice?: number
    salePrice?: number
    size?: string
    color?: string
    brand?: string
    material?: string
  }
}

export function ProductForm({ children, product }: ProductFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [selectedSupplier, setSelectedSupplier] = useState(product?.supplierId || '')
  const [purchasePrice, setPurchasePrice] = useState<string>(product?.purchasePrice?.toString() || '')
  const [salePrice, setSalePrice] = useState<string>(product?.salePrice?.toString() || '')
  const [size, setSize] = useState(product?.size || '')
  const [color, setColor] = useState(product?.color || '')
  const [brand, setBrand] = useState(product?.brand || '')
  const [material, setMaterial] = useState(product?.material || '')

  const { data: suppliers = [], isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: fetchSuppliers,
  })
  
  // Verifica se o fornecedor selecionado é de vestuário
  const selectedSupplierData = React.useMemo(() => {
    return suppliers.find((s: any) => s._id === selectedSupplier)
  }, [suppliers, selectedSupplier])
  
  const isVestuarioSupplier = React.useMemo(() => {
    return selectedSupplierData?.category === 'vestuario'
  }, [selectedSupplierData])
  

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    const formData = new FormData(e.currentTarget)

    // Garante que os campos de vestuário sejam sempre enviados (mesmo que vazios)
    // Isso é necessário para que o backend saiba que os campos foram enviados
    if (isVestuarioSupplier) {
      formData.set('size', size || '')
      formData.set('color', color || '')
      formData.set('brand', brand || '')
      formData.set('material', material || '')
    }

    startTransition(async () => {
      const result = product
        ? await updateProduct(product._id, formData)
        : await createProduct(formData)

      if (result.error) {
        setError(result.error)
      } else {
        setOpen(false)
        setPurchasePrice('')
        setSalePrice('')
        setSize('')
        setColor('')
        setBrand('')
        setMaterial('')
        router.refresh()
      }
    })
  }

  // Reset form when modal opens/closes or product changes
  React.useEffect(() => {
    if (open && product) {
      setSelectedSupplier(product.supplierId || '')
      setPurchasePrice(product.purchasePrice?.toString() || '')
      setSalePrice(product.salePrice?.toString() || '')
      setSize(product.size || '')
      setColor(product.color || '')
      setBrand(product.brand || '')
      setMaterial(product.material || '')
    } else if (!open && !product) {
      // Só reseta se não estiver editando
      setSelectedSupplier('')
      setPurchasePrice('')
      setSalePrice('')
      setSize('')
      setColor('')
      setBrand('')
      setMaterial('')
    }
  }, [open, product])

  return (
    <>
      <div onClick={() => setOpen(true)}>{children}</div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              {product ? 'Editar Produto' : 'Novo Produto'}
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
                    onValueChange={setSelectedSupplier}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue 
                        placeholder="Selecione um fornecedor"
                        displayValue={
                          selectedSupplier
                            ? suppliers.find((s: any) => s._id === selectedSupplier)?.name || ''
                            : undefined
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum fornecedor</SelectItem>
                      {suppliers.map((supplier: any) => (
                        <SelectItem key={supplier._id} value={supplier._id}>
                          {supplier.name} {supplier.category === 'vestuario' && '👕'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <input type="hidden" name="supplierId" value={selectedSupplier} />
              </div>

              {/* Campos de vestuário - aparecem IMEDIATAMENTE após selecionar fornecedor de vestuário */}
              {isVestuarioSupplier && (
                <div className="space-y-4 p-4 bg-purple-50 rounded-lg border-2 border-purple-200 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Shirt className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-purple-900">Informações de Vestuário</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="size" className="text-sm font-semibold flex items-center gap-2">
                        <Ruler className="h-4 w-4" />
                        Tamanho
                      </Label>
                      <Input
                        id="size"
                        name="size"
                        value={size}
                        onChange={(e) => setSize(e.target.value)}
                        placeholder="Ex: P, M, G, GG"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="color" className="text-sm font-semibold flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        Cor
                      </Label>
                      <Input
                        id="color"
                        name="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        placeholder="Ex: Azul, Vermelho"
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="brand" className="text-sm font-semibold flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        Marca
                      </Label>
                      <Input
                        id="brand"
                        name="brand"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        placeholder="Ex: Nike, Adidas"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="material" className="text-sm font-semibold flex items-center gap-2">
                        <Shirt className="h-4 w-4" />
                        Material
                      </Label>
                      <Input
                        id="material"
                        name="material"
                        value={material}
                        onChange={(e) => setMaterial(e.target.value)}
                        placeholder="Ex: Algodão, Poliéster"
                        className="h-11"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Nome do Produto *
                </Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={product?.name}
                  required
                  placeholder="Ex: Notebook Dell"
                  className="h-11 text-base"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku" className="text-sm font-semibold flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    SKU
                  </Label>
                  <Input
                    id="sku"
                    name="sku"
                    defaultValue={product?.sku}
                    placeholder="Ex: NTB-001"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-semibold flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Categoria
                  </Label>
                  <Input
                    id="category"
                    name="category"
                    defaultValue={product?.category}
                    placeholder="Ex: Eletrônicos"
                    className="h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg border">
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-sm font-semibold flex items-center gap-2">
                    <Box className="h-4 w-4" />
                    Quantidade Atual *
                  </Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="0"
                    defaultValue={product?.quantity ?? 0}
                    required
                    className="h-11 text-lg font-semibold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minQuantity" className="text-sm font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Estoque Mínimo *
                  </Label>
                  <Input
                    id="minQuantity"
                    name="minQuantity"
                    type="number"
                    min="0"
                    defaultValue={product?.minQuantity ?? 0}
                    required
                    className="h-11 text-lg font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchasePrice" className="text-sm font-semibold flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Preço de Compra
                  </Label>
                  <CurrencyInput
                    id="purchasePrice"
                    name="purchasePrice"
                    value={purchasePrice}
                    onChange={setPurchasePrice}
                    placeholder="0,00"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salePrice" className="text-sm font-semibold flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Preço de Venda
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
                    Salvando...
                  </span>
                ) : (
                  product ? 'Atualizar' : 'Criar Produto'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

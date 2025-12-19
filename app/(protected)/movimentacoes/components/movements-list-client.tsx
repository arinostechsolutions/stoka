'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MovementForm } from './movement-form'
import { formatDate, formatCurrency, formatDiscountType } from '@/lib/utils'
import { Plus, Filter, ArrowLeftRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { CardHeader, CardTitle } from '@/components/ui/card'

interface MovementsListClientProps {
  initialMovements: any[]
  products: any[]
  suppliers: any[]
}

export function MovementsListClient({ initialMovements, products, suppliers }: MovementsListClientProps) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Filtra produtos baseado no fornecedor selecionado
  const filteredProducts = useMemo(() => {
    if (selectedSupplier === 'all') {
      return products
    }
    // Filtra produtos que pertencem ao fornecedor selecionado
    return products.filter((product: any) => {
      const productSupplierId = product.supplierId?._id?.toString() || product.supplierId?.toString()
      return productSupplierId === selectedSupplier
    })
  }, [products, selectedSupplier])

  // Limpa a seleção de produto se ele não pertencer ao fornecedor selecionado
  useEffect(() => {
    if (selectedSupplier !== 'all' && selectedProduct !== 'all') {
      const productBelongsToSupplier = filteredProducts.some(
        (p: any) => p._id.toString() === selectedProduct
      )
      if (!productBelongsToSupplier) {
        setSelectedProduct('all')
      }
    }
  }, [selectedSupplier, filteredProducts, selectedProduct])

  // Filtra as movimentações
  const filteredMovements = useMemo(() => {
    return initialMovements.filter((movement: any) => {
      // Filtro de data
      if (startDate || endDate) {
        const movementDate = new Date(movement.createdAt)
        const start = startDate ? new Date(startDate + 'T00:00:00.000Z') : null
        const end = endDate ? new Date(endDate + 'T23:59:59.999Z') : null

        if (start && movementDate < start) return false
        if (end && movementDate > end) return false
      }

      // Filtro de fornecedor
      if (selectedSupplier !== 'all') {
        const supplierId = movement.supplierId?._id?.toString() || movement.supplierId?.toString()
        if (supplierId !== selectedSupplier) return false
      }

      // Filtro de produto
      if (selectedProduct !== 'all') {
        const productId = movement.productId?._id?.toString() || movement.productId?.toString()
        if (productId !== selectedProduct) return false
      }

      return true
    })
  }, [initialMovements, startDate, endDate, selectedSupplier, selectedProduct])

  // Calcula paginação
  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedMovements = filteredMovements.slice(startIndex, endIndex)

  // Reset para primeira página quando os filtros mudarem
  useEffect(() => {
    setCurrentPage(1)
  }, [startDate, endDate, selectedSupplier, selectedProduct])

  const handleResetFilters = () => {
    setStartDate('')
    setEndDate('')
    setSelectedSupplier('all')
    setSelectedProduct('all')
    setCurrentPage(1) // Reset para primeira página
  }

  if (initialMovements.length === 0) {
    return (
      <div className="py-12 text-center">
        <ArrowLeftRight className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Nenhuma movimentação</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Comece registrando uma entrada ou saída
        </p>
        <MovementForm>
          <Button className="mt-4" size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Nova Movimentação
          </Button>
        </MovementForm>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Filter className="h-4 w-4 md:h-5 md:w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">Fornecedor</Label>
              <Select 
                value={selectedSupplier} 
                onValueChange={(value) => {
                  setSelectedSupplier(value)
                  // Limpa a seleção de produto quando o fornecedor muda
                  if (value !== 'all') {
                    setSelectedProduct('all')
                  }
                }}
              >
                <SelectTrigger id="supplier">
                  <SelectValue
                    placeholder="Todos os fornecedores"
                    displayValue={
                      selectedSupplier === 'all'
                        ? 'Todos os fornecedores'
                        : suppliers.find((s: any) => s._id.toString() === selectedSupplier)?.name || ''
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os fornecedores</SelectItem>
                  {suppliers.map((supplier: any) => (
                    <SelectItem key={supplier._id.toString()} value={supplier._id.toString()}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product">Produto</Label>
                <Select
                  value={selectedProduct}
                  onValueChange={setSelectedProduct}
                >
                  <SelectTrigger id="product" disabled={selectedSupplier !== 'all' && filteredProducts.length === 0}>
                  <SelectValue
                    placeholder={
                      selectedSupplier !== 'all' && filteredProducts.length === 0
                        ? 'Nenhum produto para este fornecedor'
                        : 'Todos os produtos'
                    }
                    displayValue={
                      selectedProduct === 'all'
                        ? selectedSupplier !== 'all' && filteredProducts.length === 0
                          ? 'Nenhum produto para este fornecedor'
                          : selectedSupplier !== 'all'
                          ? 'Todos os produtos do fornecedor'
                          : 'Todos os produtos'
                        : filteredProducts.find((p: any) => p._id.toString() === selectedProduct)?.name || 
                          products.find((p: any) => p._id.toString() === selectedProduct)?.name || ''
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {selectedSupplier !== 'all' ? 'Todos os produtos do fornecedor' : 'Todos os produtos'}
                  </SelectItem>
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product: any) => (
                      <SelectItem key={product._id.toString()} value={product._id.toString()}>
                        {product.name}
                      </SelectItem>
                    ))
                  ) : selectedSupplier !== 'all' ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      Nenhum produto encontrado para este fornecedor
                    </div>
                  ) : null}
                </SelectContent>
              </Select>
              {selectedSupplier !== 'all' && (
                <p className="text-xs text-muted-foreground">
                  {filteredProducts.length} produto(s) encontrado(s) para este fornecedor
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Button variant="outline" onClick={handleResetFilters} className="w-full md:w-auto">
              Limpar Filtros
            </Button>
            <div className="text-sm text-muted-foreground text-center md:text-right">
              {filteredMovements.length} de {initialMovements.length} movimentações
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de movimentações */}
      {filteredMovements.length === 0 ? (
        <div className="py-12 text-center">
          <ArrowLeftRight className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Nenhuma movimentação encontrada</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Tente ajustar os filtros
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {paginatedMovements.map((movement: any) => (
            <Card key={movement._id.toString()}>
              <CardContent className="pt-4 md:pt-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-base md:text-lg">
                      {movement.productId?.name || 'Produto removido'}
                      {movement.productId?.size && (
                        <span className="text-sm text-muted-foreground ml-2">
                          (Tamanho: {movement.productId.size})
                        </span>
                      )}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground">
                      <span>
                        {movement.type === 'entrada' && '➕ Entrada'}
                        {movement.type === 'saida' && '➖ Saída'}
                        {movement.type === 'ajuste' && '🔧 Ajuste'}
                      </span>
                      <span>•</span>
                      <span>{movement.quantity} unidades</span>
                      <span>•</span>
                      <span>
                        {movement.previousQuantity} → {movement.newQuantity}
                      </span>
                      {movement.supplierId && (
                        <>
                          <span>•</span>
                          <span className="break-all">Fornecedor: {movement.supplierId?.name}</span>
                        </>
                      )}
                    </div>
                    {movement.notes && (
                      <p className="mt-1 text-xs md:text-sm text-muted-foreground break-words">
                        {movement.notes}
                      </p>
                    )}
                    {movement.type === 'saida' && movement.salePrice && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm">
                        <span className="text-muted-foreground">
                          Preço de venda: <span className="font-semibold text-green-600">{formatCurrency(movement.salePrice)}</span>
                        </span>
                        {movement.discountType && movement.discountValue !== undefined && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">
                              Desconto ({formatDiscountType(movement.discountType)}): <span className="font-semibold text-red-600">
                                {movement.discountType === 'percent' 
                                  ? `${movement.discountValue}%`
                                  : formatCurrency(movement.discountValue)
                                }
                              </span>
                            </span>
                          </>
                        )}
                        {movement.totalRevenue !== undefined && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">
                              Receita: <span className="font-semibold text-blue-600">{formatCurrency(movement.totalRevenue)}</span>
                            </span>
                          </>
                        )}
                      </div>
                    )}
                    {movement.type === 'entrada' && movement.totalPrice && (
                      <div className="mt-2 text-xs md:text-sm">
                        <span className="text-muted-foreground">
                          Total gasto: <span className="font-semibold text-red-600">{formatCurrency(movement.totalPrice)}</span>
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground shrink-0">
                    {formatDate(movement.createdAt)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between pt-4 border-t">
              <div className="text-xs md:text-sm text-muted-foreground text-center md:text-left">
                Mostrando {startIndex + 1} a {Math.min(endIndex, filteredMovements.length)} de {filteredMovements.length} movimentações
              </div>
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex-1 md:flex-initial"
                >
                  <ChevronLeft className="h-4 w-4 md:mr-1" />
                  <span className="hidden md:inline">Anterior</span>
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
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
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="flex-1 md:flex-initial"
                >
                  <span className="hidden md:inline">Próxima</span>
                  <ChevronRight className="h-4 w-4 md:ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}


'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { ProductForm } from './product-form'
import { ProductCard } from './product-card'
import { Filter, Grid3x3, List, ChevronLeft, ChevronRight, Package, Plus, Edit } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { DeleteProductButton } from '../[id]/delete-button'

interface ProductsListClientProps {
  initialProducts: any[]
  suppliers: any[]
}

export function ProductsListClient({ initialProducts, suppliers }: ProductsListClientProps) {
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = viewMode === 'cards' ? 12 : 20

  // Filtra produtos baseado no fornecedor selecionado
  const filteredProductsBySupplier = useMemo(() => {
    if (selectedSupplier === 'all') {
      return initialProducts
    }
    return initialProducts.filter((product: any) => {
      const productSupplierId = product.supplierId?._id?.toString() || product.supplierId?.toString()
      return productSupplierId === selectedSupplier
    })
  }, [initialProducts, selectedSupplier])

  // Filtra produtos que tiveram movimentações no período selecionado
  const filteredProducts = useMemo(() => {
    if (!startDate && !endDate) {
      return filteredProductsBySupplier
    }

    // Para filtrar por data, precisamos verificar se o produto teve movimentações no período
    // Como não temos acesso direto às movimentações aqui, vamos retornar todos os produtos filtrados por fornecedor
    // A filtragem por data seria mais complexa e requereria buscar movimentações no servidor
    return filteredProductsBySupplier
  }, [filteredProductsBySupplier, startDate, endDate])

  // Calcula paginação
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

  // Reset para primeira página quando os filtros mudarem
  useEffect(() => {
    setCurrentPage(1)
  }, [startDate, endDate, selectedSupplier, viewMode])

  const handleResetFilters = () => {
    setStartDate('')
    setEndDate('')
    setSelectedSupplier('all')
    setCurrentPage(1)
  }

  // Limpa a seleção de fornecedor quando muda
  useEffect(() => {
    if (selectedSupplier !== 'all') {
      // Não precisa fazer nada, apenas manter o filtro
    }
  }, [selectedSupplier])

  if (initialProducts.length === 0) {
    return (
      <div className="py-12 text-center">
        <Package className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Nenhum produto cadastrado</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Comece adicionando seu primeiro produto
        </p>
        <ProductForm>
          <Button className="mt-4" size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Produto
          </Button>
        </ProductForm>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filtros e Visualização */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros e Visualização
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cards')}
              >
                <Grid3x3 className="h-4 w-4 mr-2" />
                Cards
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4 mr-2" />
                Lista
              </Button>
            </div>
          </div>
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
                onValueChange={setSelectedSupplier}
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
          </div>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={handleResetFilters}>
              Limpar Filtros
            </Button>
            <div className="text-sm text-muted-foreground flex items-center">
              {filteredProducts.length} de {initialProducts.length} produtos
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de produtos */}
      {filteredProducts.length === 0 ? (
        <div className="py-12 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Nenhum produto encontrado</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Tente ajustar os filtros
          </p>
        </div>
      ) : (
        <>
          {viewMode === 'cards' ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paginatedProducts.map((product: any) => (
                <ProductCard key={product._id.toString()} product={product} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {paginatedProducts.map((product: any) => (
                <Card key={product._id.toString()} className="group hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-lg">{product.name}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          {product.sku && (
                            <>
                              <span>SKU: {product.sku}</span>
                              <span>•</span>
                            </>
                          )}
                          {product.category && (
                            <>
                              <span>{product.category}</span>
                              <span>•</span>
                            </>
                          )}
                          <span className={product.quantity < product.minQuantity ? 'text-destructive font-semibold' : ''}>
                            Estoque: {product.quantity}
                          </span>
                          <span>•</span>
                          <span>Mínimo: {product.minQuantity}</span>
                          {product.supplierId && (
                            <>
                              <span>•</span>
                              <span>Fornecedor: {product.supplierId.name}</span>
                            </>
                          )}
                        </div>
                        {(product.purchasePrice || product.salePrice) && (
                          <div className="mt-2 flex items-center gap-4 text-sm">
                            {product.purchasePrice && (
                              <span className="text-muted-foreground">
                                Compra: <span className="font-semibold text-green-600">{formatCurrency(product.purchasePrice)}</span>
                              </span>
                            )}
                            {product.salePrice && (
                              <span className="text-muted-foreground">
                                Venda: <span className="font-semibold text-blue-600">{formatCurrency(product.salePrice)}</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <ProductForm 
                          product={{
                            _id: product._id.toString(),
                            name: product.name,
                            sku: product.sku,
                            category: product.category,
                            supplierId: product.supplierId?._id?.toString() || product.supplierId?.toString(),
                            quantity: product.quantity,
                            minQuantity: product.minQuantity,
                            purchasePrice: product.purchasePrice,
                            salePrice: product.salePrice,
                            size: product.size,
                            color: product.color,
                            brand: product.brand,
                            material: product.material,
                          }}
                        >
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                        </ProductForm>
                        <DeleteProductButton productId={product._id.toString()} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1} a {Math.min(endIndex, filteredProducts.length)} de {filteredProducts.length} produtos
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
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
                        className="min-w-[40px]"
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
  )
}


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
import Image from 'next/image'
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
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedGenero, setSelectedGenero] = useState<string>('')
  const [preVendaFilter, setPreVendaFilter] = useState<string>('all') // 'all', 'yes', 'no'
  const [estoqueFilter, setEstoqueFilter] = useState<string>('all') // 'all', 'com_estoque', 'sem_estoque', 'estoque_baixo'
  const [imagemFilter, setImagemFilter] = useState<string>('all') // 'all', 'com_imagem', 'sem_imagem'
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  // Extrai tamanhos únicos dos produtos
  const availableSizes = useMemo(() => {
    const sizes = new Set<string>()
    initialProducts.forEach((product: any) => {
      if (product.size) {
        sizes.add(product.size)
      }
    })
    return Array.from(sizes).sort()
  }, [initialProducts])

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
  const filteredProductsByDate = useMemo(() => {
    if (!startDate && !endDate) {
      return filteredProductsBySupplier
    }

    // Para filtrar por data, precisamos verificar se o produto teve movimentações no período
    // Como não temos acesso direto às movimentações aqui, vamos retornar todos os produtos filtrados por fornecedor
    // A filtragem por data seria mais complexa e requereria buscar movimentações no servidor
    return filteredProductsBySupplier
  }, [filteredProductsBySupplier, startDate, endDate])

  // Aplica todos os filtros
  const filteredProducts = useMemo(() => {
    let filtered = filteredProductsByDate

    // Filtro de tamanho
    if (selectedSize) {
      filtered = filtered.filter((product: any) => product.size === selectedSize)
    }

    // Filtro de gênero
    if (selectedGenero) {
      filtered = filtered.filter((product: any) => product.genero === selectedGenero)
    }

    // Filtro de pré-venda
    if (preVendaFilter === 'yes') {
      filtered = filtered.filter((product: any) => product.pre_venda === true)
    } else if (preVendaFilter === 'no') {
      filtered = filtered.filter((product: any) => !product.pre_venda || product.pre_venda === false)
    }

    // Filtro de estoque
    if (estoqueFilter === 'com_estoque') {
      filtered = filtered.filter((product: any) => product.quantity > 0)
    } else if (estoqueFilter === 'sem_estoque') {
      filtered = filtered.filter((product: any) => product.quantity === 0)
    } else if (estoqueFilter === 'estoque_baixo') {
      filtered = filtered.filter((product: any) => product.quantity < product.minQuantity && product.quantity > 0)
    }

    // Filtro de imagem
    if (imagemFilter === 'com_imagem') {
      filtered = filtered.filter((product: any) => product.imageUrl && product.imageUrl.trim() !== '')
    } else if (imagemFilter === 'sem_imagem') {
      filtered = filtered.filter((product: any) => !product.imageUrl || product.imageUrl.trim() === '')
    }

    return filtered
  }, [filteredProductsByDate, selectedSize, selectedGenero, preVendaFilter, estoqueFilter, imagemFilter])

  // Calcula paginação
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

  // Reset para primeira página quando os filtros mudarem
  useEffect(() => {
    setCurrentPage(1)
  }, [startDate, endDate, selectedSupplier, selectedSize, selectedGenero, preVendaFilter, estoqueFilter, imagemFilter, viewMode])

  const handleResetFilters = () => {
    setStartDate('')
    setEndDate('')
    setSelectedSupplier('all')
    setSelectedSize('')
    setSelectedGenero('')
    setPreVendaFilter('all')
    setEstoqueFilter('all')
    setImagemFilter('all')
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
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Filter className="h-4 w-4 md:h-5 md:w-5" />
              Filtros e Visualização
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="flex-1 md:flex-initial"
              >
                <Grid3x3 className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Cards</span>
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="flex-1 md:flex-initial"
              >
                <List className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Lista</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 relative z-50">
          {/* Filtros de Data */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-muted-foreground">Período</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-xs font-medium">
                  Data Inicial
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-xs font-medium">
                  Data Final
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>
          </div>

          {/* Separador */}
          <div className="border-t border-border"></div>

          {/* Filtros de Produto */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-muted-foreground">Produto</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative">
              <div className="space-y-2">
                <Label htmlFor="supplier" className="text-xs font-medium">
                  Fornecedor
                </Label>
                <Select 
                  value={selectedSupplier} 
                  onValueChange={setSelectedSupplier}
                >
                  <SelectTrigger id="supplier" className="h-10">
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
                <Label htmlFor="size-filter" className="text-xs font-medium">
                  Tamanho
                </Label>
                <Select value={selectedSize} onValueChange={setSelectedSize}>
                  <SelectTrigger id="size-filter" className="h-10">
                    <SelectValue placeholder="Todos os tamanhos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os tamanhos</SelectItem>
                    {availableSizes.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="genero-filter" className="text-xs font-medium">
                  Gênero
                </Label>
                <Select value={selectedGenero} onValueChange={setSelectedGenero}>
                  <SelectTrigger id="genero-filter" className="h-10">
                    <SelectValue placeholder="Todos os gêneros" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os gêneros</SelectItem>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="unissex">Unissex</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pre-venda-filter" className="text-xs font-medium">
                  Pré-venda
                </Label>
                <Select value={preVendaFilter} onValueChange={setPreVendaFilter}>
                  <SelectTrigger id="pre-venda-filter" className="h-10">
                    <SelectValue 
                      placeholder="Todos"
                      displayValue={
                        preVendaFilter === 'all' 
                          ? 'Todos' 
                          : preVendaFilter === 'yes' 
                          ? 'Sim (Pré-venda)' 
                          : 'Não (Pronta entrega)'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="yes">Sim (Pré-venda)</SelectItem>
                    <SelectItem value="no">Não (Pronta entrega)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estoque-filter" className="text-xs font-medium">
                  Estoque
                </Label>
                <Select value={estoqueFilter} onValueChange={setEstoqueFilter}>
                  <SelectTrigger id="estoque-filter" className="h-10">
                    <SelectValue 
                      placeholder="Todos"
                      displayValue={
                        estoqueFilter === 'all' 
                          ? 'Todos' 
                          : estoqueFilter === 'com_estoque' 
                          ? 'Com estoque' 
                          : estoqueFilter === 'sem_estoque'
                          ? 'Sem estoque'
                          : 'Estoque baixo'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="com_estoque">Com estoque</SelectItem>
                    <SelectItem value="sem_estoque">Sem estoque</SelectItem>
                    <SelectItem value="estoque_baixo">Estoque baixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imagem-filter" className="text-xs font-medium">
                  Imagem
                </Label>
                <Select value={imagemFilter} onValueChange={setImagemFilter}>
                  <SelectTrigger id="imagem-filter" className="h-10">
                    <SelectValue 
                      placeholder="Todos"
                      displayValue={
                        imagemFilter === 'all' 
                          ? 'Todos' 
                          : imagemFilter === 'com_imagem' 
                          ? 'Com imagem' 
                          : 'Sem imagem'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="com_imagem">Com imagem</SelectItem>
                    <SelectItem value="sem_imagem">Sem imagem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Separador */}
          <div className="border-t border-border"></div>

          {/* Ações e Contador */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between pt-2">
            <Button 
              variant="outline" 
              onClick={handleResetFilters} 
              className="w-full md:w-auto h-10"
            >
              Limpar Filtros
            </Button>
            <div className="text-sm font-medium text-muted-foreground text-center md:text-right">
              Mostrando <span className="text-foreground font-semibold">{filteredProducts.length}</span> de{' '}
              <span className="text-foreground font-semibold">{initialProducts.length}</span> produtos
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
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {paginatedProducts.map((product: any) => (
                <ProductCard key={product._id.toString()} product={product} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
            <div className="space-y-2">
              {paginatedProducts.map((product: any) => (
                <Card key={product._id.toString()} className="group hover:shadow-md transition-shadow">
                  <CardContent className="pt-4 md:pt-6">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3">
                            {product.imageUrl && (
                              <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border bg-muted shrink-0">
                                <Image
                                  src={product.imageUrl}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              {product.nome_vitrine ? (
                                <div className="space-y-1">
                                  <p className="font-medium text-base md:text-lg">{product.nome_vitrine}</p>
                                  <p className="text-sm text-muted-foreground">{product.name}</p>
                                </div>
                              ) : (
                        <p className="font-medium text-base md:text-lg">{product.name}</p>
                              )}
                            </div>
                          </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground">
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
                            {product.brand && (
                              <>
                                <span>Marca: {product.brand}</span>
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
                              <span className="break-all">Fornecedor: {product.supplierId.name}</span>
                            </>
                          )}
                        </div>
                        {(product.purchasePrice || product.salePrice) && (
                          <div className="mt-2 flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm">
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
                      <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0">
                        <ProductForm 
                          product={{
                            _id: product._id.toString(),
                            name: product.name,
                              nome_vitrine: product.nome_vitrine,
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
                              imageUrl: product.imageUrl,
                              pre_venda: product.pre_venda,
                              genero: product.genero,
                          }}
                        >
                          <Button variant="outline" size="sm" className="flex-1 md:flex-initial">
                            <Edit className="h-4 w-4 md:mr-2" />
                            <span className="hidden md:inline">Editar</span>
                          </Button>
                        </ProductForm>
                        <DeleteProductButton productId={product._id.toString()} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
              
              {viewMode === 'list' && totalPages > 1 && (
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between pt-4 border-t">
                  <div className="text-xs md:text-sm text-muted-foreground text-center md:text-left">
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
                      className="flex-1 md:flex-initial"
                    >
                      <span className="hidden md:inline">Próxima</span>
                      <ChevronRight className="h-4 w-4 md:ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Paginação para cards */}
          {viewMode === 'cards' && totalPages > 1 && (
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between pt-4 border-t">
              <div className="text-xs md:text-sm text-muted-foreground text-center md:text-left">
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


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
import { Filter, ShoppingCart, Package, Users, Sparkles, Phone, Baby, ChevronLeft, ChevronRight, MapPin, Instagram } from 'lucide-react'
import { formatCurrency, formatPhone } from '@/lib/utils'
import { SaleModal } from './sale-modal'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface VitrineClientProps {
  initialProducts: any[]
  initialCustomers: any[]
}

export function VitrineClient({ initialProducts, initialCustomers }: VitrineClientProps) {
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [saleModalOpen, setSaleModalOpen] = useState(false)
  const [recommendedCustomersOpen, setRecommendedCustomersOpen] = useState(false)
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState<any>(null)
  const [customerDetailModalOpen, setCustomerDetailModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all')
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'out_of_stock'>('all')
  const [sizeFilter, setSizeFilter] = useState<string>('all')
  const [genderFilter, setGenderFilter] = useState<'all' | 'masculino' | 'feminino' | 'unissex'>('all')
  const [preVendaFilter, setPreVendaFilter] = useState<'all' | 'pre_venda' | 'pronta_entrega'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  // Cliente selecionado
  const customer = useMemo(() => {
    return initialCustomers.find((c: any) => c._id === selectedCustomer)
  }, [initialCustomers, selectedCustomer])

  // Extrai tamanhos únicos dos produtos e das crianças do cliente
  const availableSizes = useMemo(() => {
    const sizes = new Set<string>()
    
    // Tamanhos dos produtos
    initialProducts.forEach((product: any) => {
      if (product.size && product.size.trim() !== '') {
        sizes.add(product.size)
      }
    })
    
    // Tamanhos das crianças do cliente selecionado
    if (customer && customer.children) {
      customer.children.forEach((child: any) => {
        if (child.size && child.size.trim() !== '') {
          sizes.add(child.size)
        }
      })
    }
    
    return Array.from(sizes).sort()
  }, [initialProducts, customer])

  // Filtra produtos baseado em cliente e filtros
  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product: any) => {
      // Filtro de disponibilidade
      if (availabilityFilter === 'available' && product.quantity <= 0) return false
      if (availabilityFilter === 'out_of_stock' && product.quantity > 0) return false

      // Filtro de tamanho
      if (sizeFilter !== 'all' && product.size !== sizeFilter) return false

      // Filtro de gênero
      if (genderFilter !== 'all') {
        if (product.genero !== genderFilter && product.genero !== 'unissex') return false
      }

      // Filtro de pré-venda
      if (preVendaFilter === 'pre_venda' && !product.pre_venda) return false
      if (preVendaFilter === 'pronta_entrega' && product.pre_venda) return false

      // Filtro de busca
      const displayName = product.nome_vitrine || product.name
      if (searchTerm && !displayName.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }

      // Filtros inteligentes baseados no cliente selecionado
      if (customer && customer.children && customer.children.length > 0) {
        // Verifica se o produto corresponde a alguma criança
        const matchesChild = customer.children.some((child: any) => {
          // Verifica tamanho
          if (child.size && product.size && child.size !== product.size) return false
          
          // Verifica gênero
          if (child.gender && product.genero) {
            if (product.genero !== 'unissex' && product.genero !== child.gender) return false
          }
          
          return true
        })
        
        // Por enquanto, mostra todos os produtos mesmo que não correspondam
        // Pode ser ajustado para filtrar apenas produtos que correspondem
      }

      return true
    })
  }, [initialProducts, availabilityFilter, sizeFilter, genderFilter, preVendaFilter, searchTerm, customer])

  // Calcula paginação
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

  // Reset para primeira página quando os filtros mudarem
  useEffect(() => {
    setCurrentPage(1)
  }, [availabilityFilter, sizeFilter, genderFilter, preVendaFilter, searchTerm, selectedCustomer])

  const handleSaleClick = (product: any) => {
    setSelectedProduct(product)
    setSaleModalOpen(true)
  }

  // Função para formatar o texto do SelectValue
  const getFilterDisplayText = (value: string, type: 'availability' | 'size' | 'gender' | 'type') => {
    if (value === 'all') return 'Tudo'
    
    if (type === 'availability') {
      if (value === 'available') return 'Disponível'
      if (value === 'out_of_stock') return 'Sem Estoque'
    }
    
    if (type === 'gender') {
      if (value === 'masculino') return 'Masculino'
      if (value === 'feminino') return 'Feminino'
      if (value === 'unissex') return 'Unissex'
    }
    
    if (type === 'type') {
      if (value === 'pre_venda') return 'Pré-venda'
      if (value === 'pronta_entrega') return 'Pronta Entrega'
    }
    
    return value
  }

  // Calcula clientes recomendados baseado nos filtros
  const recommendedCustomers = useMemo(() => {
    if (availabilityFilter === 'all' && sizeFilter === 'all' && genderFilter === 'all' && preVendaFilter === 'all' && !searchTerm) {
      return []
    }

    return initialCustomers.filter((customer: any) => {
      if (!customer.children || customer.children.length === 0) return false

      // Verifica se alguma criança do cliente corresponde aos filtros
      return customer.children.some((child: any) => {
        // Verifica tamanho
        if (sizeFilter !== 'all' && child.size !== sizeFilter) return false

        // Verifica gênero
        if (genderFilter !== 'all') {
          // Se o filtro é unissex, aceita qualquer gênero
          if (genderFilter === 'unissex') return true
          // Caso contrário, precisa corresponder
          if (child.gender !== genderFilter) return false
        }

        return true
      })
    })
  }, [initialCustomers, availabilityFilter, sizeFilter, genderFilter, preVendaFilter, searchTerm])

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Seleção de Cliente */}
            <div className="space-y-2">
              <Label>Cliente (para recomendações personalizadas)</Label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger>
                  <SelectValue 
                    placeholder="Selecione um cliente"
                    displayValue={selectedCustomer === 'all' ? 'Todos os Clientes' : initialCustomers.find((c: any) => c._id === selectedCustomer)?.name}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Clientes</SelectItem>
                  {initialCustomers.map((customer: any) => (
                    <SelectItem key={customer._id} value={customer._id}>
                      {customer.name}
                      {customer.children && customer.children.length > 0 && (
                        <span className="text-muted-foreground ml-2">
                          ({customer.children.length} criança{customer.children.length !== 1 ? 's' : ''})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {customer && customer.children && customer.children.length > 0 && (
                <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
                  <strong>Recomendações baseadas em:</strong>
                  <ul className="mt-1 space-y-1">
                    {customer.children.map((child: any, idx: number) => (
                      <li key={idx}>
                        {child.name}
                        {child.age && ` (${child.age} anos)`}
                        {child.size && ` - Tamanho: ${child.size}`}
                        {child.gender && ` - ${child.gender === 'masculino' ? 'Masculino' : 'Feminino'}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Busca */}
            <div className="space-y-2">
              <Label>Buscar Produto</Label>
              <Input
                placeholder="Digite o nome do produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Disponibilidade</Label>
                <Select value={availabilityFilter} onValueChange={(value: any) => setAvailabilityFilter(value)}>
                  <SelectTrigger>
                    <SelectValue 
                      placeholder="Selecione um filtro"
                      displayValue={getFilterDisplayText(availabilityFilter, 'availability')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tudo</SelectItem>
                    <SelectItem value="available">Disponível</SelectItem>
                    <SelectItem value="out_of_stock">Sem Estoque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tamanho</Label>
                <Select value={sizeFilter} onValueChange={setSizeFilter}>
                  <SelectTrigger>
                    <SelectValue 
                      placeholder="Selecione um filtro"
                      displayValue={sizeFilter === 'all' ? 'Tudo' : sizeFilter}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tudo</SelectItem>
                    {availableSizes.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Gênero</Label>
                <Select value={genderFilter} onValueChange={(value: any) => setGenderFilter(value)}>
                  <SelectTrigger>
                    <SelectValue 
                      placeholder="Selecione um filtro"
                      displayValue={getFilterDisplayText(genderFilter, 'gender')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tudo</SelectItem>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="unissex">Unissex</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={preVendaFilter} onValueChange={(value: any) => setPreVendaFilter(value)}>
                  <SelectTrigger>
                    <SelectValue 
                      placeholder="Selecione um filtro"
                      displayValue={getFilterDisplayText(preVendaFilter, 'type')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tudo</SelectItem>
                    <SelectItem value="pre_venda">Pré-venda</SelectItem>
                    <SelectItem value="pronta_entrega">Pronta Entrega</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {filteredProducts.length} produto(s) encontrado(s)
              </div>
              {recommendedCustomers.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRecommendedCustomersOpen(true)}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Ver Clientes Recomendados ({recommendedCustomers.length})
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Produtos */}
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedProducts.map((product: any) => (
            <Card key={product._id} className="overflow-hidden shadow-2xl h-full flex flex-col">
              <CardContent className="p-0 flex flex-col h-full">
                {/* Imagem */}
                <div className="relative w-full h-48 bg-muted flex-shrink-0">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.nome_vitrine || product.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Package className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  {/* Badges */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1 z-20 pointer-events-none">
                    {product.pre_venda && (
                      <Badge variant="secondary" className="bg-blue-500 text-white pointer-events-auto">
                        Pré-venda
                      </Badge>
                    )}
                    {product.quantity <= 0 && (
                      <Badge variant="destructive" className="pointer-events-auto">Sem Estoque</Badge>
                    )}
                  </div>
                </div>

                {/* Informações */}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="space-y-2 flex-shrink-0">
                    <h3 className="font-semibold text-lg line-clamp-2">{product.nome_vitrine || product.name}</h3>
                    
                    {product.brand && (
                      <p className="text-sm text-muted-foreground">Marca: {product.brand}</p>
                    )}
                    
                    {product.size && (
                      <p className="text-sm text-muted-foreground">Tamanho: {product.size}</p>
                    )}
                  </div>

                  <div className="mt-auto pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      {product.salePrice ? (
                        <span className="text-xl font-bold text-primary">
                          {formatCurrency(product.salePrice)}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Sem preço</span>
                      )}
                      <span className="text-sm text-muted-foreground">
                        Estoque: {product.quantity}
                      </span>
                    </div>

                    <Button
                      className="w-full"
                      onClick={() => handleSaleClick(product)}
                      disabled={product.quantity <= 0}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Registrar Venda
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex flex-col items-center gap-4 pt-6 border-t">
              <div className="text-sm text-muted-foreground">
                {endIndex > filteredProducts.length 
                  ? `${filteredProducts.length} de ${filteredProducts.length} produtos`
                  : `${endIndex} de ${filteredProducts.length} produtos`}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="gap-1 md:gap-2"
                >
                  <ChevronLeft className="h-4 w-4 md:mr-1" />
                  <span className="hidden md:inline">Anterior</span>
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                    // Mostra sempre a primeira e última página
                    if (pageNum === 1 || pageNum === totalPages) {
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
                    }
                    // Mostra páginas próximas à atual
                    if (
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1) ||
                      (pageNum === currentPage - 2 && currentPage > 3) ||
                      (pageNum === currentPage + 2 && currentPage < totalPages - 2)
                    ) {
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
                    }
                    // Mostra "..." quando há lacunas
                    if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                      return (
                        <span key={pageNum} className="px-2 text-muted-foreground">
                          ...
                        </span>
                      )
                    }
                    return null
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="gap-1 md:gap-2"
                >
                  <span className="hidden md:inline">Próxima</span>
                  <ChevronRight className="h-4 w-4 md:ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <SaleModal
        open={saleModalOpen}
        onOpenChange={setSaleModalOpen}
        product={selectedProduct}
      />

      {/* Modal de Clientes Recomendados */}
      <Dialog open={recommendedCustomersOpen} onOpenChange={setRecommendedCustomersOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Clientes Recomendados
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Clientes com crianças que correspondem aos filtros selecionados:
            </p>

            {recommendedCustomers.length === 0 ? (
              <div className="py-8 text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">
                  Nenhum cliente encontrado com base nos filtros selecionados.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recommendedCustomers.map((customer: any) => (
                  <Card key={customer._id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold text-lg">
                              {customer.name}
                            </span>
                          </div>
                          
                          {customer.phone && (
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              {formatPhone(customer.phone)}
                            </p>
                          )}

                          {customer.children && customer.children.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                <Baby className="h-3 w-3" />
                                Crianças correspondentes:
                              </p>
                              <div className="space-y-1">
                                {customer.children
                                  .filter((child: any) => {
                                    // Filtra apenas crianças que correspondem aos filtros
                                    if (sizeFilter !== 'all' && child.size !== sizeFilter) return false
                                    if (genderFilter !== 'all' && genderFilter !== 'unissex' && child.gender !== genderFilter) return false
                                    return true
                                  })
                                  .map((child: any, idx: number) => (
                                    <div key={idx} className="text-xs bg-blue-50 p-2 rounded">
                                      <div className="font-medium">{child.name}</div>
                                      <div className="flex gap-2 mt-1">
                                        {child.age && <span>Idade: {child.age} anos</span>}
                                        {child.size && <span>Tamanho: {child.size}</span>}
                                        {child.gender && (
                                          <Badge variant="secondary" className="text-xs">
                                            {child.gender === 'masculino' ? 'M' : 'F'}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedCustomerDetail(customer)
                            setCustomerDetailModalOpen(true)
                          }}
                        >
                          Ver Detalhes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes do Cliente */}
      <Dialog open={customerDetailModalOpen} onOpenChange={setCustomerDetailModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              {selectedCustomerDetail?.name || 'Detalhes do Cliente'}
            </DialogTitle>
          </DialogHeader>

          {selectedCustomerDetail && (
            <div className="space-y-6">
              {/* Informações de Contato */}
              <Card>
                <CardHeader>
                  <CardTitle>Informações de Contato</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedCustomerDetail.phone && (
                    <div className="flex items-center gap-2 text-sm md:text-base">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{formatPhone(selectedCustomerDetail.phone)}</span>
                    </div>
                  )}

                  {selectedCustomerDetail.instagram && (
                    <div className="flex items-center gap-2 text-sm md:text-base">
                      <Instagram className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{selectedCustomerDetail.instagram}</span>
                    </div>
                  )}

                  {selectedCustomerDetail.address && (
                    <div className="flex items-start gap-2 text-sm md:text-base">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                      <span className="break-words">{selectedCustomerDetail.address}</span>
                    </div>
                  )}

                  {!selectedCustomerDetail.phone && !selectedCustomerDetail.instagram && !selectedCustomerDetail.address && (
                    <p className="text-sm text-muted-foreground">Nenhuma informação de contato cadastrada</p>
                  )}
                </CardContent>
              </Card>

              {/* Crianças */}
              {selectedCustomerDetail.children && selectedCustomerDetail.children.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Baby className="h-5 w-5" />
                      Crianças ({selectedCustomerDetail.children.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedCustomerDetail.children.map((child: any, index: number) => (
                      <div key={index} className="p-3 bg-muted rounded-lg space-y-2">
                        <div className="font-medium">{child.name}</div>
                        <div className="flex flex-wrap gap-2 text-sm">
                          {child.age && <span>Idade: {child.age} anos</span>}
                          {child.size && <span>Tamanho: {child.size}</span>}
                          {child.gender && (
                            <Badge variant="secondary">
                              {child.gender === 'masculino' ? 'Masculino' : 'Feminino'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {(!selectedCustomerDetail.children || selectedCustomerDetail.children.length === 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Baby className="h-5 w-5" />
                      Crianças
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Nenhuma criança cadastrada</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}


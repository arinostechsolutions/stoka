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
import { SupplierForm } from './supplier-form'
import { SupplierCard } from './supplier-card'
import { Filter, Grid3x3, List, ChevronLeft, ChevronRight, Building2, Plus, Edit } from 'lucide-react'
import { formatDate, formatPhone, formatCNPJ } from '@/lib/utils'
import { DeleteSupplierButton } from '../[id]/delete-button'

interface SuppliersListClientProps {
  initialSuppliers: any[]
}

export function SuppliersListClient({ initialSuppliers }: SuppliersListClientProps) {
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Filtra fornecedores baseado na categoria selecionada
  const filteredSuppliersByCategory = useMemo(() => {
    if (selectedCategory === 'all') {
      return initialSuppliers
    }
    return initialSuppliers.filter((supplier: any) => {
      return supplier.category === selectedCategory
    })
  }, [initialSuppliers, selectedCategory])

  // Filtra fornecedores (por enquanto apenas por categoria, data pode ser adicionada depois)
  const filteredSuppliers = useMemo(() => {
    return filteredSuppliersByCategory
  }, [filteredSuppliersByCategory])

  // Calcula paginação
  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedSuppliers = filteredSuppliers.slice(startIndex, endIndex)

  // Reset para primeira página quando os filtros mudarem
  useEffect(() => {
    setCurrentPage(1)
  }, [startDate, endDate, selectedCategory, viewMode])

  const handleResetFilters = () => {
    setStartDate('')
    setEndDate('')
    setSelectedCategory('all')
    setCurrentPage(1)
  }

  if (initialSuppliers.length === 0) {
    return (
      <div className="py-12 text-center">
        <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Nenhum fornecedor cadastrado</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Comece adicionando seu primeiro fornecedor
        </p>
        <SupplierForm>
          <Button className="mt-4" size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Fornecedor
          </Button>
        </SupplierForm>
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
              <Label htmlFor="category">Categoria</Label>
              <Select 
                value={selectedCategory} 
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger id="category">
                  <SelectValue
                    placeholder="Todas as categorias"
                    displayValue={
                      selectedCategory === 'all'
                        ? 'Todas as categorias'
                        : selectedCategory === 'vestuario'
                        ? 'Vestuário'
                        : selectedCategory === 'geral'
                        ? 'Geral'
                        : ''
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  <SelectItem value="geral">Geral</SelectItem>
                  <SelectItem value="vestuario">Vestuário</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={handleResetFilters}>
              Limpar Filtros
            </Button>
            <div className="text-sm text-muted-foreground flex items-center">
              {filteredSuppliers.length} de {initialSuppliers.length} fornecedores
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de fornecedores */}
      {filteredSuppliers.length === 0 ? (
        <div className="py-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Nenhum fornecedor encontrado</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Tente ajustar os filtros
          </p>
        </div>
      ) : (
        <>
          {viewMode === 'cards' ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paginatedSuppliers.map((supplier: any) => (
                <SupplierCard key={supplier._id.toString()} supplier={supplier} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {paginatedSuppliers.map((supplier: any) => (
                <Card key={supplier._id.toString()} className="group hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-lg">{supplier.name}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          {supplier.category && (
                            <>
                              <span className="capitalize">
                                {supplier.category === 'vestuario' ? 'Vestuário' : 'Geral'}
                              </span>
                              <span>•</span>
                            </>
                          )}
                          {supplier.cnpj && (
                            <>
                              <span>CNPJ: {formatCNPJ(supplier.cnpj)}</span>
                              <span>•</span>
                            </>
                          )}
                          {supplier.email && (
                            <>
                              <span>Email: {supplier.email}</span>
                              <span>•</span>
                            </>
                          )}
                          {supplier.phone && (
                            <>
                              <span>Telefone: {formatPhone(supplier.phone)}</span>
                            </>
                          )}
                        </div>
                        {supplier.address && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            <span>Endereço: {supplier.address}</span>
                          </div>
                        )}
                        {supplier.notes && (
                          <div className="mt-2 text-sm text-muted-foreground line-clamp-2">
                            <span>Observações: {supplier.notes}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <SupplierForm 
                          supplier={{
                            _id: supplier._id.toString(),
                            name: supplier.name,
                            category: supplier.category || 'geral',
                            cnpj: supplier.cnpj,
                            email: supplier.email,
                            phone: supplier.phone,
                            address: supplier.address,
                            notes: supplier.notes,
                          }}
                        >
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                        </SupplierForm>
                        <DeleteSupplierButton supplierId={supplier._id.toString()} />
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
                Mostrando {startIndex + 1} a {Math.min(endIndex, filteredSuppliers.length)} de {filteredSuppliers.length} fornecedores
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


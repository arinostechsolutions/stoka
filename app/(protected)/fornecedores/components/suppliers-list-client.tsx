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
    <div className="space-y-4 w-full">
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
                        : selectedCategory === 'joia'
                        ? 'Jóia'
                        : selectedCategory === 'sapato'
                        ? 'Sapato'
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
                  <SelectItem value="joia">Jóia</SelectItem>
                  <SelectItem value="sapato">Sapato</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Button variant="outline" onClick={handleResetFilters} className="w-full md:w-auto">
              Limpar Filtros
            </Button>
            <div className="text-sm text-muted-foreground text-center md:text-right">
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
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full">
              {paginatedSuppliers.map((supplier: any) => (
                <SupplierCard key={supplier._id.toString()} supplier={supplier} />
              ))}
            </div>
          ) : (
            <div className="space-y-2 w-full">
              {paginatedSuppliers.map((supplier: any) => (
                <Card key={supplier._id.toString()} className="group hover:shadow-md transition-shadow">
                  <CardContent className="pt-4 md:pt-6">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-base md:text-lg">{supplier.name}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground">
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
                              <span className="break-all">CNPJ: {formatCNPJ(supplier.cnpj)}</span>
                              <span>•</span>
                            </>
                          )}
                          {supplier.email && (
                            <>
                              <span className="break-all">Email: {supplier.email}</span>
                              <span>•</span>
                            </>
                          )}
                          {supplier.phone && (
                            <>
                              <span>Tel: {formatPhone(supplier.phone)}</span>
                            </>
                          )}
                        </div>
                        {supplier.address && (
                          <div className="mt-2 text-xs md:text-sm text-muted-foreground">
                            <span>Endereço: {supplier.address}</span>
                          </div>
                        )}
                        {supplier.notes && (
                          <div className="mt-2 text-xs md:text-sm text-muted-foreground line-clamp-2">
                            <span>Observações: {supplier.notes}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0">
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
                          <Button variant="outline" size="sm" className="flex-1 md:flex-initial">
                            <Edit className="h-4 w-4 md:mr-2" />
                            <span className="hidden md:inline">Editar</span>
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
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between pt-4 border-t">
              <div className="text-xs md:text-sm text-muted-foreground text-center md:text-left">
                Mostrando {startIndex + 1} a {Math.min(endIndex, filteredSuppliers.length)} de {filteredSuppliers.length} fornecedores
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


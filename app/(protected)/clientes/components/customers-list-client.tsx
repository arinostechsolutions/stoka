'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import { CustomerForm } from './customer-form'
import { Users, Phone, MapPin, Instagram, Baby, Edit, Trash2, Search, MessageCircle, ShoppingBag, ChevronLeft, ChevronRight, LayoutGrid, List, Eye } from 'lucide-react'
import { DeleteCustomerButton } from '../[id]/delete-button'
import { formatPhone, getInstagramUrl, getWhatsAppUrl } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PurchaseHistoryCompact } from '../[id]/components/purchase-history-compact'
import { PendingPayments } from './pending-payments'

interface CustomersListClientProps {
  initialCustomers: any[]
  movementsByCustomer: Record<string, any[]>
}

export function CustomersListClient({ initialCustomers, movementsByCustomer }: CustomersListClientProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [onlyWithPurchases, setOnlyWithPurchases] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(8)
  const [overdueCustomers, setOverdueCustomers] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

  // Cria um Set com IDs de clientes que têm compras
  const customersWithPurchases = useMemo(() => {
    return new Set(Object.keys(movementsByCustomer))
  }, [movementsByCustomer])

  const filteredCustomers = useMemo(() => {
    let filtered = initialCustomers

    // Filtra por busca de texto
    if (searchTerm) {
      filtered = filtered.filter((customer: any) =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.instagram?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtra apenas clientes com compras
    if (onlyWithPurchases) {
      filtered = filtered.filter((customer: any) => 
        customersWithPurchases.has(customer._id)
      )
    }

    return filtered
  }, [initialCustomers, searchTerm, onlyWithPurchases, customersWithPurchases])

  // Calcula paginação
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex)

  // Reset para primeira página quando os filtros mudarem
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, onlyWithPurchases, itemsPerPage])

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Buscar Cliente</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Digite o nome, telefone ou Instagram..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2 pt-2 border-t">
              <Checkbox
                id="onlyWithPurchases"
                checked={onlyWithPurchases}
                onCheckedChange={(checked) => setOnlyWithPurchases(checked === true)}
              />
              <Label
                htmlFor="onlyWithPurchases"
                className="text-sm font-normal cursor-pointer flex items-center gap-2"
              >
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                Mostrar apenas clientes que já compraram
              </Label>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2 border-t">
              <div className="flex items-center gap-2">
                <Label htmlFor="itemsPerPage" className="text-sm">
                  Itens por página:
                </Label>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => setItemsPerPage(Number(value))}
                >
                  <SelectTrigger id="itemsPerPage" className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="8">8</SelectItem>
                    <SelectItem value="12">12</SelectItem>
                    <SelectItem value="16">16</SelectItem>
                    <SelectItem value="24">24</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant={viewMode === 'cards' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('cards')}
                    className="rounded-r-none"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  Mostrando {startIndex + 1} a {Math.min(endIndex, filteredCustomers.length)} de {filteredCustomers.length} cliente(s)
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredCustomers.length === 0 ? (
        <div className="py-12 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Nenhum cliente encontrado</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {onlyWithPurchases && searchTerm
              ? 'Nenhum cliente com compras encontrado para esta busca'
              : onlyWithPurchases
              ? 'Nenhum cliente fez compras ainda'
              : searchTerm
              ? 'Tente ajustar a busca'
              : 'Comece adicionando seu primeiro cliente'}
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginatedCustomers.map((customer: any) => (
            <Card 
              key={customer._id}
              className={overdueCustomers.has(customer._id) ? 'border-red-500 border-2' : ''}
            >
              <CardHeader>
                <CardTitle 
                  className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                  onClick={() => router.push(`/clientes/${customer._id}`)}
                >
                  <Users className="h-5 w-5" />
                  {customer.name}
                </CardTitle>
                {/* Badges de pagamento pendente/atrasado */}
                <PendingPayments 
                  customerId={customer._id} 
                  onStatusChange={(hasOverdue, hasPending) => {
                    setOverdueCustomers(prev => {
                      const newSet = new Set(prev)
                      if (hasOverdue) {
                        newSet.add(customer._id)
                      } else {
                        newSet.delete(customer._id)
                      }
                      return newSet
                    })
                  }}
                />
              </CardHeader>
              <CardContent className="space-y-3">
                {customer.phone && (
                  <a
                    href={getWhatsAppUrl(customer.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                  >
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    <span>{formatPhone(customer.phone)}</span>
                  </a>
                )}

                {customer.instagram && (
                  <a
                    href={getInstagramUrl(customer.instagram)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                  >
                    <Instagram className="h-4 w-4 text-muted-foreground" />
                    <span>@{customer.instagram}</span>
                  </a>
                )}

                {customer.address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="break-words">{customer.address}</span>
                  </div>
                )}

                {customer.children && customer.children.length > 0 && (
                  <div className="pt-2 border-t space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Baby className="h-4 w-4" />
                      Crianças ({customer.children.length})
                    </div>
                    <div className="space-y-1">
                      {customer.children.map((child: any, index: number) => (
                        <div key={index} className="text-xs bg-muted p-2 rounded">
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

                {/* Histórico de Compras */}
                <div className="pt-2 border-t">
                  <PurchaseHistoryCompact
                    customerId={customer._id}
                    initialMovements={movementsByCustomer[customer._id] || []}
                  />
                </div>

                <div className="flex gap-2 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                  <CustomerForm customer={customer}>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                  </CustomerForm>
                  <DeleteCustomerButton customerId={customer._id} />
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        </>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Instagram</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Crianças</TableHead>
                  <TableHead>Compras</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCustomers.map((customer: any) => {
                  const hasPurchases = customersWithPurchases.has(customer._id)
                  const purchaseCount = movementsByCustomer[customer._id]?.length || 0
                  
                  return (
                    <TableRow 
                      key={customer._id}
                      className={`border-b ${overdueCustomers.has(customer._id) ? 'bg-red-50' : 'hover:bg-muted/50'}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{customer.name}</span>
                        </div>
                        <PendingPayments 
                          customerId={customer._id} 
                          onStatusChange={(hasOverdue, hasPending) => {
                            setOverdueCustomers(prev => {
                              const newSet = new Set(prev)
                              if (hasOverdue) {
                                newSet.add(customer._id)
                              } else {
                                newSet.delete(customer._id)
                              }
                              return newSet
                            })
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {customer.phone ? (
                          <a
                            href={getWhatsAppUrl(customer.phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm hover:text-primary transition-colors"
                          >
                            <MessageCircle className="h-3 w-3 text-muted-foreground" />
                            <span>{formatPhone(customer.phone)}</span>
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {customer.instagram ? (
                          <a
                            href={getInstagramUrl(customer.instagram)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm hover:text-primary transition-colors"
                          >
                            <Instagram className="h-3 w-3 text-muted-foreground" />
                            <span>@{customer.instagram}</span>
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {customer.address ? (
                          <div className="flex items-start gap-1 max-w-xs">
                            <MapPin className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <span className="text-sm line-clamp-2">{customer.address}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {customer.children && customer.children.length > 0 ? (
                          <div className="flex items-center gap-1">
                            <Baby className="h-3 w-3 text-muted-foreground" />
                            <Badge variant="secondary" className="text-xs">
                              {customer.children.length}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {hasPurchases ? (
                          <Badge variant="default" className="text-xs">
                            {purchaseCount} compra{purchaseCount !== 1 ? 's' : ''}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Sem compras</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/clientes/${customer._id}`)}
                            className="h-8 w-8 p-0"
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <CustomerForm customer={customer}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Editar">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </CustomerForm>
                          <DeleteCustomerButton customerId={customer._id}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" title="Deletar">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DeleteCustomerButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="text-sm text-muted-foreground text-center md:text-left">
                    Página {currentPage} de {totalPages}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
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
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </>
  )
}


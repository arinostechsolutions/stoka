'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CustomerForm } from './customer-form'
import { Users, Phone, MapPin, Instagram, Baby, Edit, Trash2, Search } from 'lucide-react'
import { DeleteCustomerButton } from '../[id]/delete-button'
import { formatPhone } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface CustomersListClientProps {
  initialCustomers: any[]
}

export function CustomersListClient({ initialCustomers }: CustomersListClientProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return initialCustomers
    return initialCustomers.filter((customer: any) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.instagram?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [initialCustomers, searchTerm])

  return (
    <>
      <Card>
        <CardContent className="pt-6">
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
        </CardContent>
      </Card>

      {filteredCustomers.length === 0 ? (
        <div className="py-12 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Nenhum cliente encontrado</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {searchTerm ? 'Tente ajustar a busca' : 'Comece adicionando seu primeiro cliente'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCustomers.map((customer: any) => (
            <Card key={customer._id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {customer.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{formatPhone(customer.phone)}</span>
                  </div>
                )}

                {customer.instagram && (
                  <div className="flex items-center gap-2 text-sm">
                    <Instagram className="h-4 w-4 text-muted-foreground" />
                    <span>{customer.instagram}</span>
                  </div>
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

                <div className="flex gap-2 pt-2 border-t">
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
      )}
    </>
  )
}


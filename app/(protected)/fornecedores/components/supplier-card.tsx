'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, Mail, Phone, MapPin, CreditCard, Edit, Trash2 } from 'lucide-react'
import { SupplierForm } from './supplier-form'
import { DeleteSupplierButton } from '../[id]/delete-button'
import { formatPhone, formatCNPJ } from '@/lib/utils'

interface SupplierCardProps {
  supplier: {
    _id: string
    name: string
    cnpj?: string
    email?: string
    phone?: string
    address?: string
    notes?: string
  }
}

export function SupplierCard({ supplier }: SupplierCardProps) {
  return (
    <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-primary/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-bold flex items-center gap-2 group-hover:text-primary transition-colors">
            <Building2 className="h-5 w-5 text-primary" />
            {supplier.name}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Informações de contato */}
        <div className="space-y-2">
          {supplier.cnpj && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="h-4 w-4 shrink-0" />
              <span className="truncate">{formatCNPJ(supplier.cnpj)}</span>
            </div>
          )}
          {supplier.email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0" />
              <span className="truncate">{supplier.email}</span>
            </div>
          )}
          {supplier.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0" />
              <span className="truncate">{formatPhone(supplier.phone)}</span>
            </div>
          )}
          {supplier.address && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="truncate line-clamp-2">{supplier.address}</span>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="pt-3 border-t flex gap-2">
          <Link 
            href={`/fornecedores/${supplier._id}`}
            className="flex-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Button variant="outline" className="w-full" size="sm">
              Ver Detalhes
            </Button>
          </Link>
          
          <SupplierForm
            supplier={{
              _id: supplier._id,
              name: supplier.name,
              cnpj: supplier.cnpj,
              email: supplier.email,
              phone: supplier.phone,
              address: supplier.address,
              notes: supplier.notes,
            }}
          >
            <Button variant="outline" size="sm" className="px-3">
              <Edit className="h-4 w-4" />
            </Button>
          </SupplierForm>

          <DeleteSupplierButton supplierId={supplier._id} />
        </div>
      </CardContent>
    </Card>
  )
}


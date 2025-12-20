'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, ExternalLink, User, Package, DollarSign, Calendar } from 'lucide-react'
import { InvoiceForm } from './invoice-form'
import { formatDate, formatCurrency } from '@/lib/utils'

interface InvoicesListProps {
  initialMovements: any[]
}

export function InvoicesList({ initialMovements }: InvoicesListProps) {
  const [selectedMovement, setSelectedMovement] = useState<string | null>(null)

  if (initialMovements.length === 0) {
    return (
      <div className="py-12 text-center">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Nenhuma movimentação de saída</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          As movimentações de saída aparecerão aqui para emissão de nota fiscal
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {initialMovements.map((movement: any) => (
          <Card key={movement._id.toString()}>
            <CardContent className="pt-4 md:pt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium text-base md:text-lg">
                      {movement.productId?.name || 'Produto removido'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(movement.createdAt)}
                    </span>
                    <span>•</span>
                    <span>{movement.quantity} unidades</span>
                    {movement.salePrice && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {formatCurrency(movement.salePrice)}/un
                        </span>
                      </>
                    )}
                    {movement.totalRevenue && (
                      <>
                        <span>•</span>
                        <span className="font-semibold text-primary">
                          Total: {formatCurrency(movement.totalRevenue)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <InvoiceForm movement={movement}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <FileText className="h-4 w-4" />
                      Emitir NF
                    </Button>
                  </InvoiceForm>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}


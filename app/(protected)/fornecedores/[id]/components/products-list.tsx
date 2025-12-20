'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface ProductsListProps {
  initialProducts: any[]
}

export function ProductsList({ initialProducts }: ProductsListProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  // Calcula paginação
  const totalPages = Math.ceil(initialProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProducts = initialProducts.slice(startIndex, endIndex)

  if (initialProducts.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-4">
        Nenhum produto associado a este fornecedor
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {paginatedProducts.map((product: any) => (
          <Link key={product._id.toString()} href={`/produtos/${product._id}`}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="pt-4 md:pt-6">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                    <Package className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm md:text-base truncate">{product.name}</p>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        Estoque: {product.quantity}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between pt-4 border-t">
          <div className="text-xs md:text-sm text-muted-foreground text-center md:text-left">
            Mostrando {startIndex + 1} a {Math.min(endIndex, initialProducts.length)} de {initialProducts.length} produtos
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
    </div>
  )
}

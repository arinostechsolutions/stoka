'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  AlertTriangle, 
  Edit, 
  Trash2, 
  DollarSign, 
  Building2,
  Hash,
  Tag
} from 'lucide-react'
import { ProductForm } from './product-form'
import { DeleteProductButton } from '../[id]/delete-button'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: {
    _id: string
    name: string
    sku?: string
    category?: string
    supplierId?: {
      _id: string
      name: string
    }
    quantity: number
    minQuantity: number
    purchasePrice?: number
    salePrice?: number
    size?: string
    color?: string
    brand?: string
    material?: string
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const isLowStock = product.quantity < product.minQuantity
  const stockPercentage = product.minQuantity > 0 
    ? (product.quantity / product.minQuantity) * 100 
    : 100

  return (
    <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-primary/50">
      {/* Badge de estoque baixo */}
      {isLowStock && (
        <div className="absolute top-2 right-2 z-10">
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Estoque Baixo
          </Badge>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-bold line-clamp-2 group-hover:text-primary transition-colors">
              {product.name}
            </CardTitle>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-2">
          {product.sku && (
            <Badge variant="outline" className="text-xs">
              <Hash className="h-3 w-3 mr-1" />
              {product.sku}
            </Badge>
          )}
          {product.category && (
            <Badge variant="outline" className="text-xs">
              <Tag className="h-3 w-3 mr-1" />
              {product.category}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Informações de estoque */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Estoque Atual</span>
            <span className={cn(
              "text-2xl font-bold",
              isLowStock ? "text-destructive" : "text-primary"
            )}>
              {product.quantity}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Mínimo</span>
            <span className="font-medium">{product.minQuantity}</span>
          </div>

          {/* Barra de progresso do estoque */}
          {product.minQuantity > 0 && (
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-300",
                  isLowStock ? "bg-destructive" : "bg-primary"
                )}
                style={{ width: `${Math.min(stockPercentage, 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Preços */}
        {(product.purchasePrice || product.salePrice) && (
          <div className="pt-2 border-t space-y-1.5">
            {product.purchasePrice && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  Compra
                </span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(product.purchasePrice)}
                </span>
              </div>
            )}
            {product.salePrice && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  Venda
                </span>
                <span className="font-semibold text-blue-600">
                  {formatCurrency(product.salePrice)}
                </span>
              </div>
            )}
            {product.purchasePrice && product.salePrice && (
              <div className="flex items-center justify-between text-xs pt-1 border-t">
                <span className="text-muted-foreground">Margem</span>
                <span className={cn(
                  "font-semibold",
                  product.salePrice > product.purchasePrice ? "text-green-600" : "text-red-600"
                )}>
                  {formatCurrency(product.salePrice - product.purchasePrice)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Fornecedor */}
        {product.supplierId && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <Link 
                href={`/fornecedores/${product.supplierId._id}`}
                className="hover:text-primary hover:underline transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {product.supplierId.name}
              </Link>
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="pt-3 border-t flex gap-2">
          <Link 
            href={`/produtos/${product._id}`}
            className="flex-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Button variant="outline" className="w-full" size="sm">
              Ver Detalhes
            </Button>
          </Link>
          
          <ProductForm
            product={{
              _id: product._id,
              name: product.name,
              sku: product.sku,
              category: product.category,
              supplierId: product.supplierId?._id,
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
            <Button variant="outline" size="sm" className="px-3">
              <Edit className="h-4 w-4" />
            </Button>
          </ProductForm>

          <DeleteProductButton productId={product._id} />
        </div>
      </CardContent>
    </Card>
  )
}


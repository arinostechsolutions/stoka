import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Product from '@/lib/models/Product'
import Movement from '@/lib/models/Movement'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Package, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ProductForm } from '../components/product-form'
import { DeleteProductButton } from './delete-button'
import { formatDate, formatCurrency } from '@/lib/utils'
import { redirect } from 'next/navigation'

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)
  const userId = session!.user!.id

  await connectDB()

  const product = await Product.findOne({
    _id: params.id,
    userId: userId as any,
  })
    .populate('supplierId', 'name')
    .lean()

  if (!product) {
    redirect('/produtos')
  }

  const movements = await Movement.find({
    productId: params.id,
    userId: userId as any,
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean()

  const isLowStock = product.quantity < product.minQuantity

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4">
        <div className="flex items-center gap-2 md:gap-4">
          <Link href="/produtos">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-3xl font-bold truncate">{product.name}</h1>
            {product.sku && (
              <p className="text-xs md:text-sm text-muted-foreground">SKU: {product.sku}</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <ProductForm product={product as any}>
            <Button variant="outline" className="flex-1 md:flex-initial">
              Editar
            </Button>
          </ProductForm>
          <DeleteProductButton productId={params.id} />
        </div>
      </div>

      {isLowStock && (
        <Card className="border-destructive">
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 shrink-0" />
              <p className="font-medium text-sm md:text-base">Estoque abaixo do mínimo</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Package className="h-4 w-4 md:h-5 md:w-5" />
              Informações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm md:text-base text-muted-foreground">Quantidade Atual:</span>
              <span
                className={`text-xl md:text-2xl font-bold ${
                  isLowStock ? 'text-destructive' : ''
                }`}
              >
                {product.quantity}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm md:text-base text-muted-foreground">Estoque Mínimo:</span>
              <span className="text-base md:text-lg font-semibold">{product.minQuantity}</span>
            </div>
            {product.category && (
              <div className="flex justify-between items-center">
                <span className="text-sm md:text-base text-muted-foreground">Categoria:</span>
                <span className="text-sm md:text-base break-words text-right">{product.category}</span>
              </div>
            )}
            {product.supplierId && (
              <div className="flex justify-between items-center gap-2">
                <span className="text-sm md:text-base text-muted-foreground shrink-0">Fornecedor:</span>
                <Link 
                  href={`/fornecedores/${typeof product.supplierId === 'object' && '_id' in product.supplierId ? (product.supplierId as any)._id.toString() : (product.supplierId as any).toString()}`} 
                  className="text-primary hover:underline text-sm md:text-base break-all text-right"
                >
                  {typeof product.supplierId === 'object' && 'name' in product.supplierId ? String((product.supplierId as any).name) : 'Fornecedor'}
                </Link>
              </div>
            )}
            {(product.purchasePrice !== undefined || product.salePrice !== undefined) && (
              <div className="pt-2 border-t space-y-2">
                {product.purchasePrice !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm md:text-base text-muted-foreground">Preço de Compra:</span>
                    <span className="text-sm md:text-base font-semibold text-green-600">{formatCurrency(product.purchasePrice)}</span>
                  </div>
                )}
                {product.salePrice !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm md:text-base text-muted-foreground">Preço de Venda:</span>
                    <span className="text-sm md:text-base font-semibold text-blue-600">{formatCurrency(product.salePrice)}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Histórico de Movimentações</CardTitle>
          </CardHeader>
          <CardContent>
            {movements.length > 0 ? (
              <div className="space-y-2">
                {movements.map((movement: any) => (
                  <div
                    key={movement._id.toString()}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm md:text-base">
                        {movement.type === 'entrada' && '➕ Entrada'}
                        {movement.type === 'saida' && '➖ Saída'}
                        {movement.type === 'ajuste' && '🔧 Ajuste'}
                      </p>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        {movement.quantity} unidades
                      </p>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground shrink-0">
                      {formatDate(movement.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-xs md:text-sm text-muted-foreground">
                Nenhuma movimentação ainda
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


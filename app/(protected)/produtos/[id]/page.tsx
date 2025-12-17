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
import { formatDate } from '@/lib/utils'
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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/produtos">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{product.name}</h1>
          {product.sku && (
            <p className="text-muted-foreground">SKU: {product.sku}</p>
          )}
        </div>
        <ProductForm product={product as any}>
          <Button variant="outline">Editar</Button>
        </ProductForm>
        <DeleteProductButton productId={params.id} />
      </div>

      {isLowStock && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <p className="font-medium">Estoque abaixo do mínimo</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Informações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quantidade Atual:</span>
              <span
                className={`text-2xl font-bold ${
                  isLowStock ? 'text-destructive' : ''
                }`}
              >
                {product.quantity}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estoque Mínimo:</span>
              <span className="text-lg font-semibold">{product.minQuantity}</span>
            </div>
            {product.category && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Categoria:</span>
                <span>{product.category}</span>
              </div>
            )}
            {product.supplierId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fornecedor:</span>
                <Link href={`/fornecedores/${typeof product.supplierId === 'object' && '_id' in product.supplierId ? (product.supplierId as any)._id.toString() : (product.supplierId as any).toString()}`} className="text-primary hover:underline">
                  {typeof product.supplierId === 'object' && 'name' in product.supplierId ? String((product.supplierId as any).name) : 'Fornecedor'}
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Movimentações</CardTitle>
          </CardHeader>
          <CardContent>
            {movements.length > 0 ? (
              <div className="space-y-2">
                {movements.map((movement: any) => (
                  <div
                    key={movement._id.toString()}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">
                        {movement.type === 'entrada' && '➕ Entrada'}
                        {movement.type === 'saida' && '➖ Saída'}
                        {movement.type === 'ajuste' && '🔧 Ajuste'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {movement.quantity} unidades
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(movement.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                Nenhuma movimentação ainda
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


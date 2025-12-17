import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Product from '@/lib/models/Product'
import Movement from '@/lib/models/Movement'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, AlertTriangle, TrendingUp, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const userId = session!.user!.id

  await connectDB()

  const [totalProducts, lowStockProducts, recentMovements] = await Promise.all([
    Product.countDocuments({ userId: userId as any }),
    Product.find({
      userId: userId as any,
      $expr: { $lt: ['$quantity', '$minQuantity'] },
    }).limit(5).lean(),
    Movement.find({ userId: userId as any })
      .populate('productId', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ])

  const totalLowStock = await Product.countDocuments({
    userId: userId as any,
    $expr: { $lt: ['$quantity', '$minQuantity'] },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu estoque</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{totalLowStock}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Movimentações</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentMovements.length}</div>
            <p className="text-xs text-muted-foreground">Últimas 5</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Atividade</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {recentMovements[0] ? (
              <div className="text-sm">
                {formatDate(recentMovements[0].createdAt)}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Nenhuma atividade</div>
            )}
          </CardContent>
        </Card>
      </div>

      {lowStockProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Produtos com Estoque Baixo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockProducts.map((product: any) => (
                <div
                  key={product._id.toString()}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.quantity} / {product.minQuantity} mínimo
                    </p>
                  </div>
                  <Link href={`/produtos/${product._id}`}>
                    <Button variant="outline" size="sm">
                      Ver
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href="/produtos">
                <Button variant="outline" className="w-full">
                  Ver todos os produtos
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Últimas Movimentações</CardTitle>
        </CardHeader>
        <CardContent>
          {recentMovements.length > 0 ? (
            <div className="space-y-2">
              {recentMovements.map((movement: any) => (
                <div
                  key={movement._id.toString()}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">
                      {movement.productId?.name || 'Produto removido'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {movement.type === 'entrada' && '➕ Entrada'}
                      {movement.type === 'saida' && '➖ Saída'}
                      {movement.type === 'ajuste' && '🔧 Ajuste'}
                      {' • '}
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
            <div className="py-8 text-center text-muted-foreground">
              <p>Nenhuma movimentação ainda</p>
              <Link href="/movimentacoes">
                <Button variant="outline" className="mt-4">
                  Criar primeira movimentação
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

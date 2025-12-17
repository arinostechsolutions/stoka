import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Product from '@/lib/models/Product'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Package } from 'lucide-react'
import { ProductForm } from './components/product-form'
import { ProductCard } from './components/product-card'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

async function ProductsList() {
  const session = await getServerSession(authOptions)
  const userId = session!.user!.id

  await connectDB()

  const products = await Product.find({ userId: userId as any })
    .populate('supplierId', 'name')
    .sort({ name: 1 })
    .lean()

  if (products.length === 0) {
    return (
      <div className="py-12 text-center">
        <Package className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Nenhum produto cadastrado</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Comece adicionando seu primeiro produto
        </p>
        <ProductForm>
          <Button className="mt-4" size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Produto
          </Button>
        </ProductForm>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {products.map((product: any) => (
        <ProductCard key={product._id.toString()} product={product} />
      ))}
    </div>
  )
}

export default async function ProdutosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Produtos</h1>
          <p className="text-muted-foreground">Gerencie seu estoque</p>
        </div>
        <ProductForm>
          <Button size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Produto
          </Button>
        </ProductForm>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        }
      >
        <ProductsList />
      </Suspense>
    </div>
  )
}


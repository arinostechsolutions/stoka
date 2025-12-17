import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Product from '@/lib/models/Product'
import Supplier from '@/lib/models/Supplier'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { ProductForm } from './components/product-form'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ProductsListClient } from './components/products-list-client'

async function ProductsList() {
  const session = await getServerSession(authOptions)
  const userId = session!.user!.id

  await connectDB()

  const products = await Product.find({ userId: userId as any })
    .populate('supplierId', 'name')
    .sort({ name: 1 })
    .lean()

  const suppliers = await Supplier.find({ userId: userId as any })
    .select('_id name')
    .sort({ name: 1 })
    .lean()

  return (
    <ProductsListClient 
      initialProducts={products} 
      suppliers={suppliers}
    />
  )
}

export default async function ProdutosPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Produtos</h1>
          <p className="text-sm md:text-base text-muted-foreground">Gerencie seu estoque</p>
        </div>
        <ProductForm>
          <Button size="lg" className="w-full md:w-auto">
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


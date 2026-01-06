import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Product from '@/lib/models/Product'
import Supplier from '@/lib/models/Supplier'
import { Button } from '@/components/ui/button'
import { Plus, Store } from 'lucide-react'
import { ProductForm } from './components/product-form'
import { ImportProductsForm } from './components/import-products-form'
import { ExportNuvemshopButton } from './components/export-nuvemshop-button'
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

  // Serializa para JSON simples para evitar warnings do Next.js
  const serializedProducts = JSON.parse(JSON.stringify(products))
  const serializedSuppliers = JSON.parse(JSON.stringify(suppliers))

  return (
    <ProductsListClient 
      initialProducts={serializedProducts} 
      suppliers={serializedSuppliers}
    />
  )
}

export default async function ProdutosPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="w-full flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold">Produtos</h1>
          <p className="text-sm md:text-base text-muted-foreground">Gerencie seu estoque</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <ProductForm>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Produto
            </Button>
          </ProductForm>
          <ImportProductsForm>
            <Button variant="outline" className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Importar CSV
            </Button>
          </ImportProductsForm>
          <ExportNuvemshopButton>
            <Button variant="outline" className="w-full sm:w-auto">
              <Store className="mr-2 h-4 w-4" />
              Exportar Nuvemshop
            </Button>
          </ExportNuvemshopButton>
        </div>
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


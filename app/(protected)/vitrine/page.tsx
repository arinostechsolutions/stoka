import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Product from '@/lib/models/Product'
import Customer from '@/lib/models/Customer'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { VitrineClient } from './components/vitrine-client'

async function VitrineProducts() {
  const session = await getServerSession(authOptions)
  const userId = session!.user!.id

  await connectDB()

  const [products, customers] = await Promise.all([
    Product.find({ userId: userId as any })
      .populate('supplierId', 'name')
      .sort({ name: 1 })
      .lean(),
    Customer.find({ userId: userId as any })
      .sort({ name: 1 })
      .lean(),
  ])

  // Serializa para JSON simples para evitar warnings do Next.js
  const serializedProducts = JSON.parse(JSON.stringify(products))
  const serializedCustomers = JSON.parse(JSON.stringify(customers))

  return <VitrineClient initialProducts={serializedProducts} initialCustomers={serializedCustomers} />
}

export default async function VitrinePage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Vitrine</h1>
        <p className="text-sm md:text-base text-muted-foreground">Visualize e venda seus produtos</p>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-48 w-full mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        }
      >
        <VitrineProducts />
      </Suspense>
    </div>
  )
}


import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Movement from '@/lib/models/Movement'
import Product from '@/lib/models/Product'
import Supplier from '@/lib/models/Supplier'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import { MovementForm } from './components/movement-form'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { MovementsListClient } from './components/movements-list-client'

async function MovementsList() {
  const session = await getServerSession(authOptions)
  const userId = session!.user!.id

  await connectDB()

  const movements = await Movement.find({ userId: userId as any })
    .populate('productId', 'name size brand')
    .populate('supplierId', 'name')
    .sort({ createdAt: -1 })
    .limit(1000) // Aumenta o limite para permitir filtros
    .lean()

  const products = await Product.find({ userId: userId as any })
    .select('_id name supplierId brand size')
    .populate('supplierId', 'name')
    .sort({ name: 1 })
    .lean()

  const suppliers = await Supplier.find({ userId: userId as any })
    .select('_id name')
    .sort({ name: 1 })
    .lean()

  // Serializa para JSON simples para evitar warnings do Next.js
  const serializedMovements = JSON.parse(JSON.stringify(movements))
  const serializedProducts = JSON.parse(JSON.stringify(products))
  const serializedSuppliers = JSON.parse(JSON.stringify(suppliers))

  return (
    <MovementsListClient 
      initialMovements={serializedMovements} 
      products={serializedProducts}
      suppliers={serializedSuppliers}
    />
  )
}

export default async function MovimentacoesPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="w-full flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold">Movimentações</h1>
          <p className="text-sm md:text-base text-muted-foreground">Histórico de entradas e saídas</p>
        </div>
        <MovementForm>
          <Button className="shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            Nova Movimentação
          </Button>
        </MovementForm>
      </div>

      <Suspense
        fallback={
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        }
      >
        <MovementsList />
      </Suspense>
    </div>
  )
}


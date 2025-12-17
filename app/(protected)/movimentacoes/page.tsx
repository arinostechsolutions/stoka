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
    .populate('productId', 'name')
    .populate('supplierId', 'name')
    .sort({ createdAt: -1 })
    .limit(1000) // Aumenta o limite para permitir filtros
    .lean()

  const products = await Product.find({ userId: userId as any })
    .select('_id name supplierId')
    .populate('supplierId', 'name')
    .sort({ name: 1 })
    .lean()

  const suppliers = await Supplier.find({ userId: userId as any })
    .select('_id name')
    .sort({ name: 1 })
    .lean()

  return (
    <MovementsListClient 
      initialMovements={movements} 
      products={products}
      suppliers={suppliers}
    />
  )
}

export default async function MovimentacoesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Movimentações</h1>
          <p className="text-muted-foreground">Histórico de entradas e saídas</p>
        </div>
        <MovementForm>
          <Button size="lg">
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


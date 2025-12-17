import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Movement from '@/lib/models/Movement'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, ArrowLeftRight } from 'lucide-react'
import { MovementForm } from './components/movement-form'
import { formatDate } from '@/lib/utils'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

async function MovementsList() {
  const session = await getServerSession(authOptions)
  const userId = session!.user!.id

  await connectDB()

  const movements = await Movement.find({ userId: userId as any })
    .populate('productId', 'name')
    .populate('supplierId', 'name')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean()

  if (movements.length === 0) {
    return (
      <div className="py-12 text-center">
        <ArrowLeftRight className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Nenhuma movimentação</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Comece registrando uma entrada ou saída
        </p>
        <MovementForm>
          <Button className="mt-4" size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Nova Movimentação
          </Button>
        </MovementForm>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {movements.map((movement: any) => (
        <Card key={movement._id.toString()}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium">
                  {movement.productId?.name || 'Produto removido'}
                </p>
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    {movement.type === 'entrada' && '➕ Entrada'}
                    {movement.type === 'saida' && '➖ Saída'}
                    {movement.type === 'ajuste' && '🔧 Ajuste'}
                  </span>
                  <span>•</span>
                  <span>{movement.quantity} unidades</span>
                  <span>•</span>
                  <span>
                    {movement.previousQuantity} → {movement.newQuantity}
                  </span>
                  {movement.supplierId && (
                    <>
                      <span>•</span>
                      <span>Fornecedor: {movement.supplierId?.name}</span>
                    </>
                  )}
                </div>
                {movement.notes && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {movement.notes}
                  </p>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDate(movement.createdAt)}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
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


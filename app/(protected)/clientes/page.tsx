import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Customer from '@/lib/models/Customer'
import Movement from '@/lib/models/Movement'
import Product from '@/lib/models/Product'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { CustomerForm } from './components/customer-form'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CustomersListClient } from './components/customers-list-client'

async function CustomersList() {
  const session = await getServerSession(authOptions)
  const userId = session!.user!.id

  await connectDB()

  // Garante que o modelo Product está registrado antes de usar populate
  // Referencia o modelo para forçar o registro no Mongoose
  if (typeof Product === 'undefined') {
    throw new Error('Product model not loaded')
  }

  const customers = await Customer.find({ userId: userId as any })
    .sort({ name: 1 })
    .lean()

  // Busca movimentações de saída e entrada (pagamentos de parcelas) associadas aos clientes
  const movements = await Movement.find({
    userId: userId as any,
    $or: [
      { type: 'saida' },
      { type: 'entrada', notes: { $regex: /Pagamento de parcela/i } } // Entradas que são pagamentos de parcelas
    ],
    customerId: { $exists: true, $ne: null },
  })
    .populate({
      path: 'productId',
      model: Product,
      select: 'name nome_vitrine brand size'
    })
    .select('_id productId quantity salePrice totalRevenue paymentMethod campaignId notes saleGroupId type installmentsCount createdAt customerId')
    .sort({ createdAt: -1 })
    .lean()

  // Agrupa movimentações por cliente e converte saleGroupId para string
  const movementsByCustomer: Record<string, any[]> = {}
  movements.forEach((movement: any) => {
    if (movement.customerId) {
      const customerId = movement.customerId.toString()
      if (!movementsByCustomer[customerId]) {
        movementsByCustomer[customerId] = []
      }
      // Converte saleGroupId ObjectId para string
      const movementWithStringId = {
        ...movement,
        saleGroupId: movement.saleGroupId ? movement.saleGroupId.toString() : undefined,
      }
      movementsByCustomer[customerId].push(movementWithStringId)
    }
  })

  // Serializa para JSON simples para evitar warnings do Next.js
  const serializedCustomers = JSON.parse(JSON.stringify(customers))
  const serializedMovementsByCustomer = JSON.parse(JSON.stringify(movementsByCustomer))
  
  // Debug: log das movimentações no servidor
  console.log('=== SERVER: Movimentações por cliente ===')
  console.log('Total de clientes com movimentações:', Object.keys(movementsByCustomer).length)
  Object.entries(movementsByCustomer).forEach(([customerId, movs]) => {
    const withSaleGroupId = movs.filter((m: any) => m.saleGroupId)
    if (withSaleGroupId.length > 0) {
      console.log(`Cliente ${customerId}:`, {
        totalMovements: movs.length,
        withSaleGroupId: withSaleGroupId.length,
        saleGroupIds: [...new Set(withSaleGroupId.map((m: any) => m.saleGroupId))],
      })
    }
  })

  return <CustomersListClient initialCustomers={serializedCustomers} movementsByCustomer={serializedMovementsByCustomer} />
}

export default async function ClientesPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Clientes</h1>
          <p className="text-sm md:text-base text-muted-foreground">Gerencie seus clientes e suas crianças</p>
        </div>
        <CustomerForm>
          <Button size="lg" className="w-full md:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Cliente
          </Button>
        </CustomerForm>
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
        <CustomersList />
      </Suspense>
    </div>
  )
}


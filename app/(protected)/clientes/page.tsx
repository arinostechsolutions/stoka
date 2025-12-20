import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Customer from '@/lib/models/Customer'
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

  const customers = await Customer.find({ userId: userId as any })
    .sort({ name: 1 })
    .lean()

  // Serializa para JSON simples para evitar warnings do Next.js
  const serializedCustomers = JSON.parse(JSON.stringify(customers))

  return <CustomersListClient initialCustomers={serializedCustomers} />
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


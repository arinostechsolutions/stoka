import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Supplier from '@/lib/models/Supplier'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { SupplierForm } from './components/supplier-form'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { SuppliersListClient } from './components/suppliers-list-client'

async function SuppliersList() {
  const session = await getServerSession(authOptions)
  const userId = session!.user!.id

  await connectDB()

  const suppliers = await Supplier.find({ userId: userId as any })
    .sort({ name: 1 })
    .lean()

  return (
    <SuppliersListClient 
      initialSuppliers={suppliers} 
    />
  )
}

export default async function FornecedoresPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Fornecedores</h1>
          <p className="text-sm md:text-base text-muted-foreground">Gerencie seus fornecedores</p>
        </div>
        <SupplierForm>
          <Button size="lg" className="w-full md:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Fornecedor
          </Button>
        </SupplierForm>
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
        <SuppliersList />
      </Suspense>
    </div>
  )
}


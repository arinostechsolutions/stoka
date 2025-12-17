import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Supplier from '@/lib/models/Supplier'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Building2 } from 'lucide-react'
import { SupplierForm } from './components/supplier-form'
import { SupplierCard } from './components/supplier-card'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

async function SuppliersList() {
  const session = await getServerSession(authOptions)
  const userId = session!.user!.id

  await connectDB()

  const suppliers = await Supplier.find({ userId: userId as any })
    .sort({ name: 1 })
    .lean()

  if (suppliers.length === 0) {
    return (
      <div className="py-12 text-center">
        <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Nenhum fornecedor cadastrado</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Comece adicionando seu primeiro fornecedor
        </p>
        <SupplierForm>
          <Button className="mt-4" size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Fornecedor
          </Button>
        </SupplierForm>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {suppliers.map((supplier: any) => (
        <SupplierCard key={supplier._id.toString()} supplier={supplier} />
      ))}
    </div>
  )
}

export default async function FornecedoresPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fornecedores</h1>
          <p className="text-muted-foreground">Gerencie seus fornecedores</p>
        </div>
        <SupplierForm>
          <Button size="lg">
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


import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Supplier from '@/lib/models/Supplier'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, ArrowLeft, Mail, Phone, MapPin, Package, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { SupplierForm } from '../components/supplier-form'
import { DeleteSupplierButton } from './delete-button'
import { PurchaseForm } from './components/purchase-form'
import { ProductsList } from './components/products-list'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { formatPhone, formatCNPJ } from '@/lib/utils'
import { ShoppingCart } from 'lucide-react'

export default async function SupplierDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)
  const userId = session!.user!.id

  await connectDB()

  const supplier = await Supplier.findOne({
    _id: params.id,
    userId: userId as any,
  }).lean()

  if (!supplier) {
    redirect('/fornecedores')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/fornecedores">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            {supplier.name}
          </h1>
        </div>
        <PurchaseForm supplierId={params.id}>
          <Button size="lg" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            Registrar Compra
          </Button>
        </PurchaseForm>
        <SupplierForm supplier={supplier as any}>
          <Button variant="outline">Editar</Button>
        </SupplierForm>
        <DeleteSupplierButton supplierId={params.id} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informações de Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {supplier.cnpj && (
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span>{formatCNPJ(supplier.cnpj)}</span>
              </div>
            )}
            {supplier.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{supplier.email}</span>
              </div>
            )}
            {supplier.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{formatPhone(supplier.phone)}</span>
              </div>
            )}
            {supplier.address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                <span>{supplier.address}</span>
              </div>
            )}
            {supplier.notes && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground mb-1">Observações:</p>
                <p className="text-sm">{supplier.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produtos Associados</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<p className="text-muted-foreground">Carregando...</p>}>
              <ProductsList supplierId={params.id} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


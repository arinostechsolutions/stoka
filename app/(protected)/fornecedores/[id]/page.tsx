import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Supplier from '@/lib/models/Supplier'
import Product from '@/lib/models/Product'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, ArrowLeft, Mail, Phone, MapPin, Package, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { SupplierForm } from '../components/supplier-form'
import { DeleteSupplierButton } from './delete-button'
import { PurchaseForm } from './components/purchase-form'
import { ProductsList } from './components/products-list'
import { redirect } from 'next/navigation'
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

  // Busca produtos associados ao fornecedor
  const products = await Product.find({
    userId: userId as any,
    supplierId: params.id as any,
  })
    .select('_id name quantity')
    .sort({ name: 1 })
    .lean()

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4">
        <div className="flex items-center gap-2 md:gap-4">
          <Link href="/fornecedores">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-3xl font-bold flex items-center gap-2">
              <Building2 className="h-5 w-5 md:h-8 md:w-8 shrink-0" />
              <span className="truncate">{supplier.name}</span>
            </h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <PurchaseForm supplierId={params.id}>
            <Button size="lg" className="gap-2 flex-1 md:flex-initial min-w-0">
              <ShoppingCart className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Registrar Compra</span>
              <span className="sm:hidden">Compra</span>
            </Button>
          </PurchaseForm>
          <SupplierForm supplier={supplier as any}>
            <Button variant="outline" className="flex-1 md:flex-initial">
              Editar
            </Button>
          </SupplierForm>
          <DeleteSupplierButton supplierId={params.id} />
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Informações de Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4">
            {supplier.cnpj && (
              <div className="flex items-center gap-2 text-sm md:text-base">
                <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="break-all">{formatCNPJ(supplier.cnpj)}</span>
              </div>
            )}
            {supplier.email && (
              <div className="flex items-center gap-2 text-sm md:text-base">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="break-all">{supplier.email}</span>
              </div>
            )}
            {supplier.phone && (
              <div className="flex items-center gap-2 text-sm md:text-base">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="break-all">{formatPhone(supplier.phone)}</span>
              </div>
            )}
            {supplier.address && (
              <div className="flex items-start gap-2 text-sm md:text-base">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                <span className="break-words">{supplier.address}</span>
              </div>
            )}
            {supplier.notes && (
              <div className="pt-2 border-t">
                <p className="text-xs md:text-sm text-muted-foreground mb-1">Observações:</p>
                <p className="text-xs md:text-sm break-words">{supplier.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Produtos Associados</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductsList initialProducts={products} />
        </CardContent>
      </Card>
    </div>
  )
}


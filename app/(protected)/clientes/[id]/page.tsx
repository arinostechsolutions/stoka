import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Customer from '@/lib/models/Customer'
import Movement from '@/lib/models/Movement'
import Product from '@/lib/models/Product'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, ArrowLeft, Phone, MapPin, Instagram, Baby, ShoppingBag, MessageCircle, FileText } from 'lucide-react'
import Link from 'next/link'
import { CustomerForm } from '../components/customer-form'
import { DeleteCustomerButton } from './delete-button'
import { formatPhone, getInstagramUrl, getWhatsAppUrl } from '@/lib/utils'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { PurchaseHistory } from './components/purchase-history'
import { InstallmentsManager } from './components/installments-manager'

export default async function CustomerDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)
  const userId = session!.user!.id

  await connectDB()

  const customer = await Customer.findOne({
    _id: params.id,
    userId: userId as any,
  }).lean()

  if (!customer) {
    redirect('/clientes')
  }

  // Garante que o modelo Product está registrado antes do populate
  const ProductModel = Product

  // Busca movimentações de saída e entrada (pagamentos de parcelas) associadas ao cliente
  const movementsRaw = await Movement.find({
    customerId: params.id,
    userId: userId as any,
    $or: [
      { type: 'saida' },
      { type: 'entrada', notes: { $regex: /Pagamento de parcela/i } } // Entradas que são pagamentos de parcelas
    ],
  })
    .populate({
      path: 'productId',
      model: ProductModel,
      select: 'name nome_vitrine brand size',
    })
    .populate('campaignId', 'name')
    .select('_id productId quantity salePrice totalRevenue paymentMethod campaignId notes saleGroupId type installmentsCount createdAt')
    .sort({ createdAt: -1 })
    .lean()

  // Converte saleGroupId ObjectId para string antes de serializar
  const movements = movementsRaw.map((doc: any) => ({
    ...doc,
    saleGroupId: doc.saleGroupId ? doc.saleGroupId.toString() : undefined,
  }))

  // Serializa para JSON simples para evitar warnings do Next.js
  const serializedCustomer = JSON.parse(JSON.stringify(customer))
  const serializedMovements = JSON.parse(JSON.stringify(movements))

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4">
        <div className="flex items-center gap-2 md:gap-4">
          <Link href="/clientes">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-3xl font-bold flex items-center gap-2">
              <Users className="h-5 w-5 md:h-8 md:w-8 shrink-0" />
              <span className="truncate">{customer.name}</span>
            </h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <CustomerForm customer={serializedCustomer}>
            <Button size="lg" variant="outline" className="gap-2 flex-1 md:flex-initial min-w-0">
              Editar Cliente
            </Button>
          </CustomerForm>
          <DeleteCustomerButton customerId={params.id} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informações de Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {customer.phone && (
              <a
                href={getWhatsAppUrl(customer.phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm md:text-base hover:text-primary transition-colors"
              >
                <MessageCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{formatPhone(customer.phone)}</span>
              </a>
            )}

            {customer.instagram && (
              <a
                href={getInstagramUrl(customer.instagram)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm md:text-base hover:text-primary transition-colors"
              >
                <Instagram className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>@{customer.instagram}</span>
              </a>
            )}

            {customer.address && (
              <div className="flex items-start gap-2 text-sm md:text-base">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                <span className="break-words">{customer.address}</span>
              </div>
            )}

            {customer.notes && (
              <div className="flex items-start gap-2 text-sm md:text-base pt-2 border-t">
                <FileText className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                <div>
                  <div className="font-semibold mb-1">Observações:</div>
                  <span className="whitespace-pre-wrap break-words">{customer.notes}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {customer.children && customer.children.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Baby className="h-5 w-5" />
                Crianças ({customer.children.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {customer.children.map((child: any, index: number) => (
                <div key={index} className="p-3 bg-muted rounded-lg space-y-2">
                  <div className="font-medium">{child.name}</div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    {child.age && <span>Idade: {child.age} anos</span>}
                    {child.size && (
                      <span>
                        Tamanho: {Array.isArray(child.size) ? child.size.join(', ') : child.size}
                      </span>
                    )}
                    {child.gender && (
                      <Badge variant="secondary">
                        {child.gender === 'masculino' ? 'Masculino' : 'Feminino'}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Gerenciar Parcelas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Parcelas de Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <InstallmentsManager customerId={params.id} initialMovements={serializedMovements} />
        </CardContent>
      </Card>

      {/* Histórico de Compras */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Histórico de Compras
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PurchaseHistory customerId={params.id} initialMovements={serializedMovements} />
        </CardContent>
      </Card>
    </div>
  )
}


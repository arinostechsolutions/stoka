import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Movement from '@/lib/models/Movement'
import Product from '@/lib/models/Product'
import { Button } from '@/components/ui/button'
import { FileText, Plus } from 'lucide-react'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { InvoicesList } from './components/invoices-list'

async function InvoicesListServer() {
  const session = await getServerSession(authOptions)
  const userId = session!.user!.id

  await connectDB()

  // Busca movimentações de saída que podem gerar nota fiscal
  const movements = await Movement.find({
    userId: userId as any,
    type: 'saida',
  })
    .populate('productId', 'name salePrice')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean()

  // Serializa para JSON simples para evitar warnings do Next.js
  const serializedMovements = JSON.parse(JSON.stringify(movements))

  return <InvoicesList initialMovements={serializedMovements} />
}

export default async function NotasFiscaisPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Notas Fiscais</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Emissão de notas fiscais através do Emissor Web do governo
          </p>
        </div>
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
        <InvoicesListServer />
      </Suspense>
    </div>
  )
}


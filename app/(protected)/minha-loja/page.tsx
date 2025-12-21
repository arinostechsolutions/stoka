import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import connectDB from '@/lib/db'
import PublicStore from '@/lib/models/PublicStore'
import { PublicStoreForm } from './components/public-store-form'
import { DeleteStoreButton } from './components/delete-store-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Globe, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function MinhaLojaPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  await connectDB()

  const store = await PublicStore.findOne({ userId: session.user.id as any }).lean()

  const serializedStore = store ? JSON.parse(JSON.stringify(store)) : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Globe className="h-8 w-8" />
          Minha Loja Pública
        </h1>
        <p className="text-muted-foreground mt-2">
          Crie e gerencie sua página pública de vendas
        </p>
      </div>

      {serializedStore && serializedStore.isActive && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-green-800">Sua loja está ativa!</span>
              <Link href={`/loja/${serializedStore.slug}`} target="_blank">
                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Ver página pública
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-700">
              Sua loja está disponível em:{' '}
              <Link 
                href={`/loja/${serializedStore.slug}`}
                target="_blank"
                className="font-semibold underline hover:text-green-800"
              >
                /loja/{serializedStore.slug}
              </Link>
            </p>
          </CardContent>
        </Card>
      )}

      <PublicStoreForm store={serializedStore} />

      {serializedStore && (
        <Card className="border-destructive/50 mb-0 pb-0">
          <CardHeader>
            <CardTitle className="text-destructive">Zona Perigosa</CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <p className="text-sm text-muted-foreground mb-4">
              Deletar sua loja pública irá remover permanentemente todas as configurações.
              Esta ação não pode ser desfeita.
            </p>
            <DeleteStoreButton storeId={serializedStore._id} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}


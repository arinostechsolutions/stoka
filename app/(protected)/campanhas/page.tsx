import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Campaign from '@/lib/models/Campaign'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { CampaignForm } from './components/campaign-form'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CampaignsListClient } from './components/campaigns-list-client'

async function CampaignsList() {
  const session = await getServerSession(authOptions)
  const userId = session!.user!.id

  await connectDB()

  const campaigns = await Campaign.find({ userId: userId as any })
    .sort({ name: 1 })
    .lean()

  // Serializa para JSON simples para evitar warnings do Next.js
  const serializedCampaigns = JSON.parse(JSON.stringify(campaigns))

  return <CampaignsListClient initialCampaigns={serializedCampaigns} />
}

export default async function CampanhasPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="w-full flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold">Campanhas</h1>
          <p className="text-sm md:text-base text-muted-foreground">Gerencie suas campanhas de marketing</p>
        </div>
        <CampaignForm>
          <Button className="shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Campanha
          </Button>
        </CampaignForm>
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
        <CampaignsList />
      </Suspense>
    </div>
  )
}


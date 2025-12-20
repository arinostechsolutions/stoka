'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CampaignForm } from './campaign-form'
import { Megaphone, Edit, Trash2, Search } from 'lucide-react'
import { DeleteCampaignButton } from '../[id]/delete-button'

interface CampaignsListClientProps {
  initialCampaigns: any[]
}

export function CampaignsListClient({ initialCampaigns }: CampaignsListClientProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredCampaigns = useMemo(() => {
    if (!searchTerm) return initialCampaigns
    return initialCampaigns.filter((campaign: any) =>
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [initialCampaigns, searchTerm])

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label>Buscar Campanha</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Digite o nome da campanha..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredCampaigns.length === 0 ? (
        <div className="py-12 text-center">
          <Megaphone className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Nenhuma campanha encontrada</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {searchTerm ? 'Tente ajustar a busca' : 'Comece adicionando sua primeira campanha'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCampaigns.map((campaign: any) => (
            <Card key={campaign._id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5" />
                  {campaign.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {campaign.description && (
                  <p className="text-sm text-muted-foreground">{campaign.description}</p>
                )}

                <div className="flex gap-2 pt-2 border-t">
                  <CampaignForm campaign={campaign}>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                  </CampaignForm>
                  <DeleteCampaignButton campaignId={campaign._id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}


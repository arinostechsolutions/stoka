'use client'

import { useState, useTransition } from 'react'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Megaphone } from 'lucide-react'
import { createCampaign, updateCampaign } from '../actions'

interface CampaignFormProps {
  children: React.ReactNode
  campaign?: {
    _id: string
    name: string
    description?: string
  }
}

export function CampaignForm({ children, campaign }: CampaignFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(campaign?.name || '')
  const [description, setDescription] = useState(campaign?.description || '')

  React.useEffect(() => {
    if (open && campaign) {
      setName(campaign.name || '')
      setDescription(campaign.description || '')
    } else if (!open && !campaign) {
      setName('')
      setDescription('')
    }
  }, [open, campaign])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    const formData = new FormData()
    formData.set('name', name)
    if (description) formData.set('description', description)

    startTransition(async () => {
      const result = campaign
        ? await updateCampaign(campaign._id, formData)
        : await createCampaign(formData)

      if (result.error) {
        setError(result.error)
      } else {
        setOpen(false)
        router.refresh()
      }
    })
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>{children}</div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-6 w-6 text-primary" />
              {campaign ? 'Editar Campanha' : 'Nova Campanha'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold">
                Nome da Campanha *
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11"
                placeholder="Ex: Indicação, Cupom, Black Friday"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold">
                Descrição (opcional)
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px]"
                placeholder="Descreva a campanha..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Salvando...' : (campaign ? 'Atualizar' : 'Criar Campanha')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}


'use client'

import { useState, useTransition } from 'react'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card } from '@/components/ui/card'
import { AlertCircle, Users, Phone, MapPin, Instagram, Baby, Plus, X } from 'lucide-react'
import { createCustomer, updateCustomer } from '../actions'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { motion } from 'framer-motion'

interface Child {
  name: string
  age?: number
  size?: string
  gender?: 'masculino' | 'feminino'
}

interface CustomerFormProps {
  children: React.ReactNode
  customer?: {
    _id: string
    name: string
    phone?: string
    address?: string
    instagram?: string
    children?: Child[]
  }
}

export function CustomerForm({ children, customer }: CustomerFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(customer?.name || '')
  const [phone, setPhone] = useState(customer?.phone || '')
  const [address, setAddress] = useState(customer?.address || '')
  const [instagram, setInstagram] = useState(customer?.instagram || '')
  const [customerChildren, setCustomerChildren] = useState<Child[]>(customer?.children || [])

  React.useEffect(() => {
    if (open && customer) {
      setName(customer.name || '')
      setPhone(customer.phone || '')
      setAddress(customer.address || '')
      setInstagram(customer.instagram || '')
      setCustomerChildren(customer.children || [])
    } else if (!open && !customer) {
      setName('')
      setPhone('')
      setAddress('')
      setInstagram('')
      setCustomerChildren([])
    }
  }, [open, customer])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    const formData = new FormData()
    formData.set('name', name)
    if (phone) formData.set('phone', phone)
    if (address) formData.set('address', address)
    if (instagram) formData.set('instagram', instagram)
    formData.set('children', JSON.stringify(customerChildren))

    startTransition(async () => {
      const result = customer
        ? await updateCustomer(customer._id, formData)
        : await createCustomer(formData)

      if (result.error) {
        setError(result.error)
      } else {
        setOpen(false)
        router.refresh()
      }
    })
  }

  const addChild = () => {
    setCustomerChildren([...customerChildren, { name: '' }])
  }

  const removeChild = (index: number) => {
    setCustomerChildren(customerChildren.filter((_, i) => i !== index))
  }

  const updateChild = (index: number, field: keyof Child, value: any) => {
    const updated = [...customerChildren]
    updated[index] = { ...updated[index], [field]: value }
    setCustomerChildren(updated)
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>{children}</div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              {customer ? 'Editar Cliente' : 'Novo Cliente'}
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
                Nome do Cliente *
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-semibold flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefone
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram" className="text-sm font-semibold flex items-center gap-2">
                  <Instagram className="h-4 w-4" />
                  Instagram
                </Label>
                <Input
                  id="instagram"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@usuario"
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Endereço
              </Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Endereço completo"
                className="h-11"
              />
            </div>

            {/* Crianças */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Baby className="h-4 w-4" />
                  Crianças
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addChild}
                  className="h-8"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Adicionar Criança
                </Button>
              </div>

              {customerChildren.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhuma criança cadastrada. Clique em &quot;Adicionar Criança&quot; para adicionar.
                </p>
              )}

              {customerChildren.map((child, index) => (
                <Card key={index} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Criança {index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeChild(index)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Nome *</Label>
                    <Input
                      value={child.name}
                      onChange={(e) => updateChild(index, 'name', e.target.value)}
                      placeholder="Nome da criança"
                      required
                      className="h-10"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label className="text-xs">Idade</Label>
                      <Input
                        type="number"
                        min="0"
                        value={child.age || ''}
                        onChange={(e) => updateChild(index, 'age', e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="Idade"
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Tamanho</Label>
                      <Input
                        value={child.size || ''}
                        onChange={(e) => updateChild(index, 'size', e.target.value)}
                        placeholder="Ex: 8, 10, P"
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Gênero</Label>
                      <Select
                        value={child.gender || ''}
                        onValueChange={(value: string) => {
                          const genderValue = value === '' ? undefined : (value as 'masculino' | 'feminino')
                          updateChild(index, 'gender', genderValue)
                        }}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Não informado</SelectItem>
                          <SelectItem value="masculino">Masculino</SelectItem>
                          <SelectItem value="feminino">Feminino</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>
              ))}
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
                {isPending ? 'Salvando...' : (customer ? 'Atualizar' : 'Criar Cliente')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}


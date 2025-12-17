'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Building2, Mail, Phone, MapPin, FileText, CreditCard, Tag } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createSupplier, updateSupplier } from '../actions'
import { motion } from 'framer-motion'
import { maskPhone, maskCNPJ, unmaskPhone, unmaskCNPJ, validateCNPJ } from '@/lib/utils/masks'

interface SupplierFormProps {
  children: React.ReactNode
  supplier?: {
    _id: string
    name: string
    category?: 'geral' | 'vestuario'
    cnpj?: string
    email?: string
    phone?: string
    address?: string
    notes?: string
  }
}

export function SupplierForm({ children, supplier }: SupplierFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [phoneValue, setPhoneValue] = useState(supplier?.phone ? maskPhone(supplier.phone) : '')
  const [cnpjValue, setCnpjValue] = useState(supplier?.cnpj ? maskCNPJ(supplier.cnpj) : '')
  const [cnpjError, setCnpjError] = useState('')
  const [category, setCategory] = useState<'geral' | 'vestuario'>(supplier?.category || 'geral')

  // Atualiza os estados quando a modal abre ou quando o supplier muda
  useEffect(() => {
    if (open) {
      if (supplier) {
        // Ao abrir para editar, carrega os valores do fornecedor
        setCategory(supplier.category || 'geral')
        setPhoneValue(supplier.phone ? maskPhone(supplier.phone) : '')
        setCnpjValue(supplier.cnpj ? maskCNPJ(supplier.cnpj) : '')
      } else {
        // Ao abrir para criar novo, reseta os valores
        setCategory('geral')
        setPhoneValue('')
        setCnpjValue('')
      }
    }
  }, [open, supplier])

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskPhone(e.target.value)
    setPhoneValue(masked)
  }

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskCNPJ(e.target.value)
    setCnpjValue(masked)
    setCnpjError('')
    
    if (masked.replace(/\D/g, '').length === 14) {
      const isValid = validateCNPJ(masked)
      if (!isValid) {
        setCnpjError('CNPJ inválido')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setCnpjError('')

    // Validar CNPJ se preenchido
    if (cnpjValue && cnpjValue.replace(/\D/g, '').length === 14) {
      const isValid = validateCNPJ(cnpjValue)
      if (!isValid) {
        setCnpjError('CNPJ inválido')
        return
      }
    }

    const formData = new FormData(e.currentTarget)
    // Salvar valores sem máscara
    if (phoneValue) {
      formData.set('phone', unmaskPhone(phoneValue))
    }
    if (cnpjValue) {
      formData.set('cnpj', unmaskCNPJ(cnpjValue))
    }

    startTransition(async () => {
      const result = supplier
        ? await updateSupplier(supplier._id, formData)
        : await createSupplier(formData)

      if (result.error) {
        setError(result.error)
      } else {
        setOpen(false)
        setPhoneValue('')
        setCnpjValue('')
        setCategory('geral')
        router.refresh()
      }
    })
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>{children}</div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              {supplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Nome do Fornecedor *
                </Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={supplier?.name}
                  required
                  placeholder="Ex: Fornecedor ABC"
                  className="h-11 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-semibold flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Categoria
                </Label>
                <Select value={category} onValueChange={(v) => setCategory(v as 'geral' | 'vestuario')}>
                  <SelectTrigger className="h-11">
                    <SelectValue
                      displayValue={
                        category === 'vestuario' ? 'Vestuário' : 'Geral'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="geral">Geral</SelectItem>
                    <SelectItem value="vestuario">Vestuário</SelectItem>
                  </SelectContent>
                </Select>
                <input type="hidden" name="category" value={category} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj" className="text-sm font-semibold flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  CNPJ
                </Label>
                <Input
                  id="cnpj"
                  name="cnpj"
                  value={cnpjValue}
                  onChange={handleCNPJChange}
                  placeholder="00.000.000/0000-00"
                  className="h-11"
                  maxLength={18}
                />
                {cnpjError && (
                  <p className="text-sm text-destructive mt-1">{cnpjError}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={supplier?.email}
                    placeholder="contato@fornecedor.com"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-semibold flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefone
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={phoneValue}
                    onChange={handlePhoneChange}
                    placeholder="(11) 99999-9999"
                    className="h-11"
                    maxLength={15}
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
                  name="address"
                  defaultValue={supplier?.address}
                  placeholder="Rua, número, cidade"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Observações
                </Label>
                <Input
                  id="notes"
                  name="notes"
                  defaultValue={supplier?.notes}
                  placeholder="Informações adicionais"
                  className="h-11"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="h-11 w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending || !!cnpjError} className="h-11 w-full sm:w-auto sm:min-w-[120px]">
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <motion.div
                      className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    />
                    Salvando...
                  </span>
                ) : (
                  supplier ? 'Atualizar' : 'Criar Fornecedor'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

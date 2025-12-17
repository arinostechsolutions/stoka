'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, User, Mail, CheckCircle2, CreditCard, Building2, FileText } from 'lucide-react'
import { updateProfile } from '../actions'
import { motion } from 'framer-motion'
import { maskCNPJ, unmaskCNPJ } from '@/lib/utils/masks'

interface ProfileFormProps {
  user: {
    name: string
    email: string
    cnpj?: string
    companyName?: string
    tradeName?: string
  }
}

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [cnpj, setCnpj] = useState(user.cnpj ? maskCNPJ(user.cnpj) : '')
  const [companyName, setCompanyName] = useState(user.companyName || '')
  const [tradeName, setTradeName] = useState(user.tradeName || '')
  const [cnpjError, setCnpjError] = useState('')

  const handleCnpjChange = (value: string) => {
    const masked = maskCNPJ(value)
    setCnpj(masked)
    setCnpjError('')
    
    // Validação básica (só valida se houver algum valor)
    const unmasked = unmaskCNPJ(masked)
    if (unmasked && unmasked.length > 0 && unmasked.length !== 14) {
      setCnpjError('CNPJ deve ter 14 dígitos')
    } else {
      setCnpjError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setCnpjError('')

    const formData = new FormData()
    formData.append('name', name)
    formData.append('email', email)
    if (cnpj) formData.append('cnpj', cnpj)
    if (companyName) formData.append('companyName', companyName)
    if (tradeName) formData.append('tradeName', tradeName)

    startTransition(async () => {
      const result = await updateProfile(formData)

      if (result.error) {
        if (result.error.includes('CNPJ')) {
          setCnpjError(result.error)
        } else {
          setError(result.error)
        }
      } else {
        setSuccess('Perfil atualizado com sucesso!')
        router.refresh()
        // Limpa a mensagem de sucesso após 3 segundos
        setTimeout(() => setSuccess(''), 3000)
      }
    })
  }

    const hasChanges = 
      name !== user.name || 
      email !== user.email || 
      cnpj !== (user.cnpj ? maskCNPJ(user.cnpj) : '') ||
      companyName !== (user.companyName || '') ||
      tradeName !== (user.tradeName || '')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Perfil
        </CardTitle>
        <CardDescription>
          Atualize suas informações pessoais
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Alert className="border-green-500 bg-green-50 text-green-900">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900">{success}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Seu nome completo"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cnpj" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              CNPJ (opcional)
            </Label>
            <Input
              id="cnpj"
              type="text"
              value={cnpj}
              onChange={(e) => handleCnpjChange(e.target.value)}
              placeholder="00.000.000/0000-00"
              maxLength={18}
              className="h-11"
            />
            {cnpjError && (
              <p className="text-xs text-destructive">{cnpjError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Razão Social (opcional)
            </Label>
            <Input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Nome da empresa conforme registro"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tradeName" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Nome Fantasia (opcional)
            </Label>
            <Input
              id="tradeName"
              type="text"
              value={tradeName}
              onChange={(e) => setTradeName(e.target.value)}
              placeholder="Nome comercial da empresa"
              className="h-11"
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              disabled={isPending || !hasChanges}
              className="h-11 min-w-[120px]"
            >
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
                'Salvar Alterações'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}


'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Crown, Sparkles, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { validatePasswordStrength } from '@/lib/password-validator'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Validar formulário
  const isFormValid = useMemo(() => {
    const passwordStrength = validatePasswordStrength(password)
    return (
      name.trim().length >= 2 &&
      email.trim().length > 0 &&
      email.includes('@') &&
      passwordStrength.isValid
    )
  }, [name, email, password])
  
  // Capturar plano da URL
  const planFromUrl = searchParams.get('plan') as 'starter' | 'premium' | null
  const validPlan = planFromUrl === 'starter' || planFromUrl === 'premium' ? planFromUrl : null

  // Redirecionar para preços se não tiver plano selecionado
  useEffect(() => {
    if (!validPlan) {
      router.replace('/precos')
    }
  }, [validPlan, router])

  // Mostrar loading enquanto redireciona
  if (!validPlan) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // 1. Criar conta
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Erro na resposta:', data)
        setError(data.error || data.details || 'Erro ao criar conta')
        return
      }

      // 2. Se tem plano selecionado, fazer login e ir para checkout
      if (validPlan) {
        const signInResult = await signIn('credentials', {
          email,
          password,
          redirect: false,
        })

        if (signInResult?.ok) {
          // 3. Criar checkout session
          const checkoutResponse = await fetch('/api/stripe/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ priceType: validPlan }),
          })

          const checkoutData = await checkoutResponse.json()

          if (checkoutData.url) {
            window.location.href = checkoutData.url
            return
          }
        }
        
        // Se falhar o checkout, ir para login
        router.push('/login?registered=true')
      } else {
        // Sem plano, ir para login normal
        router.push('/login?registered=true')
      }
    } catch (err: any) {
      console.error('Erro ao criar conta:', err)
      setError(err.message || 'Erro ao criar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-lg bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-center mb-4">
          <Image
            src="/stoka-logo.png"
            alt="Stoka Logo"
            width={200}
            height={120}
            className="h-16 w-auto brightness-0 invert"
            style={{ objectFit: 'contain' }}
          />
        </div>
        <CardTitle className="text-2xl font-bold text-center text-white">Criar conta</CardTitle>
        <CardDescription className="text-center text-slate-300">
          {validPlan ? (
            'Crie sua conta para continuar'
          ) : (
            'Comece a controlar seu estoque agora'
          )}
        </CardDescription>
        
        {/* Mostrar plano selecionado */}
        {validPlan && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <Badge 
              variant="secondary" 
              className={
                validPlan === 'premium' 
                  ? 'bg-amber-100 text-amber-800 border-amber-300' 
                  : 'bg-primary/10 text-primary'
              }
            >
              {validPlan === 'premium' ? (
                <Crown className="h-3 w-3 mr-1" />
              ) : (
                <Sparkles className="h-3 w-3 mr-1" />
              )}
              Plano {validPlan === 'premium' ? 'Premium' : 'Starter'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              R$ {validPlan === 'premium' ? '79,90' : '49,90'}/mês
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive" className="bg-red-900/20 border-red-800 text-red-300">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-200">Nome</Label>
            <Input
              id="name"
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              disabled={loading}
              className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-200">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={loading}
              className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-primary"
            />
          </div>
          <PasswordInput
            id="password"
            label="Senha"
            placeholder="Crie uma senha forte"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            disabled={loading}
            showStrengthIndicator={true}
            showRequirements={true}
            className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-primary"
          />
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 disabled:opacity-50 disabled:cursor-not-allowed" 
            disabled={loading || !isFormValid}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando conta...
              </>
            ) : (
              'Começar 7 dias grátis'
            )}
          </Button>
          
          <p className="text-xs text-center text-slate-400">
            Você não será cobrado durante o período de teste.
            <br />
            Cancele a qualquer momento.
          </p>
          
          <div className="text-center text-sm text-slate-300">
            Já tem conta?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 hover:underline font-medium">
              Entrar
            </Link>
          </div>
          
          {!validPlan && (
            <div className="text-center">
              <Link href="/precos" className="text-xs text-muted-foreground hover:text-primary">
                Ver planos disponíveis →
              </Link>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <Card className="w-full max-w-lg">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    }>
      <RegisterForm />
    </Suspense>
  )
}

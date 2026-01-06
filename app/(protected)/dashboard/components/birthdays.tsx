'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Cake, Users, MessageCircle, Calendar, Crown, Lock, Loader2 } from 'lucide-react'
import { formatDate, getWhatsAppUrl, getInstagramUrl } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

async function fetchBirthdays() {
  const res = await fetch('/api/children/birthdays')
  if (!res.ok) throw new Error('Erro ao carregar aniversários')
  return res.json()
}

export function Birthdays() {
  const [isPremium, setIsPremium] = useState<boolean | null>(null)
  const [loadingPlan, setLoadingPlan] = useState(true)

  // Verificar plano do usuário
  useEffect(() => {
    async function checkPlan() {
      try {
        const res = await fetch('/api/stripe/subscription')
        if (res.ok) {
          const data = await res.json()
          setIsPremium(data.plan === 'premium')
        }
      } catch (error) {
        console.error('Erro ao verificar plano:', error)
      } finally {
        setLoadingPlan(false)
      }
    }
    checkPlan()
  }, [])

  const { data, isLoading } = useQuery({
    queryKey: ['children-birthdays'],
    queryFn: fetchBirthdays,
    enabled: isPremium === true, // Só busca se for premium
  })

  const children = data?.children || []

  const getDaysUntilBirthday = (birthday: string) => {
    const today = new Date()
    const thisYear = today.getFullYear()
    const birthdayDate = new Date(birthday)
    birthdayDate.setFullYear(thisYear)
    
    // Se o aniversário já passou este ano, considera o próximo ano
    if (birthdayDate < today) {
      birthdayDate.setFullYear(thisYear + 1)
    }
    
    const diffTime = birthdayDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Loading do plano
  if (loadingPlan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cake className="h-5 w-5 text-pink-500" />
            Aniversários do Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Se não for Premium, mostrar card de upgrade
  if (!isPremium) {
    return (
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-pink-500/10 pointer-events-none" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cake className="h-5 w-5 text-pink-500" />
            Aniversários do Mês
            <Crown className="h-4 w-4 text-amber-500 ml-auto" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-pink-500" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Funcionalidade Premium</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Acompanhe os aniversários dos filhos dos seus clientes e nunca perca uma oportunidade de venda.
            </p>
            <Button 
              asChild 
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md"
            >
              <Link href="/precos" className="gap-2">
                <Crown className="h-4 w-4" />
                Fazer Upgrade para Premium
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Se for Premium, mostrar o componente normal
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cake className="h-5 w-5 text-pink-500" />
          Aniversários do Mês
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        ) : children.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Cake className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma criança fazendo aniversário este mês</p>
          </div>
        ) : (
          <div className="space-y-3">
            {children.map((child: any) => {
              const birthday = new Date(child.birthday)
              const daysUntil = getDaysUntilBirthday(child.birthday)
              const isToday = daysUntil === 0
              const isThisWeek = daysUntil > 0 && daysUntil <= 7

              return (
                <div
                  key={child._id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isToday
                      ? 'border-pink-300 bg-pink-50'
                      : isThisWeek
                      ? 'border-pink-200 bg-pink-50/50'
                      : 'border-muted bg-muted/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Cake className={`h-5 w-5 ${isToday ? 'text-pink-600' : 'text-pink-400'}`} />
                        <h3 className="font-bold text-lg">{child.childName}</h3>
                        {isToday && (
                          <Badge className="bg-pink-500 text-white">Hoje!</Badge>
                        )}
                        {isThisWeek && !isToday && (
                          <Badge variant="secondary">Em {daysUntil} dia{daysUntil !== 1 ? 's' : ''}</Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          <span>Cliente: {child.customerName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {formatDate(birthday).split(' ')[0]} 
                            {child.age !== undefined && ` (${child.age} ano${child.age !== 1 ? 's' : ''})`}
                          </span>
                        </div>
                        {child.size && (
                          <span className="text-xs">
                            Tamanho: {Array.isArray(child.size) ? child.size.join(', ') : child.size}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {child.customerPhone && (
                          <a
                            href={getWhatsAppUrl(child.customerPhone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <MessageCircle className="h-3 w-3" />
                            WhatsApp
                          </a>
                        )}
                        {child.customerInstagram && (
                          <a
                            href={getInstagramUrl(child.customerInstagram)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            Instagram
                          </a>
                        )}
                        <Link href={`/clientes/${child.customerId}`}>
                          <Button variant="outline" size="sm" className="h-7 text-xs">
                            Ver Cliente
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

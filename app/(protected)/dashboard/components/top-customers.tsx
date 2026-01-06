'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trophy, Medal, Award, DollarSign, Loader2, MessageCircle, Crown, Lock } from 'lucide-react'
import { formatCurrency, formatPhone, getInstagramUrl, getWhatsAppUrl } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

async function fetchTopCustomers(month?: string, year?: string) {
  const params = new URLSearchParams()
  if (month) params.append('month', month)
  if (year) params.append('year', year)

  const res = await fetch(`/api/customers/top?${params.toString()}`)
  if (!res.ok) throw new Error('Erro ao carregar top clientes')
  return res.json()
}

const medals = [
  { icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  { icon: Medal, color: 'text-gray-400', bg: 'bg-gray-50', border: 'border-gray-200' },
  { icon: Award, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
]

export function TopCustomers() {
  const [isPremium, setIsPremium] = useState<boolean | null>(null)
  const [loadingPlan, setLoadingPlan] = useState(true)

  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'))
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()))

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

  // Gera lista de meses
  const months = Array.from({ length: 12 }, (_, i) => {
    const monthNum = i + 1
    const date = new Date(2000, i, 1)
    return {
      value: String(monthNum).padStart(2, '0'),
      label: date.toLocaleDateString('pt-BR', { month: 'long' }),
    }
  })

  // Gera lista de anos (últimos 3 anos + ano atual)
  const currentYear = now.getFullYear()
  const years = Array.from({ length: 4 }, (_, i) => currentYear - i)

  const { data, isLoading } = useQuery({
    queryKey: ['top-customers', selectedMonth, selectedYear],
    queryFn: () => fetchTopCustomers(selectedMonth, selectedYear),
    enabled: isPremium === true, // Só busca se for premium
  })

  const topCustomers = data?.topCustomers || []

  // Loading do plano
  if (loadingPlan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top 3 Clientes do Mês
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
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-amber-500/10 pointer-events-none" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top 3 Clientes do Mês
            <Crown className="h-4 w-4 text-amber-500 ml-auto" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-amber-500" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Funcionalidade Premium</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Veja quem são seus melhores clientes do mês e acompanhe o ranking de vendas.
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
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top 3 Clientes do Mês
          </CardTitle>
          <div className="flex gap-2">
            <Select
              value={selectedMonth}
              onValueChange={setSelectedMonth}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label.charAt(0).toUpperCase() + month.label.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedYear}
              onValueChange={setSelectedYear}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        ) : topCustomers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum cliente com compras neste período</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topCustomers.map((customer: any, index: number) => {
              const MedalIcon = medals[index].icon
              return (
                <div
                  key={customer._id}
                  className={`p-4 rounded-lg border-2 ${medals[index].border} ${medals[index].bg} transition-all hover:shadow-md`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`${medals[index].color} mt-1`}>
                        <MedalIcon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg">{customer.name}</h3>
                          <span className="text-xs text-muted-foreground bg-white px-2 py-0.5 rounded-full">
                            #{index + 1}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {customer.phone && (
                            <a
                              href={getWhatsAppUrl(customer.phone)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                            >
                              <MessageCircle className="h-3 w-3" />
                              <span>{formatPhone(customer.phone)}</span>
                            </a>
                          )}
                          {customer.instagram && (
                            <a
                              href={getInstagramUrl(customer.instagram)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                            >
                              <span>@{customer.instagram}</span>
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <DollarSign className={`h-4 w-4 ${medals[index].color}`} />
                          <span className="text-xl font-bold text-primary">
                            {formatCurrency(customer.totalSpent)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Link href={`/clientes/${customer._id}`}>
                      <Button variant="outline" size="sm">
                        Ver Cliente
                      </Button>
                    </Link>
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

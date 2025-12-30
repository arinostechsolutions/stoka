'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Clock, 
  Smartphone, 
  Monitor, 
  Tablet, 
  ShoppingCart, 
  Eye, 
  MessageCircle,
  TrendingUp,
  Filter as FilterIcon
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'

interface AnalyticsData {
  _id: string
  storeId: string
  sessionId: string
  deviceType: 'mobile' | 'desktop' | 'tablet'
  startTime: string
  endTime?: string
  timeOnPage?: number
  pageViews: number
  productsViewed: string[]
  productsSelected: string[]
  whatsappClicks: number
  filtersUsed: {
    size?: string
    genero?: string
  }
  imagesExpanded: string[]
  createdAt: string
}

interface StoreAnalyticsViewProps {
  storeId: string
}

interface Product {
  _id: string
  name: string
  nome_vitrine?: string
  imageUrl?: string
  size?: string
}

export function StoreAnalyticsView({ storeId }: StoreAnalyticsViewProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([])
  const [products, setProducts] = useState<Record<string, Product>>({})
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'7' | '30' | '90' | 'all'>('30')
  const [productsLimit, setProductsLimit] = useState<string>('5')

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true)
        const response = await fetch(`/api/store-analytics?storeId=${storeId}`)
        if (response.ok) {
          const data = await response.json()
          setAnalytics(data)
        }
      } catch (error) {
        console.error('Erro ao buscar analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [storeId])

  // Busca produtos quando analytics mudar
  useEffect(() => {
    async function fetchProducts() {
      if (analytics.length === 0) return

      // Coleta todos os IDs únicos de produtos
      const productIds = new Set<string>()
      analytics.forEach((item) => {
        item.productsViewed.forEach((id) => productIds.add(id))
        item.productsSelected.forEach((id) => productIds.add(id))
      })

      if (productIds.size === 0) return

      try {
        // Busca produtos pela API
        const response = await fetch('/api/products')
        if (response.ok) {
          const allProducts = await response.json()
          // Filtra apenas os produtos que estão nos analytics
          const productsMap: Record<string, Product> = {}
          allProducts.forEach((product: Product) => {
            if (productIds.has(product._id)) {
              productsMap[product._id] = product
            }
          })
          setProducts(productsMap)
        }
      } catch (error) {
        console.error('Erro ao buscar produtos:', error)
      }
    }

    fetchProducts()
  }, [analytics])

  // Filtra por período
  const filteredAnalytics = useMemo(() => {
    if (period === 'all') return analytics

    const days = parseInt(period)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    return analytics.filter((item) => {
      const itemDate = new Date(item.createdAt)
      return itemDate >= cutoffDate
    })
  }, [analytics, period])

  // Calcula estatísticas
  const stats = useMemo(() => {
    const totalSessions = filteredAnalytics.length
    const totalPageViews = filteredAnalytics.reduce((sum, item) => sum + item.pageViews, 0)
    const totalWhatsAppClicks = filteredAnalytics.reduce((sum, item) => sum + item.whatsappClicks, 0)
    
    // Tempo médio na página
    const sessionsWithTime = filteredAnalytics.filter((item) => item.timeOnPage !== undefined && item.timeOnPage > 0)
    const avgTimeOnPage = sessionsWithTime.length > 0
      ? Math.round(sessionsWithTime.reduce((sum, item) => sum + (item.timeOnPage || 0), 0) / sessionsWithTime.length)
      : 0

    // Dispositivos
    const deviceCounts = filteredAnalytics.reduce((acc, item) => {
      acc[item.deviceType] = (acc[item.deviceType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Produtos mais visualizados
    const productViews: Record<string, number> = {}
    filteredAnalytics.forEach((item) => {
      item.productsViewed.forEach((productId) => {
        productViews[productId] = (productViews[productId] || 0) + 1
      })
    })
    const limit = productsLimit === 'all' ? Infinity : parseInt(productsLimit)
    const topViewedProducts = Object.entries(productViews)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([productId, count]) => ({ 
        productId, 
        count,
        product: products[productId]
      }))

    // Produtos mais selecionados
    const productSelections: Record<string, number> = {}
    filteredAnalytics.forEach((item) => {
      item.productsSelected.forEach((productId) => {
        productSelections[productId] = (productSelections[productId] || 0) + 1
      })
    })
    const topSelectedProducts = Object.entries(productSelections)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([productId, count]) => ({ 
        productId, 
        count,
        product: products[productId]
      }))

    // Taxa de conversão (cliques no WhatsApp / sessões)
    const conversionRate = totalSessions > 0
      ? ((totalWhatsAppClicks / totalSessions) * 100).toFixed(1)
      : '0.0'

    return {
      totalSessions,
      totalPageViews,
      totalWhatsAppClicks,
      avgTimeOnPage,
      deviceCounts,
      topViewedProducts,
      topSelectedProducts,
      conversionRate,
    }
  }, [filteredAnalytics, products, productsLimit])

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Carregando métricas...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics da Loja</h1>
          <p className="text-muted-foreground mt-2">
            Métricas de acesso e comportamento dos visitantes
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="period" className="text-sm">Período:</Label>
            <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
              <SelectTrigger id="period" className="w-40">
                <SelectValue 
                  displayValue={
                    period === '7' ? 'Últimos 7 dias' :
                    period === '30' ? 'Últimos 30 dias' :
                    period === '90' ? 'Últimos 90 dias' :
                    'Todo o período'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="all">Todo o período</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="productsLimit" className="text-sm">Quantidade:</Label>
            <Select value={productsLimit} onValueChange={(value: any) => setProductsLimit(value)}>
              <SelectTrigger id="productsLimit" className="w-32">
                <SelectValue 
                  displayValue={
                    productsLimit === '5' ? 'Top 5' :
                    productsLimit === '10' ? 'Top 10' :
                    productsLimit === '15' ? 'Top 15' :
                    productsLimit === '20' ? 'Top 20' :
                    'Todos'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">Top 5</SelectItem>
                <SelectItem value="10">Top 10</SelectItem>
                <SelectItem value="15">Top 15</SelectItem>
                <SelectItem value="20">Top 20</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Cards de Estatísticas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Visitas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSessions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Visitas da vitrine online
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(stats.avgTimeOnPage)}</div>
            <p className="text-xs text-muted-foreground">
              Tempo médio na página
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cliques no WhatsApp</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWhatsAppClicks}</div>
            <p className="text-xs text-muted-foreground">
              Taxa de conversão: {stats.conversionRate}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Cliques / Visitas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dispositivos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Dispositivos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Mobile</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.deviceCounts.mobile || 0} visitas
                  </p>
                </div>
              </div>
              <div className="text-2xl font-bold">
                {stats.totalSessions > 0
                  ? Math.round(((stats.deviceCounts.mobile || 0) / stats.totalSessions) * 100)
                  : 0}%
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Monitor className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Desktop</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.deviceCounts.desktop || 0} visitas
                  </p>
                </div>
              </div>
              <div className="text-2xl font-bold">
                {stats.totalSessions > 0
                  ? Math.round(((stats.deviceCounts.desktop || 0) / stats.totalSessions) * 100)
                  : 0}%
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Tablet className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Tablet</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.deviceCounts.tablet || 0} visitas
                  </p>
                </div>
              </div>
              <div className="text-2xl font-bold">
                {stats.totalSessions > 0
                  ? Math.round(((stats.deviceCounts.tablet || 0) / stats.totalSessions) * 100)
                  : 0}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Produtos Mais Visualizados e Selecionados */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Produtos Mais Visualizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topViewedProducts.length > 0 ? (
              <div className="space-y-3">
                {stats.topViewedProducts.map((item, index) => {
                  const product = item.product
                  const displayName = product?.nome_vitrine || product?.name || `Produto ${item.productId.slice(-6)}`
                  
                  return (
                    <div key={item.productId} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold shrink-0">
                        {index + 1}
                      </div>
                      {product?.imageUrl && (
                        <div className="relative w-12 h-12 rounded-md overflow-hidden border bg-muted shrink-0">
                          <Image
                            src={product.imageUrl}
                            alt={displayName}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-1">{displayName}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {product?.size && (
                            <span className="text-xs text-muted-foreground">
                              Tamanho: {product.size}
                            </span>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {item.count} visualizações
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum produto visualizado ainda
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Produtos Mais Selecionados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topSelectedProducts.length > 0 ? (
              <div className="space-y-3">
                {stats.topSelectedProducts.map((item, index) => {
                  const product = item.product
                  const displayName = product?.nome_vitrine || product?.name || `Produto ${item.productId.slice(-6)}`
                  
                  return (
                    <div key={item.productId} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold shrink-0">
                        {index + 1}
                      </div>
                      {product?.imageUrl && (
                        <div className="relative w-12 h-12 rounded-md overflow-hidden border bg-muted shrink-0">
                          <Image
                            src={product.imageUrl}
                            alt={displayName}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-1">{displayName}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {product?.size && (
                            <span className="text-xs text-muted-foreground">
                              Tamanho: {product.size}
                            </span>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {item.count} seleções
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum produto selecionado ainda
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {filteredAnalytics.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Nenhum dado de analytics disponível para o período selecionado
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DollarSign, TrendingUp, Package, Calendar, Building2, Filter } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

async function fetchReports(
  startDate?: string,
  endDate?: string,
  supplierId?: string,
  productId?: string
) {
  const params = new URLSearchParams()
  if (startDate) params.append('startDate', startDate)
  if (endDate) params.append('endDate', endDate)
  if (supplierId && supplierId !== 'all') params.append('supplierId', supplierId)
  if (productId && productId !== 'all') params.append('productId', productId)

  const res = await fetch(`/api/reports?${params.toString()}`)
  if (!res.ok) throw new Error('Erro ao carregar relatórios')
  return res.json()
}

async function fetchSuppliers() {
  const res = await fetch('/api/suppliers')
  if (!res.ok) throw new Error('Erro ao carregar fornecedores')
  return res.json()
}

async function fetchProducts() {
  const res = await fetch('/api/products')
  if (!res.ok) throw new Error('Erro ao carregar produtos')
  return res.json()
}

export function ReportsContent() {
  // Inicializa com período de 90 dias para garantir que capture movimentações
  const defaultStartDate = new Date(new Date().setDate(new Date().getDate() - 90))
    .toISOString()
    .split('T')[0]
  const defaultEndDate = new Date().toISOString().split('T')[0]

  const [startDate, setStartDate] = useState(defaultStartDate)
  const [endDate, setEndDate] = useState(defaultEndDate)
  const [selectedSupplier, setSelectedSupplier] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState('all')
  const [filters, setFilters] = useState({
    startDate: defaultStartDate,
    endDate: defaultEndDate,
    supplierId: 'all',
    productId: 'all',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['reports', filters],
    queryFn: () =>
      fetchReports(filters.startDate, filters.endDate, filters.supplierId, filters.productId),
  })

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: fetchSuppliers,
  })

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  })

  // Aplica os filtros automaticamente no primeiro carregamento
  useEffect(() => {
    if (filters.startDate === defaultStartDate && filters.endDate === defaultEndDate) {
      // Já está inicializado, não precisa fazer nada
      return
    }
  }, [filters, defaultStartDate, defaultEndDate])

  const handleApplyFilter = () => {
    setFilters({
      startDate,
      endDate,
      supplierId: selectedSupplier,
      productId: selectedProduct,
    })
  }

  const handleResetFilter = () => {
    const resetStartDate = new Date(new Date().setDate(new Date().getDate() - 90))
      .toISOString()
      .split('T')[0]
    const resetEndDate = new Date().toISOString().split('T')[0]

    setStartDate(resetStartDate)
    setEndDate(resetEndDate)
    setSelectedSupplier('all')
    setSelectedProduct('all')
    setFilters({
      startDate: resetStartDate,
      endDate: resetEndDate,
      supplierId: 'all',
      productId: 'all',
    })
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 w-32 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const {
    totalSpent = 0,
    totalRevenue = 0,
    totalStockValue = 0,
    dailyMovements = [],
    topProducts = [],
  } = data || {}

  // Formata a data para exibição (DD/MM)
  const formatDateForChart = (dateStr: string) => {
    if (!dateStr) return ''
    const [year, month, day] = dateStr.split('-')
    if (!day || !month) return dateStr
    return `${day}/${month}`
  }

  const formattedDailyMovements = (dailyMovements || []).map((item: any) => ({
    ...item,
    date: item._id ? formatDateForChart(item._id) : '',
    entradas: item.entradas || 0,
    saidas: item.saidas || 0,
    gastos: item.gastos || 0,
    receitas: item.receitas || 0,
  }))

  // Calcula totais a partir dos dados do gráfico (que já estão corretos)
  const calculatedTotalSpent = formattedDailyMovements.reduce((sum: number, item: any) => sum + (item.gastos || 0), 0)
  const calculatedTotalRevenue = formattedDailyMovements.reduce((sum: number, item: any) => sum + (item.receitas || 0), 0)
  
  // Usa os valores calculados do gráfico se os da API estiverem zerados ou se o gráfico tiver dados
  const displayTotalSpent = calculatedTotalSpent > 0 ? calculatedTotalSpent : totalSpent
  const displayTotalRevenue = calculatedTotalRevenue > 0 ? calculatedTotalRevenue : totalRevenue

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">Fornecedor</Label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger id="supplier">
                  <SelectValue
                    placeholder="Todos os fornecedores"
                    displayValue={
                      selectedSupplier === 'all'
                        ? 'Todos os fornecedores'
                        : suppliers.find((s: any) => s._id === selectedSupplier)?.name || ''
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os fornecedores</SelectItem>
                  {suppliers.map((supplier: any) => (
                    <SelectItem key={supplier._id} value={supplier._id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product">Produto</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger id="product">
                  <SelectValue
                    placeholder="Todos os produtos"
                    displayValue={
                      selectedProduct === 'all'
                        ? 'Todos os produtos'
                        : products.find((p: any) => p._id === selectedProduct)?.name || ''
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os produtos</SelectItem>
                  {products.map((product: any) => (
                    <SelectItem key={product._id} value={product._id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleApplyFilter}>Aplicar Filtros</Button>
            <Button variant="outline" onClick={handleResetFilter}>
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gasto</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(displayTotalSpent)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              No período selecionado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Receita</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(displayTotalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              No período selecionado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor do Estoque</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalStockValue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Valor total em estoque
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de movimentações diárias */}
      <Card>
        <CardHeader>
          <CardTitle>Movimentações Diárias</CardTitle>
        </CardHeader>
        <CardContent>
          {formattedDailyMovements.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={formattedDailyMovements}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="entradas"
                  stroke="#22c55e"
                  name="Entradas"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="saidas"
                  stroke="#ef4444"
                  name="Saídas"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="text-lg font-medium mb-2">Nenhuma movimentação encontrada</p>
                <p className="text-sm">Tente ajustar o período de datas ou os filtros</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráfico de gastos e receitas diários */}
      {formattedDailyMovements.some((d: any) => d.gastos > 0 || d.receitas > 0) ? (
        <Card>
          <CardHeader>
            <CardTitle>Gastos e Receitas Diários</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={formattedDailyMovements}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: number | undefined) => formatCurrency(value || 0)} />
                <Legend />
                <Bar dataKey="gastos" fill="#ef4444" name="Gastos" />
                <Bar dataKey="receitas" fill="#10b981" name="Receitas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : null}

      {/* Top produtos por valor */}
      {topProducts.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Produtos por Valor em Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip formatter={(value: number | undefined) => formatCurrency(value || 0)} />
                <Legend />
                <Bar dataKey="value" fill="#3b82f6" name="Valor" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

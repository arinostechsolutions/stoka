import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, DollarSign, TrendingUp, Package } from 'lucide-react'
import { ReportsContent } from './components/reports-content'

export default async function RelatoriosPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="h-8 w-8" />
          Relatórios
        </h1>
        <p className="text-muted-foreground mt-2">
          Análise de gastos, receitas e estoque
        </p>
      </div>

      <ReportsContent />
    </div>
  )
}


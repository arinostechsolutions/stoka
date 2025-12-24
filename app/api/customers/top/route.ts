import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Movement from '@/lib/models/Movement'
import Customer from '@/lib/models/Customer'
import mongoose from 'mongoose'

// Força renderização dinâmica
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // Formato: YYYY-MM
    const year = searchParams.get('year') // Formato: YYYY

    try {
      await connectDB()
    } catch (dbError: any) {
      console.error('Erro ao conectar com o banco de dados:', dbError.message)
      return NextResponse.json(
        { error: 'Erro ao conectar com o banco de dados. Tente novamente em alguns instantes.' },
        { status: 503 }
      )
    }

    // Calcula o período do mês
    let startDate: Date
    let endDate: Date

    if (month && year) {
      // Mês específico
      startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999)
    } else {
      // Mês atual por padrão
      const now = new Date()
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    }

    // Busca todas as movimentações de saída e entrada (pagamentos de parcelas e entradas) com cliente associado no período
    const movements = await Movement.find({
      userId: session.user.id as any,
      customerId: { $exists: true, $ne: null },
      $or: [
        { type: 'saida' },
        { 
          type: 'entrada', 
          $or: [
            { notes: { $regex: /Pagamento de parcela/i } }, // Pagamentos de parcelas
            { notes: { $regex: /Entrada.*Venda parcelada/i } } // Entradas de vendas parceladas
          ]
        }
      ],
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    })
      .select('customerId totalRevenue type notes')
      .lean()

    // Agrupa por cliente e soma o totalRevenue
    const customerTotals: Record<string, number> = {}
    
    movements.forEach((movement: any) => {
      if (movement.customerId && movement.totalRevenue) {
        const customerId = movement.customerId.toString()
        customerTotals[customerId] = (customerTotals[customerId] || 0) + (movement.totalRevenue || 0)
      }
    })

    // Busca informações dos clientes
    const customerIds = Object.keys(customerTotals)
    if (customerIds.length === 0) {
      return NextResponse.json({ topCustomers: [] })
    }

    const customers = await Customer.find({
      _id: { $in: customerIds.map(id => new mongoose.Types.ObjectId(id)) },
      userId: session.user.id as any,
    })
      .select('_id name phone instagram')
      .lean()

    // Combina dados e ordena por valor total
    const topCustomers = customers
      .map((customer: any) => ({
        _id: customer._id.toString(),
        name: customer.name,
        phone: customer.phone,
        instagram: customer.instagram,
        totalSpent: customerTotals[customer._id.toString()] || 0,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 3) // Top 3

    // Serializa para JSON simples
    const serializedTopCustomers = JSON.parse(JSON.stringify(topCustomers))

    return NextResponse.json({ topCustomers: serializedTopCustomers })
  } catch (error) {
    console.error('Erro ao buscar top clientes:', error)
    return NextResponse.json(
      { error: 'Erro ao carregar top clientes' },
      { status: 500 }
    )
  }
}


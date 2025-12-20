import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Movement from '@/lib/models/Movement'
import Product from '@/lib/models/Product'
import Supplier from '@/lib/models/Supplier'
import mongoose from 'mongoose'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') // Formato: YYYY-MM-DD
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const supplierId = searchParams.get('supplierId')
    const productId = searchParams.get('productId')

    await connectDB()

    // Converte userId para ObjectId (formato usado no banco)
    let userIdFilter: any
    try {
      userIdFilter = new mongoose.Types.ObjectId(session.user.id as string)
    } catch {
      userIdFilter = session.user.id as any
    }

    // Define o range de datas
    let dateFilter: any = {}
    if (date) {
      const start = new Date(date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(date)
      end.setHours(23, 59, 59, 999)
      dateFilter = { createdAt: { $gte: start, $lte: end } }
    } else if (startDate && endDate) {
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      dateFilter = { createdAt: { $gte: start, $lte: end } }
    }

    // Filtros adicionais
    let additionalFilters: any = { userId: userIdFilter }
    if (supplierId && supplierId !== 'all') {
      try {
        additionalFilters.supplierId = new mongoose.Types.ObjectId(supplierId)
      } catch {
        additionalFilters.supplierId = supplierId
      }
    }
    if (productId && productId !== 'all') {
      try {
        additionalFilters.productId = new mongoose.Types.ObjectId(productId)
      } catch {
        additionalFilters.productId = productId
      }
    }

    // Gastos totais (entradas)
    // Usa totalPrice da movimentação se existir, senão usa purchasePrice do produto * quantity
    const totalSpentMatch: any = {
      ...additionalFilters,
      type: 'entrada',
    }
    
    // Adiciona filtro de data se existir
    if (dateFilter.createdAt) {
      totalSpentMatch.createdAt = dateFilter.createdAt
    }

    // Busca todas as entradas com populate do produto para pegar purchasePrice
    const entradaMovements = await Movement.find(totalSpentMatch)
      .populate('productId', 'purchasePrice')
      .lean()

    let totalSpent = 0
    entradaMovements.forEach((movement: any) => {
      if (movement.totalPrice && movement.totalPrice > 0) {
        // Se tem totalPrice na movimentação, usa ele
        totalSpent += movement.totalPrice
      } else if (movement.productId?.purchasePrice && movement.quantity) {
        // Se não tem totalPrice, usa purchasePrice do produto * quantity
        totalSpent += movement.productId.purchasePrice * movement.quantity
      }
    })

    // Receitas totais (saídas com preço de venda do produto)
    const revenueMatch: any = {
      ...additionalFilters,
      type: 'saida',
    }
    
    // Adiciona filtro de data se existir
    if (dateFilter.createdAt) {
      revenueMatch.createdAt = dateFilter.createdAt
    }

    const saidaMovements = await Movement.find(revenueMatch).lean()

    let totalRevenue = 0
    saidaMovements.forEach((movement: any) => {
      if (movement.totalRevenue && movement.totalRevenue > 0) {
        // Usa totalRevenue da movimentação (já tem desconto aplicado)
        totalRevenue += movement.totalRevenue
      } else if (movement.salePrice && movement.quantity) {
        // Fallback: calcula baseado no salePrice da movimentação
        let subtotal = movement.salePrice * movement.quantity
        let discount = 0
        
        if (movement.discountType && movement.discountValue !== undefined) {
          if (movement.discountType === 'percent') {
            discount = subtotal * (movement.discountValue / 100)
          } else {
            discount = movement.discountValue
          }
        }
        
        totalRevenue += Math.max(0, subtotal - discount)
      }
    })

    // Valor total do estoque (soma de purchasePrice * quantity de todos os produtos)
    let stockFilter: any = { userId: userIdFilter }
    if (productId && productId !== 'all') {
      try {
        stockFilter._id = new mongoose.Types.ObjectId(productId)
      } catch {
        stockFilter._id = productId
      }
    }
    if (supplierId && supplierId !== 'all') {
      try {
        stockFilter.supplierId = new mongoose.Types.ObjectId(supplierId)
      } catch {
        stockFilter.supplierId = supplierId
      }
    }

    const products = await Product.find(stockFilter).lean()
    let totalStockValue = 0
    products.forEach((product: any) => {
      if (product.purchasePrice && product.quantity) {
        totalStockValue += product.purchasePrice * product.quantity
      }
    })

    // Movimentações por dia (últimos 90 dias ou período selecionado)
    let dateRangeStart: Date
    let dateRangeEnd: Date
    
    if (startDate && endDate) {
      // Período específico selecionado
      dateRangeStart = new Date(startDate + 'T00:00:00.000Z')
      dateRangeEnd = new Date(endDate + 'T23:59:59.999Z')
    } else if (dateFilter.createdAt) {
      // Filtro de data única
      dateRangeStart = dateFilter.createdAt.$gte
      dateRangeEnd = dateFilter.createdAt.$lte
    } else {
      // Padrão: últimos 90 dias
      dateRangeStart = new Date()
      dateRangeStart.setUTCDate(dateRangeStart.getUTCDate() - 90)
      dateRangeStart.setUTCHours(0, 0, 0, 0)
      dateRangeEnd = new Date()
      dateRangeEnd.setUTCHours(23, 59, 59, 999)
    }

    const dailyMovementsMatch: any = {
      userId: userIdFilter, // ObjectId
      createdAt: { $gte: dateRangeStart, $lte: dateRangeEnd },
    }

    // Adiciona filtros opcionais
    if (supplierId && supplierId !== 'all') {
      try {
        dailyMovementsMatch.supplierId = new mongoose.Types.ObjectId(supplierId)
      } catch {
        dailyMovementsMatch.supplierId = supplierId
      }
    }
    if (productId && productId !== 'all') {
      try {
        dailyMovementsMatch.productId = new mongoose.Types.ObjectId(productId)
      } catch {
        dailyMovementsMatch.productId = productId
      }
    }

    // Debug: verificar se há movimentações
    const allMovementsCount = await Movement.countDocuments({ userId: userIdFilter })
    const totalMovements = await Movement.countDocuments(dailyMovementsMatch)
    
    // Primeiro, vamos testar a agregação sem o $dateToString para ver se funciona
    const testAggregation = await Movement.aggregate([
      { $match: dailyMovementsMatch },
      { $limit: 5 },
    ])

    const dailyMovements = await Movement.aggregate([
      { $match: dailyMovementsMatch },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
            },
          },
          entradas: {
            $sum: {
              $cond: [{ $eq: ['$type', 'entrada'] }, '$quantity', 0],
            },
          },
          saidas: {
            $sum: {
              $cond: [{ $eq: ['$type', 'saida'] }, '$quantity', 0],
            },
          },
          gastos: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$type', 'entrada'] },
                    { $ne: ['$totalPrice', null] },
                    { $gt: ['$totalPrice', 0] },
                  ],
                },
                '$totalPrice',
                0,
              ],
            },
          },
          receitas: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$type', 'saida'] },
                    { $ne: ['$totalRevenue', null] },
                    { $gt: ['$totalRevenue', 0] },
                  ],
                },
                '$totalRevenue',
                0,
              ],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ])

    // Top produtos por valor
    const topProductsFilter: any = { userId: userIdFilter }
    if (productId && productId !== 'all') {
      try {
        topProductsFilter._id = new mongoose.Types.ObjectId(productId)
      } catch {
        topProductsFilter._id = productId
      }
    }

    const topProducts = await Product.find(topProductsFilter)
      .sort({ quantity: -1 })
      .limit(10)
      .lean()

    const topProductsWithValue = topProducts.map((product: any) => ({
      name: product.name,
      quantity: product.quantity || 0,
      value: product.purchasePrice && product.quantity 
        ? product.purchasePrice * product.quantity 
        : 0,
    }))

    return NextResponse.json({
      totalSpent,
      totalRevenue,
      totalStockValue,
      dailyMovements,
      topProducts: topProductsWithValue,
    })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { error: 'Erro ao carregar relatórios', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

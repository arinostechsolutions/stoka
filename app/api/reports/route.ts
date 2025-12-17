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

    // Gastos totais (entradas com totalPrice)
    // Se não há filtro de data, busca todas as entradas
    const totalSpentMatch: any = {
      ...additionalFilters,
      type: 'entrada',
    }
    
    // Adiciona filtro de data se existir
    if (dateFilter.createdAt) {
      totalSpentMatch.createdAt = dateFilter.createdAt
    }

    // Debug: verificar movimentações de entrada
    const testEntradas = await Movement.find(totalSpentMatch).limit(10).lean()
    console.log('=== DEBUG TOTAL GASTO ===')
    console.log('TotalSpentMatch:', JSON.stringify(totalSpentMatch, null, 2))
    console.log('Entradas encontradas (total):', await Movement.countDocuments(totalSpentMatch))
    console.log('Amostra de entradas:', testEntradas.map((m: any) => ({
      id: m._id,
      type: m.type,
      quantity: m.quantity,
      price: m.price,
      totalPrice: m.totalPrice,
      hasTotalPrice: m.totalPrice !== null && m.totalPrice !== undefined,
      createdAt: m.createdAt,
    })))

    // Busca todas as entradas e soma os totalPrice que existem e são > 0
    const totalSpentResult = await Movement.aggregate([
      { $match: totalSpentMatch },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ['$totalPrice', null] }, { $ne: ['$totalPrice', undefined] }, { $gt: ['$totalPrice', 0] }] },
                '$totalPrice',
                0,
              ],
            },
          },
        },
      },
    ])
    
    console.log('TotalSpentResult:', totalSpentResult)
    const totalSpent = totalSpentResult[0]?.total || 0
    console.log('Total Gasto calculado:', totalSpent)

    // Receitas totais (saídas com preço de venda do produto)
    const revenueMatch: any = {
      ...additionalFilters,
      type: 'saida',
      ...dateFilter,
    }

    const movements = await Movement.find(revenueMatch)
      .populate('productId', 'salePrice')
      .lean()

    let totalRevenue = 0
    movements.forEach((movement: any) => {
      if (movement.productId?.salePrice && movement.quantity) {
        totalRevenue += movement.productId.salePrice * movement.quantity
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
    
    console.log('=== DEBUG RELATÓRIOS ===')
    console.log('UserId:', session.user.id)
    console.log('UserIdFilter (ObjectId):', userIdFilter)
    console.log('Total movements for user (no date filter):', allMovementsCount)
    console.log('Total movements found (with date filter):', totalMovements)
    console.log('Date range:', dateRangeStart, 'to', dateRangeEnd)
    
    // Primeiro, vamos testar a agregação sem o $dateToString para ver se funciona
    const testAggregation = await Movement.aggregate([
      { $match: dailyMovementsMatch },
      { $limit: 5 },
    ])
    console.log('Test aggregation (first 5):', testAggregation.map((m: any) => ({
      type: m.type,
      quantity: m.quantity,
      createdAt: m.createdAt,
      createdAtType: typeof m.createdAt,
    })))

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
        },
      },
      { $sort: { _id: 1 } },
    ])

    console.log('Daily movements grouped:', dailyMovements.length)
    console.log('Daily movements result:', JSON.stringify(dailyMovements, null, 2))

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

    const finalTotalSpent = totalSpentResult[0]?.total || 0
    
    return NextResponse.json({
      totalSpent: finalTotalSpent,
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

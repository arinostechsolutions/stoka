import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Movement from '@/lib/models/Movement'
import Product from '@/lib/models/Product'
import Supplier from '@/lib/models/Supplier'
import mongoose from 'mongoose'

// Força renderização dinâmica pois usa getServerSession que depende de headers
export const dynamic = 'force-dynamic'

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

    // ========== CÁLCULO DE GASTOS (ENTRADAS) NO PERÍODO ==========
    const totalSpentMatch: any = {
      ...additionalFilters,
      type: 'entrada', // Apenas entradas, não ajustes
    }
    
    if (dateFilter.createdAt) {
      totalSpentMatch.createdAt = dateFilter.createdAt
    }

    const entradaMovements = await Movement.find(totalSpentMatch)
      .populate('productId', 'purchasePrice name')
      .lean()

    let totalSpent = 0
    let entradaCount = 0
    entradaMovements.forEach((movement: any) => {
      entradaCount++
      if (movement.totalPrice && movement.totalPrice > 0) {
        // PRIORIDADE 1: Usa totalPrice da movimentação (mais confiável)
        totalSpent += movement.totalPrice
      } else if (movement.price && movement.quantity) {
        // PRIORIDADE 2: Usa price da movimentação × quantity
        totalSpent += movement.price * movement.quantity
      } else if (movement.productId?.purchasePrice && movement.quantity) {
        // PRIORIDADE 3: Fallback para purchasePrice atual do produto
        totalSpent += movement.productId.purchasePrice * movement.quantity
      }
      // Se não tiver nenhum preço, não conta (produto sem valor)
    })

    // ========== CÁLCULO DE RECEITAS E CUSTO DAS VENDAS ==========
    const revenueMatch: any = {
      ...additionalFilters,
      type: 'saida',
    }
    
    if (dateFilter.createdAt) {
      revenueMatch.createdAt = dateFilter.createdAt
    }

    // Busca TODAS as entradas (sem filtro de data) para calcular custo real das vendas
    const allEntradaMovements = await Movement.find({
      ...additionalFilters,
      type: 'entrada',
    })
      .populate('productId', 'purchasePrice name')
      .sort({ createdAt: 1 }) // Ordena por data (FIFO aproximado)
      .lean()

    // Cria um mapa de histórico de entradas por produto (para calcular custo real)
    const productEntryHistory: Record<string, Array<{
      quantity: number
      unitPrice: number
      totalPrice: number
      createdAt: Date
    }>> = {}

    allEntradaMovements.forEach((movement: any) => {
      const prodId = movement.productId?._id?.toString() || movement.productId?.toString()
      if (!prodId) return

      const unitPrice = movement.price || 
                       (movement.totalPrice && movement.quantity ? movement.totalPrice / movement.quantity : null) ||
                       movement.productId?.purchasePrice || 
                       0

      if (unitPrice <= 0) return // Ignora entradas sem preço válido

      if (!productEntryHistory[prodId]) {
        productEntryHistory[prodId] = []
      }

      productEntryHistory[prodId].push({
        quantity: movement.quantity,
        unitPrice,
        totalPrice: movement.totalPrice || (unitPrice * movement.quantity),
        createdAt: movement.createdAt,
      })
    })

    const saidaMovements = await Movement.find(revenueMatch)
      .populate('productId', 'purchasePrice name size')
      .lean()

    let totalRevenue = 0
    let totalSalesCost = 0 // Custo real das vendas baseado em preços históricos
    let salesWithoutCost = 0 // Quantidade vendida sem custo calculável
    let salesCount = 0

    saidaMovements.forEach((movement: any) => {
      salesCount++
      // Calcula receita
      if (movement.totalRevenue && movement.totalRevenue > 0) {
        totalRevenue += movement.totalRevenue
      } else if (movement.salePrice && movement.quantity) {
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

      // Calcula custo REAL das vendas usando histórico de entradas (FIFO simplificado)
      const prodId = movement.productId?._id?.toString() || movement.productId?.toString()
      const saleQuantity = movement.quantity
      
      if (prodId && productEntryHistory[prodId] && productEntryHistory[prodId].length > 0) {
        // Usa FIFO: as unidades vendidas foram compradas nas entradas mais antigas
        let remainingToAllocate = saleQuantity
        let costForThisSale = 0
        
        for (const entry of productEntryHistory[prodId]) {
          if (remainingToAllocate <= 0) break
          
          const quantityToUse = Math.min(remainingToAllocate, entry.quantity)
          costForThisSale += quantityToUse * entry.unitPrice
          remainingToAllocate -= quantityToUse
        }
        
        if (costForThisSale > 0) {
          totalSalesCost += costForThisSale
        } else {
          // Fallback: usa preço atual do produto se não conseguir calcular pelo histórico
          const currentPrice = movement.productId?.purchasePrice || 0
          if (currentPrice > 0) {
            totalSalesCost += currentPrice * saleQuantity
          } else {
            salesWithoutCost += saleQuantity
          }
        }
      } else {
        // Sem histórico de entradas: usa preço atual do produto como fallback
        const currentPrice = movement.productId?.purchasePrice || 0
        if (currentPrice > 0) {
          totalSalesCost += currentPrice * saleQuantity
        } else {
          salesWithoutCost += saleQuantity
        }
      }
    })

    // Calcula margem de lucro e margem percentual
    const profitMargin = totalRevenue - totalSalesCost
    const profitMarginPercent = totalSalesCost > 0 
      ? (profitMargin / totalSalesCost) * 100 
      : 0

    // ========== VENDAS POR MEIO DE PAGAMENTO ==========
    const salesByPaymentMethod: Record<string, { count: number; totalValue: number }> = {}
    
    // Agrupa vendas por saleGroupId para contar vendas únicas (não movimentações)
    const salesByGroup = new Map<string, { paymentMethod: string; totalRevenue: number }>()
    
    saidaMovements.forEach((movement: any) => {
      const groupId = movement.saleGroupId?.toString() || movement._id.toString()
      const paymentMethod = movement.paymentMethod || 'sem_metodo'
      
      // Calcula receita desta movimentação
      let movementRevenue = 0
      if (movement.totalRevenue && movement.totalRevenue > 0) {
        movementRevenue = movement.totalRevenue
      } else if (movement.salePrice && movement.quantity) {
        let subtotal = movement.salePrice * movement.quantity
        let discount = 0
        
        if (movement.discountType && movement.discountValue !== undefined) {
          if (movement.discountType === 'percent') {
            discount = subtotal * (movement.discountValue / 100)
          } else {
            discount = movement.discountValue
          }
        }
        
        movementRevenue = Math.max(0, subtotal - discount)
      }
      
      if (salesByGroup.has(groupId)) {
        // Adiciona ao valor total do grupo
        const group = salesByGroup.get(groupId)!
        group.totalRevenue += movementRevenue
      } else {
        // Cria novo grupo
        salesByGroup.set(groupId, {
          paymentMethod,
          totalRevenue: movementRevenue,
        })
      }
    })
    
    // Agrega por meio de pagamento
    salesByGroup.forEach((group) => {
      const method = group.paymentMethod
      if (!salesByPaymentMethod[method]) {
        salesByPaymentMethod[method] = { count: 0, totalValue: 0 }
      }
      salesByPaymentMethod[method].count += 1
      salesByPaymentMethod[method].totalValue += group.totalRevenue
    })

    // ========== VENDAS POR TAMANHO ==========
    const salesBySize: Record<string, { quantity: number; totalValue: number }> = {}
    
    saidaMovements.forEach((movement: any) => {
      const productSize = movement.productId?.size
      if (!productSize) return // Ignora produtos sem tamanho
      
      const sizeKey = productSize.trim().toUpperCase() // Normaliza o tamanho
      
      // Calcula receita desta movimentação
      let movementRevenue = 0
      if (movement.totalRevenue && movement.totalRevenue > 0) {
        movementRevenue = movement.totalRevenue
      } else if (movement.salePrice && movement.quantity) {
        let subtotal = movement.salePrice * movement.quantity
        let discount = 0
        
        if (movement.discountType && movement.discountValue !== undefined) {
          if (movement.discountType === 'percent') {
            discount = subtotal * (movement.discountValue / 100)
          } else {
            discount = movement.discountValue
          }
        }
        
        movementRevenue = Math.max(0, subtotal - discount)
      }
      
      if (!salesBySize[sizeKey]) {
        salesBySize[sizeKey] = { quantity: 0, totalValue: 0 }
      }
      
      salesBySize[sizeKey].quantity += movement.quantity
      salesBySize[sizeKey].totalValue += movementRevenue
    })
    
    // Converte para array e ordena por quantidade (descendente)
    const salesBySizeArray = Object.entries(salesBySize)
      .map(([size, data]) => ({
        size,
        quantity: data.quantity,
        totalValue: data.totalValue,
      }))
      .sort((a, b) => b.quantity - a.quantity)

    // ========== CÁLCULO DE TOTAL GASTO (TODAS AS COMPRAS) ==========
    const allEntradaMovementsForTotal = await Movement.find({
      ...additionalFilters,
      type: 'entrada',
    })
      .populate('productId', 'purchasePrice name')
      .lean()

    let totalAllTimeSpent = 0
    let allTimeEntradaCount = 0
    allEntradaMovementsForTotal.forEach((movement: any) => {
      allTimeEntradaCount++
      if (movement.totalPrice && movement.totalPrice > 0) {
        totalAllTimeSpent += movement.totalPrice
      } else if (movement.price && movement.quantity) {
        totalAllTimeSpent += movement.price * movement.quantity
      } else if (movement.productId?.purchasePrice && movement.quantity) {
        totalAllTimeSpent += movement.productId.purchasePrice * movement.quantity
      }
    })

    // ========== CÁLCULO DE VALOR DO ESTOQUE (MELHORADO) ==========
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
    let totalStockValueByHistory = 0 // Calculado por histórico de entradas
    let totalStockSaleValue = 0 // Valor total do estoque baseado em preços de venda
    let productsWithoutPrice = 0
    let productsWithoutPriceQuantity = 0
    let productsWithoutSalePrice = 0
    let productsWithoutSalePriceQuantity = 0
    let stockValueDiscrepancy = 0

    products.forEach((product: any) => {
      const prodId = product._id.toString()
      const currentQuantity = product.quantity || 0
      
      if (currentQuantity <= 0) return // Ignora produtos sem estoque

      // Método 1: Valor usando preço atual do produto (compra)
      const valueByCurrentPrice = product.purchasePrice && currentQuantity 
        ? product.purchasePrice * currentQuantity 
        : 0

      // Método 2: Valor usando histórico de entradas (FIFO)
      let valueByHistory = 0
      if (productEntryHistory[prodId] && productEntryHistory[prodId].length > 0) {
        let remainingQuantity = currentQuantity
        
        for (const entry of productEntryHistory[prodId]) {
          if (remainingQuantity <= 0) break
          
          const quantityToUse = Math.min(remainingQuantity, entry.quantity)
          valueByHistory += quantityToUse * entry.unitPrice
          remainingQuantity -= quantityToUse
        }
        
        // Se ainda sobrar quantidade, usa preço atual para o restante
        if (remainingQuantity > 0 && product.purchasePrice) {
          valueByHistory += remainingQuantity * product.purchasePrice
        }
      }

      // Valor baseado em preço de venda
      const valueBySalePrice = product.salePrice && currentQuantity
        ? product.salePrice * currentQuantity
        : 0

      if (valueBySalePrice > 0) {
        totalStockSaleValue += valueBySalePrice
      } else {
        productsWithoutSalePrice++
        productsWithoutSalePriceQuantity += currentQuantity
      }

      // Usa o método mais preciso disponível para custo
      if (valueByHistory > 0) {
        totalStockValueByHistory += valueByHistory
        totalStockValue += valueByHistory
      } else if (valueByCurrentPrice > 0) {
        totalStockValue += valueByCurrentPrice
      } else {
        // Produto sem preço de compra
        productsWithoutPrice++
        productsWithoutPriceQuantity += currentQuantity
      }

      // Calcula discrepância entre preço atual e histórico
      if (valueByHistory > 0 && valueByCurrentPrice > 0 && valueByHistory !== valueByCurrentPrice) {
        stockValueDiscrepancy += Math.abs(valueByHistory - valueByCurrentPrice)
      }
    })

    // ========== CÁLCULO DE VALOR DE VENDA POTENCIAL TOTAL (TODAS AS COMPRAS) ==========
    // Calcula o valor de venda potencial baseado em TODAS as compras feitas, não apenas estoque atual
    // Isso mostra o potencial total de ganho independente de vendas já realizadas
    
    // Busca todos os produtos que já tiveram compras (entradas)
    const allProductsWithPurchases = new Set<string>()
    allEntradaMovements.forEach((movement: any) => {
      const prodId = movement.productId?._id?.toString() || movement.productId?.toString()
      if (prodId) allProductsWithPurchases.add(prodId)
    })

    // Busca informações atualizadas desses produtos (para pegar salePrice atual)
    const productIdsArray = Array.from(allProductsWithPurchases).map(id => {
      try {
        return new mongoose.Types.ObjectId(id)
      } catch {
        return id
      }
    })

    const productsWithPurchases = await Product.find({
      _id: { $in: productIdsArray },
      userId: userIdFilter,
    }).lean()

    // Calcula quantidade total comprada por produto (histórico de entradas)
    const totalPurchasedQuantities: Record<string, number> = {}
    allEntradaMovements.forEach((movement: any) => {
      const prodId = movement.productId?._id?.toString() || movement.productId?.toString()
      if (!prodId) return
      
      if (!totalPurchasedQuantities[prodId]) {
        totalPurchasedQuantities[prodId] = 0
      }
      totalPurchasedQuantities[prodId] += movement.quantity || 0
    })

    // Calcula valor de venda potencial total e custo total das compras
    let totalPotentialSaleValue = 0
    let totalPurchaseCost = 0
    let productsWithoutSalePriceForPotential = 0
    let productsWithoutSalePriceQuantityForPotential = 0

    productsWithPurchases.forEach((product: any) => {
      const prodId = product._id.toString()
      const totalPurchased = totalPurchasedQuantities[prodId] || 0
      
      if (totalPurchased <= 0) return

      // Valor de venda potencial (preço de venda atual × total comprado)
      const potentialSaleValue = product.salePrice && totalPurchased
        ? product.salePrice * totalPurchased
        : 0

      if (potentialSaleValue > 0) {
        totalPotentialSaleValue += potentialSaleValue
      } else {
        productsWithoutSalePriceForPotential++
        productsWithoutSalePriceQuantityForPotential += totalPurchased
      }

      // Custo total das compras deste produto (usando histórico)
      if (productEntryHistory[prodId] && productEntryHistory[prodId].length > 0) {
        // Soma todas as entradas deste produto
        productEntryHistory[prodId].forEach((entry: any) => {
          totalPurchaseCost += entry.totalPrice || (entry.unitPrice * entry.quantity)
        })
      } else if (product.purchasePrice && totalPurchased) {
        // Fallback: usa preço atual × quantidade comprada
        totalPurchaseCost += product.purchasePrice * totalPurchased
      }
    })

    // Calcula margem potencial total
    const potentialProfit = totalPotentialSaleValue - totalPurchaseCost
    const potentialMarginPercent = totalPurchaseCost > 0
      ? (potentialProfit / totalPurchaseCost) * 100
      : 0

    // Calcula margem potencial do estoque atual (para comparação)
    const currentStockPotentialProfit = totalStockSaleValue - totalStockValue
    const currentStockPotentialMarginPercent = totalStockValue > 0
      ? (currentStockPotentialProfit / totalStockValue) * 100
      : 0

    // ========== DIAGNÓSTICOS E MÉTRICAS ADICIONAIS ==========
    const diagnostics = {
      productsWithoutPrice,
      productsWithoutPriceQuantity,
      productsWithoutSalePrice,
      productsWithoutSalePriceQuantity,
      productsWithoutSalePriceForPotential,
      productsWithoutSalePriceQuantityForPotential,
      salesWithoutCost,
      stockValueDiscrepancy,
      entradaCountInPeriod: entradaCount,
      salesCountInPeriod: salesCount,
      totalEntradasAllTime: allTimeEntradaCount,
      stockValueMethod: totalStockValueByHistory > 0 ? 'historical' : 'current_price',
    }

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
      totalAllTimeSpent,
      totalRevenue,
      totalSalesCost,
      profitMargin,
      profitMarginPercent,
      totalStockValue,
      totalStockSaleValue, // Valor de venda do estoque atual
      currentStockPotentialProfit, // Lucro potencial do estoque atual
      currentStockPotentialMarginPercent, // Margem percentual do estoque atual
      totalPotentialSaleValue, // Valor de venda potencial TOTAL (todas as compras)
      totalPurchaseCost, // Custo total de todas as compras
      potentialProfit, // Lucro potencial total (todas as compras)
      potentialMarginPercent, // Margem percentual potencial total
      dailyMovements,
      topProducts: topProductsWithValue,
      diagnostics, // Métricas de diagnóstico
      salesByPaymentMethod, // Vendas por meio de pagamento
      salesBySize: salesBySizeArray, // Vendas por tamanho
    })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { error: 'Erro ao carregar relatórios', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

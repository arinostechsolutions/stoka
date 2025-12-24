'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Product from '@/lib/models/Product'
import Movement from '@/lib/models/Movement'
import PaymentInstallment from '@/lib/models/PaymentInstallment'
import { movementSchema } from '@/lib/validations'
import { z } from 'zod'
import mongoose from 'mongoose'

export async function createMovement(formData: FormData) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  try {
    const priceStr = formData.get('price') as string
    const price = priceStr ? Number(priceStr.replace(/[^\d,.-]/g, '').replace(',', '.')) : undefined

    const salePriceStr = formData.get('salePrice') as string
    const salePrice = salePriceStr ? Number(salePriceStr.replace(/[^\d,.-]/g, '').replace(',', '.')) : undefined

    const discountType = formData.get('discountType') as 'percent' | 'fixed' | null
    const discountValueStr = formData.get('discountValue') as string
    const discountValue = discountValueStr ? Number(discountValueStr.replace(/[^\d,.-]/g, '').replace(',', '.')) : undefined

    const data = {
      productId: formData.get('productId') as string,
      supplierId: formData.get('supplierId') as string || undefined,
      type: formData.get('type') as 'entrada' | 'saida' | 'ajuste',
      quantity: Number(formData.get('quantity')),
      price: price,
      salePrice: salePrice,
      discountType: discountType || undefined,
      discountValue: discountValue,
      campaignId: formData.get('campaignId') as string || undefined,
      customerId: formData.get('customerId') as string || undefined,
      paymentMethod: (formData.get('paymentMethod') as string) || undefined,
      notes: formData.get('notes') as string || undefined,
    }

    const validatedData = movementSchema.parse(data)

    await connectDB()

    const product = await Product.findOne({
      _id: validatedData.productId,
      userId: session.user.id as any,
    }).populate('supplierId')

    if (!product) {
      return { error: 'Produto não encontrado' }
    }

    // Se não houver supplierId no formData, usa o supplierId do produto
    if (!validatedData.supplierId && product.supplierId) {
      const supplierId = (product.supplierId as any)?._id || product.supplierId
      validatedData.supplierId = supplierId.toString()
    }

    const previousQuantity = product.quantity
    let newQuantity = previousQuantity

    if (validatedData.type === 'entrada') {
      newQuantity = previousQuantity + validatedData.quantity
    } else if (validatedData.type === 'saida') {
      if (previousQuantity < validatedData.quantity) {
        return { error: 'Quantidade insuficiente em estoque' }
      }
      newQuantity = previousQuantity - validatedData.quantity
    } else if (validatedData.type === 'ajuste') {
      newQuantity = validatedData.quantity
    }

    await Product.updateOne(
      { _id: validatedData.productId },
      { quantity: newQuantity }
    )

    // Calcula totalPrice para entrada
    const totalPrice = validatedData.price && validatedData.quantity 
      ? validatedData.price * validatedData.quantity 
      : undefined

    // Calcula totalRevenue para saída (com desconto aplicado)
    let totalRevenue: number | undefined = undefined
    if (validatedData.type === 'saida' && validatedData.salePrice && validatedData.quantity) {
      const subtotal = validatedData.salePrice * validatedData.quantity
      let discount = 0
      
      if (validatedData.discountType && validatedData.discountValue !== undefined) {
        if (validatedData.discountType === 'percent') {
          discount = subtotal * (validatedData.discountValue / 100)
        } else {
          discount = validatedData.discountValue
        }
      }
      
      totalRevenue = Math.max(0, subtotal - discount)
    }

    await Movement.create({
      userId: session.user.id as any,
      productId: validatedData.productId,
      supplierId: validatedData.supplierId,
      type: validatedData.type,
      quantity: validatedData.quantity,
      previousQuantity,
      newQuantity,
      price: validatedData.price,
      totalPrice: totalPrice,
      salePrice: validatedData.salePrice,
      discountType: validatedData.discountType,
      discountValue: validatedData.discountValue,
      campaignId: validatedData.campaignId,
      customerId: validatedData.customerId,
      paymentMethod: validatedData.paymentMethod || undefined,
      totalRevenue: totalRevenue,
      notes: validatedData.notes,
    })

    revalidatePath('/movimentacoes')
    revalidatePath(`/produtos/${validatedData.productId}`)
    revalidatePath('/dashboard')
    revalidatePath('/vitrine')
    if (validatedData.supplierId) {
      revalidatePath(`/fornecedores/${validatedData.supplierId}`)
    }
    if (validatedData.customerId) {
      revalidatePath(`/clientes/${validatedData.customerId}`)
    }
    return { success: true }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    return { error: 'Erro ao criar movimentação' }
  }
}

interface SaleItem {
  productId: string
  quantity: number
  salePrice: number
  discountType?: 'percent' | 'fixed'
  discountValue?: number
}

export async function createSale(formData: FormData) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  try {
    await connectDB()

    // Lê os itens da venda (JSON string)
    const itemsJson = formData.get('items') as string
    if (!itemsJson) {
      return { error: 'Nenhum produto selecionado' }
    }

    let items: SaleItem[]
    try {
      items = JSON.parse(itemsJson)
    } catch {
      return { error: 'Formato de itens inválido' }
    }

    if (!Array.isArray(items) || items.length === 0) {
      return { error: 'Nenhum produto selecionado' }
    }

    // Metadados compartilhados da venda
    const campaignId = formData.get('campaignId') as string || undefined
    const customerId = formData.get('customerId') as string || undefined
    const paymentMethod = formData.get('paymentMethod') as 'cartao_credito' | 'cartao_debito' | 'pix' | 'pix_parcelado' | null
    const installmentsCountStr = formData.get('installmentsCount') as string | null
    const installmentsCount = installmentsCountStr ? Number(installmentsCountStr) : undefined
    const installmentDueDateStr = formData.get('installmentDueDate') as string | null
    const installmentDueDate = installmentDueDateStr ? new Date(installmentDueDateStr) : undefined
    const downPaymentStr = formData.get('downPayment') as string | null
    const downPayment = downPaymentStr ? Number(downPaymentStr.replace(/[^\d,.-]/g, '').replace(',', '.')) : 0
    const notes = formData.get('notes') as string || undefined

    // Gera um ID único para agrupar todas as Movements desta venda
    const saleGroupId = new mongoose.Types.ObjectId()
    
    // Calcula o total da venda para parcelamento
    let totalSaleAmount = 0
    for (const item of items) {
      const subtotal = item.salePrice * item.quantity
      let discount = 0
      if (item.discountType && item.discountValue !== undefined) {
        if (item.discountType === 'percent') {
          discount = subtotal * (item.discountValue / 100)
        } else {
          discount = item.discountValue
        }
      }
      totalSaleAmount += Math.max(0, subtotal - discount)
    }

    // Valida todos os produtos e quantidades antes de criar qualquer Movement
    const productsToUpdate: Array<{ product: any; quantity: number; previousQuantity: number }> = []
    
    for (const item of items) {
      const product = await Product.findOne({
        _id: item.productId,
        userId: session.user.id as any,
      })

      if (!product) {
        return { error: `Produto não encontrado: ${item.productId}` }
      }

      if (product.quantity < item.quantity) {
        return { error: `Quantidade insuficiente para ${product.name}. Estoque disponível: ${product.quantity}` }
      }

      productsToUpdate.push({
        product,
        quantity: item.quantity,
        previousQuantity: product.quantity,
      })
    }

    // Cria todas as Movements
    const movements = []
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const { product, quantity, previousQuantity } = productsToUpdate[i]
      const newQuantity = previousQuantity - quantity

      // Calcula desconto e receita total para este item
      const subtotal = item.salePrice * quantity
      let discount = 0
      
      if (item.discountType && item.discountValue !== undefined) {
        if (item.discountType === 'percent') {
          discount = subtotal * (item.discountValue / 100)
        } else {
          discount = item.discountValue
        }
      }
      
      const totalRevenue = Math.max(0, subtotal - discount)

      // Se for PIX parcelado, não registra totalRevenue na saída (será registrado nas parcelas)
      // Mas ainda registra a saída para baixar o estoque
      const movementTotalRevenue = paymentMethod === 'pix_parcelado' ? 0 : totalRevenue

      const movement = await Movement.create({
        userId: session.user.id as any,
        productId: item.productId,
        type: 'saida',
        quantity: quantity,
        previousQuantity,
        newQuantity,
        salePrice: item.salePrice,
        discountType: item.discountType,
        discountValue: item.discountValue,
        campaignId: campaignId,
        customerId: customerId,
        paymentMethod: paymentMethod || undefined,
        installmentsCount: paymentMethod === 'pix_parcelado' && installmentsCount ? installmentsCount : undefined,
        installmentDueDate: paymentMethod === 'pix_parcelado' && installmentDueDate ? installmentDueDate : undefined,
        totalRevenue: movementTotalRevenue,
        saleGroupId: saleGroupId,
        notes: notes,
      })

      movements.push(movement)

      // Atualiza o estoque do produto
      await Product.updateOne(
        { _id: item.productId },
        { quantity: newQuantity }
      )
    }

    // Cria parcelas se for PIX Parcelado
    if (paymentMethod === 'pix_parcelado' && installmentsCount && installmentsCount > 1 && customerId) {
      // Calcula o valor pendente (total - entrada)
      const pendingAmount = Math.max(0, totalSaleAmount - downPayment)
      const installmentAmount = pendingAmount / installmentsCount
      
      // Determina a data da primeira parcela
      // Prioriza a data fornecida, senão usa data atual + 1 mês como fallback
      let firstInstallmentDate: Date
      if (installmentDueDate) {
        // Se houver data fornecida, usa ela (independente de ter entrada ou não)
        firstInstallmentDate = installmentDueDate
      } else {
        // Se não houver data fornecida, usa data atual + 1 mês como fallback
        firstInstallmentDate = new Date()
        firstInstallmentDate.setMonth(firstInstallmentDate.getMonth() + 1)
      }
      
      // Se houver entrada, cria uma "parcela" de entrada marcada como paga e movimentação de entrada
      if (downPayment > 0) {
        const downPaymentPerMovement = downPayment / movements.length
        for (const movement of movements) {
          // Cria a parcela de entrada
          await PaymentInstallment.create({
            userId: session.user.id as any,
            movementId: movement._id,
            saleGroupId: saleGroupId,
            customerId: new mongoose.Types.ObjectId(customerId),
            installmentNumber: 0, // 0 = entrada
            totalInstallments: installmentsCount,
            amount: downPaymentPerMovement,
            dueDate: new Date(), // Data atual para entrada
            paidAmount: downPaymentPerMovement,
            paidDate: new Date(),
            isPaid: true,
            notes: 'Entrada',
          })

          // Cria movimentação de entrada para o valor da entrada
          const product = await Product.findById(movement.productId)
          if (product) {
            const previousQuantity = product.quantity
            await Movement.create({
              userId: session.user.id as any,
              productId: movement.productId,
              type: 'entrada',
              quantity: 0, // Não altera estoque
              previousQuantity,
              newQuantity: previousQuantity,
              price: downPaymentPerMovement,
              totalPrice: downPaymentPerMovement,
              totalRevenue: downPaymentPerMovement, // Adiciona totalRevenue para identificar como receita
              customerId: new mongoose.Types.ObjectId(customerId), // Associa ao cliente
              notes: `Entrada - Venda parcelada (Parcela 0/${installmentsCount})`,
            })
          }
        }
      }
      
      // Cria as parcelas restantes
      for (let i = 1; i <= installmentsCount; i++) {
        // Calcula a data de vencimento de cada parcela (1 mês após a anterior)
        const dueDate = new Date(firstInstallmentDate)
        dueDate.setMonth(dueDate.getMonth() + (i - 1))
        // Garante que a data seja no início do dia
        dueDate.setHours(0, 0, 0, 0)
        
        // Cria uma parcela para cada movimento do grupo
        // Divide o valor da parcela entre os movimentos se houver múltiplos produtos
        const amountPerMovement = installmentAmount / movements.length
        
        for (const movement of movements) {
          await PaymentInstallment.create({
            userId: session.user.id as any,
            movementId: movement._id,
            saleGroupId: saleGroupId,
            customerId: new mongoose.Types.ObjectId(customerId),
            installmentNumber: i,
            totalInstallments: installmentsCount,
            amount: amountPerMovement,
            dueDate: dueDate,
            isPaid: false,
          })
        }
      }
    }

    // Revalida paths
    revalidatePath('/movimentacoes')
    revalidatePath('/dashboard')
    revalidatePath('/vitrine')
    if (customerId) {
      revalidatePath(`/clientes/${customerId}`)
      revalidatePath('/clientes')
    }

    return { success: true, saleGroupId: saleGroupId.toString() }
  } catch (error: any) {
    console.error('Erro ao criar venda:', error)
    return { error: error.message || 'Erro ao criar venda' }
  }
}


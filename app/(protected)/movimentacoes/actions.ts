'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Product from '@/lib/models/Product'
import Movement from '@/lib/models/Movement'
import { movementSchema } from '@/lib/validations'
import { z } from 'zod'

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
      notes: formData.get('notes') as string || undefined,
    }

    const validatedData = movementSchema.parse(data)

    await connectDB()

    const product = await Product.findOne({
      _id: validatedData.productId,
      userId: session.user.id as any,
    })

    if (!product) {
      return { error: 'Produto não encontrado' }
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
      totalRevenue: totalRevenue,
      notes: validatedData.notes,
    })

    revalidatePath('/movimentacoes')
    revalidatePath(`/produtos/${validatedData.productId}`)
    revalidatePath('/dashboard')
    if (validatedData.supplierId) {
      revalidatePath(`/fornecedores/${validatedData.supplierId}`)
    }
    return { success: true }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    return { error: 'Erro ao criar movimentação' }
  }
}


'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Supplier from '@/lib/models/Supplier'
import { supplierSchema } from '@/lib/validations'
import { z } from 'zod'

export async function createSupplier(formData: FormData) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  try {
    const categoryValue = formData.get('category') as string
    
    const data = {
      name: formData.get('name') as string,
      category: (categoryValue && ['geral', 'vestuario', 'joia', 'sapato'].includes(categoryValue)) 
        ? (categoryValue as 'geral' | 'vestuario' | 'joia' | 'sapato')
        : 'geral',
      cnpj: formData.get('cnpj') as string || undefined,
      email: formData.get('email') as string || undefined,
      phone: formData.get('phone') as string || undefined,
      address: formData.get('address') as string || undefined,
      notes: formData.get('notes') as string || undefined,
    }

    const validatedData = supplierSchema.parse(data)

    await connectDB()

    
    // Converte userId para ObjectId
    const mongoose = await import('mongoose')
    const userIdObjectId = new mongoose.default.Types.ObjectId(session.user.id as string)
    
    const supplierData = {
      ...validatedData,
      userId: userIdObjectId,
    }

    // Usa insertOne diretamente na collection para evitar problemas de cache do schema
    const result = await Supplier.collection.insertOne(supplierData)

    // Verifica se foi realmente criado
    const verifySupplier = await Supplier.findOne({ _id: result.insertedId })

    revalidatePath('/fornecedores')
    return { success: true }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    return { error: error.message || 'Erro ao criar fornecedor' }
  }
}

export async function updateSupplier(id: string, formData: FormData) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  try {
    const data = {
      name: formData.get('name') as string,
      category: (formData.get('category') as 'geral' | 'vestuario' | 'joia' | 'sapato') || 'geral',
      cnpj: formData.get('cnpj') as string || undefined,
      email: formData.get('email') as string || undefined,
      phone: formData.get('phone') as string || undefined,
      address: formData.get('address') as string || undefined,
      notes: formData.get('notes') as string || undefined,
    }

    const validatedData = supplierSchema.parse(data)

    await connectDB()

    const supplier = await Supplier.findOne({
      _id: id,
      userId: session.user.id as any,
    })

    if (!supplier) {
      return { error: 'Fornecedor não encontrado' }
    }

    await Supplier.updateOne(
      { _id: id, userId: session.user.id as any },
      validatedData
    )

    revalidatePath('/fornecedores')
    revalidatePath(`/fornecedores/${id}`)
    return { success: true }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    return { error: 'Erro ao atualizar fornecedor' }
  }
}

export async function deleteSupplier(id: string) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  try {
    await connectDB()

    const supplier = await Supplier.findOne({
      _id: id,
      userId: session.user.id as any,
    })

    if (!supplier) {
      return { error: 'Fornecedor não encontrado' }
    }

    // Remove a referência do fornecedor nos produtos associados
    const Product = (await import('@/lib/models/Product')).default
    await Product.updateMany(
      { supplierId: id, userId: session.user.id as any },
      { $unset: { supplierId: 1 } }
    )

    // Remove a referência do fornecedor nas movimentações associadas
    const Movement = (await import('@/lib/models/Movement')).default
    await Movement.updateMany(
      { supplierId: id, userId: session.user.id as any },
      { $unset: { supplierId: 1 } }
    )

    // Deleta o fornecedor
    await Supplier.deleteOne({ _id: id, userId: session.user.id as any })

    revalidatePath('/fornecedores')
    revalidatePath('/produtos')
    revalidatePath('/movimentacoes')
    return { success: true }
  } catch (error) {
    console.error('Error deleting supplier:', error)
    return { error: 'Erro ao deletar fornecedor' }
  }
}


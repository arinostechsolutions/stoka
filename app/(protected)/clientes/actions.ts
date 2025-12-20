'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Customer from '@/lib/models/Customer'
import { customerSchema } from '@/lib/validations'
import { z } from 'zod'

export async function createCustomer(formData: FormData) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  try {
    const childrenData = JSON.parse(formData.get('children') as string || '[]')

    const data: any = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string || undefined,
      address: formData.get('address') as string || undefined,
      instagram: formData.get('instagram') as string || undefined,
      children: childrenData,
    }

    const validatedData = customerSchema.parse(data)

    await connectDB()

    await Customer.create({
      ...validatedData,
      userId: session.user.id as any,
    })

    revalidatePath('/clientes')
    return { success: true }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    return { error: 'Erro ao criar cliente' }
  }
}

export async function updateCustomer(id: string, formData: FormData) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  try {
    const childrenData = JSON.parse(formData.get('children') as string || '[]')

    const data: any = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string || undefined,
      address: formData.get('address') as string || undefined,
      instagram: formData.get('instagram') as string || undefined,
      children: childrenData,
    }

    const validatedData = customerSchema.parse(data)

    await connectDB()

    const customer = await Customer.findOne({
      _id: id,
      userId: session.user.id as any,
    })

    if (!customer) {
      return { error: 'Cliente não encontrado' }
    }

    await Customer.updateOne(
      { _id: id },
      { $set: validatedData }
    )

    revalidatePath('/clientes')
    return { success: true }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    return { error: 'Erro ao atualizar cliente' }
  }
}

export async function deleteCustomer(id: string) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  try {
    await connectDB()

    const customer = await Customer.findOne({
      _id: id,
      userId: session.user.id as any,
    })

    if (!customer) {
      return { error: 'Cliente não encontrado' }
    }

    await Customer.deleteOne({ _id: id })

    revalidatePath('/clientes')
    return { success: true }
  } catch (error: any) {
    return { error: 'Erro ao deletar cliente' }
  }
}


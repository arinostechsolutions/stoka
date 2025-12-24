'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Movement from '@/lib/models/Movement'
import Customer from '@/lib/models/Customer'

export async function createCustomer(formData: FormData) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  try {
    await connectDB()

    const name = formData.get('name') as string
    const phone = formData.get('phone') as string || undefined
    const address = formData.get('address') as string || undefined
    const instagram = formData.get('instagram') as string || undefined
    const notes = formData.get('notes') as string || undefined
    const childrenJson = formData.get('children') as string

    let children = []
    if (childrenJson) {
      try {
        const parsed = JSON.parse(childrenJson)
        // Converte strings de data para Date objects e garante que size seja array
        children = parsed.map((child: any) => {
          let sizeArray: string[] = []
          if (child.size) {
            if (Array.isArray(child.size)) {
              sizeArray = child.size
            } else if (typeof child.size === 'string') {
              // Se ainda for string, separa por vírgula
              sizeArray = child.size.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
            }
          }
          return {
            ...child,
            size: sizeArray.length > 0 ? sizeArray : undefined,
            birthday: child.birthday ? new Date(child.birthday) : undefined,
          }
        })
      } catch {
        children = []
      }
    }

    await Customer.create({
      userId: session.user.id as any,
      name: name.trim(),
      phone: phone?.trim(),
      address: address?.trim(),
      instagram: instagram?.trim(),
      notes: notes?.trim(),
      children: children,
    })

    revalidatePath('/clientes')
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao criar cliente:', error)
    return { error: 'Erro ao criar cliente' }
  }
}

export async function updateCustomer(id: string, formData: FormData) {
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

    const name = formData.get('name') as string
    const phone = formData.get('phone') as string || undefined
    const address = formData.get('address') as string || undefined
    const instagram = formData.get('instagram') as string || undefined
    const notes = formData.get('notes') as string || undefined
    const childrenJson = formData.get('children') as string

    let children = []
    if (childrenJson) {
      try {
        const parsed = JSON.parse(childrenJson)
        // Converte strings de data para Date objects e garante que size seja array
        children = parsed.map((child: any) => {
          let sizeArray: string[] = []
          if (child.size) {
            if (Array.isArray(child.size)) {
              sizeArray = child.size
            } else if (typeof child.size === 'string') {
              // Se ainda for string, separa por vírgula
              sizeArray = child.size.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
            }
          }
          return {
            ...child,
            size: sizeArray.length > 0 ? sizeArray : undefined,
            birthday: child.birthday ? new Date(child.birthday) : undefined,
          }
        })
      } catch {
        children = []
      }
    }

    await Customer.updateOne(
      { _id: id },
      {
        name: name.trim(),
        phone: phone?.trim(),
        address: address?.trim(),
        instagram: instagram?.trim(),
        notes: notes?.trim(),
        children: children,
      }
    )

    revalidatePath('/clientes')
    revalidatePath(`/clientes/${id}`)
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao atualizar cliente:', error)
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

    // Remove a associação do cliente das movimentações
    await Movement.updateMany(
      { customerId: id },
      { $unset: { customerId: '' } }
    )

    await Customer.deleteOne({ _id: id })

    revalidatePath('/clientes')
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao excluir cliente:', error)
    return { error: 'Erro ao excluir cliente' }
  }
}

export async function associateMovementToCustomer(customerId: string, movementId: string) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return { error: 'Não autorizado' }
  }

  try {
    await connectDB()

    // Verifica se o cliente existe e pertence ao usuário
    const customer = await Customer.findOne({
      _id: customerId,
      userId: session.user.id as any,
    })

    if (!customer) {
      return { error: 'Cliente não encontrado' }
    }

    // Verifica se a movimentação existe, é do tipo saída e pertence ao usuário
    const movement = await Movement.findOne({
      _id: movementId,
      userId: session.user.id as any,
      type: 'saida',
    })

    if (!movement) {
      return { error: 'Movimentação não encontrada ou não é uma venda' }
    }

    // Verifica se a movimentação já está associada a outro cliente
    if (movement.customerId && movement.customerId.toString() !== customerId) {
      return { error: 'Esta movimentação já está associada a outro cliente' }
    }

    // Atualiza a movimentação
    await Movement.updateOne(
      { _id: movementId },
      { customerId: customerId as any }
    )

    revalidatePath(`/clientes/${customerId}`)
    revalidatePath('/movimentacoes')

    return { success: true }
  } catch (error: any) {
    console.error('Erro ao associar movimentação:', error)
    return { error: 'Erro ao associar movimentação ao cliente' }
  }
}

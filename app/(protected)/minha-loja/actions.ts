'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import connectDB from '@/lib/db'
import PublicStore from '@/lib/models/PublicStore'
import { publicStoreSchema } from '@/lib/validations'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import mongoose from 'mongoose'

export async function createPublicStore(formData: FormData) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  try {
    const slug = formData.get('slug') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string || undefined
    const whatsappMessage = formData.get('whatsappMessage') as string
    const phone = formData.get('phone') as string
    const selectedProducts = formData.get('selectedProducts') as string
    const isActive = formData.get('isActive') === 'true'
    const backgroundColor = formData.get('backgroundColor') as string
    const logoUrl = formData.get('logoUrl') as string

    // Parse selectedProducts JSON string
    let productsArray: string[] = []
    if (selectedProducts) {
      try {
        productsArray = JSON.parse(selectedProducts)
      } catch {
        productsArray = []
      }
    }

    const data: any = {
      slug: slug.toLowerCase().trim(),
      title: title.trim(),
      description: description?.trim() || undefined,
      whatsappMessage: whatsappMessage.trim(),
      phone: phone.replace(/\D/g, ''), // Remove caracteres não numéricos
      selectedProducts: productsArray,
      isActive,
    }

    const validatedData = publicStoreSchema.parse(data)

    await connectDB()

    // Verifica se o slug já existe
    const existingStore = await PublicStore.findOne({ slug: validatedData.slug })
    if (existingStore) {
      return { error: 'Este slug já está em uso. Escolha outro.' }
    }

    // Prepara o objeto final incluindo backgroundColor e logoUrl
    // Esses campos podem não estar no validatedData se não passaram na validação do Zod
    const createData: any = {
      userId: session.user.id as any,
      ...validatedData,
    }

    // Adiciona backgroundColor diretamente se fornecido e válido (ignora validação do Zod)
    const bgColor = backgroundColor?.trim()
    if (bgColor && bgColor.match(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)) {
      createData.backgroundColor = bgColor
    }

    // Adiciona logoUrl diretamente se fornecido (ignora validação do Zod)
    const logo = logoUrl?.trim()
    if (logo && logo.length > 0) {
      createData.logoUrl = logo
    }

    // Converte userId e selectedProducts para ObjectId
    const insertData: any = {
      ...createData,
      userId: new mongoose.Types.ObjectId(createData.userId),
      selectedProducts: createData.selectedProducts.map((id: string) => new mongoose.Types.ObjectId(id)),
    }
    
    // Usa insertOne diretamente para evitar validação do Mongoose
    const result = await PublicStore.collection.insertOne(insertData)
    
    // Busca o documento criado diretamente da collection para ver o que foi salvo
    const rawStore = await PublicStore.collection.findOne({ _id: result.insertedId })
    // Busca usando Mongoose
    const finalStore = await PublicStore.findById(result.insertedId).lean()

    revalidatePath('/minha-loja')
    return { success: true }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    if (error.code === 11000) {
      return { error: 'Este slug já está em uso. Escolha outro.' }
    }
    return { error: error.message || 'Erro ao criar página pública' }
  }
}

export async function updatePublicStore(id: string, formData: FormData) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  try {
    const slug = formData.get('slug') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string || undefined
    const whatsappMessage = formData.get('whatsappMessage') as string
    const phone = formData.get('phone') as string
    const selectedProducts = formData.get('selectedProducts') as string
    const isActive = formData.get('isActive') === 'true'
    const backgroundColor = formData.get('backgroundColor') as string
    const logoUrl = formData.get('logoUrl') as string

    // Parse selectedProducts JSON string
    let productsArray: string[] = []
    if (selectedProducts) {
      try {
        productsArray = JSON.parse(selectedProducts)
      } catch {
        productsArray = []
      }
    }

    const data: any = {
      slug: slug.toLowerCase().trim(),
      title: title.trim(),
      description: description?.trim() || undefined,
      whatsappMessage: whatsappMessage.trim(),
      phone: phone.replace(/\D/g, ''), // Remove caracteres não numéricos
      selectedProducts: productsArray,
      isActive,
    }

    // Adiciona backgroundColor se fornecido
    if (backgroundColor && backgroundColor.trim()) {
      data.backgroundColor = backgroundColor.trim()
    }

    // Adiciona logoUrl se fornecido
    if (logoUrl && logoUrl.trim()) {
      data.logoUrl = logoUrl.trim()
    }

    const validatedData = publicStoreSchema.parse(data)

    await connectDB()

    // Verifica se o slug já existe em outra loja
    const existingStore = await PublicStore.findOne({
      slug: validatedData.slug,
      _id: { $ne: id },
    })
    if (existingStore) {
      return { error: 'Este slug já está em uso. Escolha outro.' }
    }

    const store = await PublicStore.findOne({
      _id: id,
      userId: session.user.id as any,
    })

    if (!store) {
      return { error: 'Página não encontrada' }
    }

    // Prepara o objeto de atualização - processa backgroundColor e logoUrl separadamente
    const updateData: any = { ...validatedData }
    
    // Converte selectedProducts para ObjectId
    if (updateData.selectedProducts && Array.isArray(updateData.selectedProducts)) {
      updateData.selectedProducts = updateData.selectedProducts.map((productId: string) => 
        new mongoose.Types.ObjectId(productId)
      )
    }

    // Processa backgroundColor - valida formato hex antes de incluir
    const bgColor = backgroundColor?.trim()
    if (bgColor && bgColor.match(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)) {
      updateData.backgroundColor = bgColor
    } else if (!bgColor || bgColor === '') {
      // Se não foi fornecido ou está vazio, remove do banco
      updateData.backgroundColor = null
    }

    // Processa logoUrl - sempre inclui se fornecido
    const logo = logoUrl?.trim()
    if (logo && logo.length > 0) {
      updateData.logoUrl = logo
    } else {
      // Se não foi fornecido ou está vazio, remove do banco
      updateData.logoUrl = null
    }

    // Usa collection.updateOne diretamente para garantir que os campos sejam atualizados
    const objectId = new mongoose.Types.ObjectId(id)
    const updateResult = await PublicStore.collection.updateOne(
      { _id: objectId, userId: new mongoose.Types.ObjectId(session.user.id as string) },
      { $set: updateData }
    )

    // Busca o documento atualizado diretamente da collection
    const rawStore = await PublicStore.collection.findOne({ _id: objectId })
    // Busca usando Mongoose
    const finalStore = await PublicStore.findById(id).lean()
    revalidatePath('/minha-loja')
    revalidatePath(`/loja/${validatedData.slug}`)
    return { success: true }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    if (error.code === 11000) {
      return { error: 'Este slug já está em uso. Escolha outro.' }
    }
    return { error: error.message || 'Erro ao atualizar página pública' }
  }
}

export async function deletePublicStore(id: string) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  try {
    await connectDB()

    const store = await PublicStore.findOne({
      _id: id,
      userId: session.user.id as any,
    })

    if (!store) {
      return { error: 'Página não encontrada' }
    }

    await PublicStore.deleteOne({ _id: id, userId: session.user.id as any })

    revalidatePath('/minha-loja')
    return { success: true }
  } catch (error: any) {
    return { error: 'Erro ao deletar página pública' }
  }
}



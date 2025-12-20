'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Campaign from '@/lib/models/Campaign'
import { campaignSchema } from '@/lib/validations'
import { z } from 'zod'

export async function createCampaign(formData: FormData) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  try {
    const data: any = {
      name: formData.get('name') as string,
      description: formData.get('description') as string || undefined,
    }

    const validatedData = campaignSchema.parse(data)

    await connectDB()

    await Campaign.create({
      ...validatedData,
      userId: session.user.id as any,
    })

    revalidatePath('/campanhas')
    return { success: true }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    return { error: 'Erro ao criar campanha' }
  }
}

export async function updateCampaign(id: string, formData: FormData) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  try {
    const data: any = {
      name: formData.get('name') as string,
      description: formData.get('description') as string || undefined,
    }

    const validatedData = campaignSchema.parse(data)

    await connectDB()

    const campaign = await Campaign.findOne({
      _id: id,
      userId: session.user.id as any,
    })

    if (!campaign) {
      return { error: 'Campanha não encontrada' }
    }

    await Campaign.updateOne(
      { _id: id },
      { $set: validatedData }
    )

    revalidatePath('/campanhas')
    return { success: true }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    return { error: 'Erro ao atualizar campanha' }
  }
}

export async function deleteCampaign(id: string) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  try {
    await connectDB()

    const campaign = await Campaign.findOne({
      _id: id,
      userId: session.user.id as any,
    })

    if (!campaign) {
      return { error: 'Campanha não encontrada' }
    }

    await Campaign.deleteOne({ _id: id })

    revalidatePath('/campanhas')
    return { success: true }
  } catch (error: any) {
    return { error: 'Erro ao deletar campanha' }
  }
}


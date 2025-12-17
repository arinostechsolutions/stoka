'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import User from '@/lib/models/User'
import { hashPassword } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

import { validateCNPJ } from '@/lib/utils/masks'

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  cnpj: z.string().optional().refine((val) => {
    if (!val) return true
    const unmasked = val.replace(/[^\d]/g, '')
    return unmasked.length === 14 && validateCNPJ(unmasked)
  }, 'CNPJ inválido'),
  companyName: z.string().optional(),
  tradeName: z.string().optional(),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string().min(6, 'Nova senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})

export async function updateProfile(formData: FormData) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  try {
    const cnpjValue = formData.get('cnpj') as string
    const unmaskedCnpj = cnpjValue ? cnpjValue.replace(/[^\d]/g, '') : undefined

    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      cnpj: unmaskedCnpj || undefined,
      companyName: formData.get('companyName') as string || undefined,
      tradeName: formData.get('tradeName') as string || undefined,
    }

    const validatedData = updateProfileSchema.parse(data)

    await connectDB()

    // Verifica se o email já está em uso por outro usuário
    const existingUser = await User.findOne({
      email: validatedData.email,
      _id: { $ne: session.user.id as any },
    })

    if (existingUser) {
      return { error: 'Este email já está em uso' }
    }

    await User.updateOne(
      { _id: session.user.id as any },
      {
        name: validatedData.name,
        email: validatedData.email,
        cnpj: validatedData.cnpj,
        companyName: validatedData.companyName,
        tradeName: validatedData.tradeName,
      }
    )

    revalidatePath('/settings')
    return { success: true }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    return { error: 'Erro ao atualizar perfil' }
  }
}

export async function changePassword(formData: FormData) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  try {
    const data = {
      currentPassword: formData.get('currentPassword') as string,
      newPassword: formData.get('newPassword') as string,
      confirmPassword: formData.get('confirmPassword') as string,
    }

    const validatedData = changePasswordSchema.parse(data)

    await connectDB()

    const user = await User.findById(session.user.id as any)

    if (!user) {
      return { error: 'Usuário não encontrado' }
    }

    // Verifica a senha atual
    const isPasswordValid = await bcrypt.compare(validatedData.currentPassword, user.password)

    if (!isPasswordValid) {
      return { error: 'Senha atual incorreta' }
    }

    // Atualiza a senha
    const hashedPassword = await hashPassword(validatedData.newPassword)

    await User.updateOne(
      { _id: session.user.id as any },
      { password: hashedPassword }
    )

    revalidatePath('/settings')
    return { success: true }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    return { error: 'Erro ao alterar senha' }
  }
}


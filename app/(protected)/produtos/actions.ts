'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Product from '@/lib/models/Product'
import { productSchema } from '@/lib/validations'
import { z } from 'zod'

export async function createProduct(formData: FormData) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  try {
    const purchasePrice = formData.get('purchasePrice') as string
    const salePrice = formData.get('salePrice') as string

    const data: any = {
      name: formData.get('name') as string,
      sku: formData.get('sku') as string || undefined,
      category: formData.get('category') as string || undefined,
      supplierId: formData.get('supplierId') as string || undefined,
      quantity: Number(formData.get('quantity')),
      minQuantity: Number(formData.get('minQuantity')),
      size: formData.get('size') as string || undefined,
      color: formData.get('color') as string || undefined,
      brand: formData.get('brand') as string || undefined,
      material: formData.get('material') as string || undefined,
    }

    // Processa purchasePrice
    if (purchasePrice && purchasePrice.trim() !== '') {
      const parsed = Number(purchasePrice.replace(/[^\d,.-]/g, '').replace(',', '.'))
      if (!isNaN(parsed) && parsed > 0) {
        data.purchasePrice = parsed
      }
    }

    // Processa salePrice
    if (salePrice && salePrice.trim() !== '') {
      const parsed = Number(salePrice.replace(/[^\d,.-]/g, '').replace(',', '.'))
      if (!isNaN(parsed) && parsed > 0) {
        data.salePrice = parsed
      }
    }

    const validatedData = productSchema.parse(data)

    await connectDB()

    await Product.create({
      ...validatedData,
      userId: session.user.id as any,
    })

    revalidatePath('/produtos')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    return { error: 'Erro ao criar produto' }
  }
}

export async function updateProduct(id: string, formData: FormData) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  try {
    const purchasePrice = formData.get('purchasePrice') as string | null
    const salePrice = formData.get('salePrice') as string | null

    const data: any = {
      name: formData.get('name') as string,
      sku: formData.get('sku') as string || undefined,
      category: formData.get('category') as string || undefined,
      supplierId: formData.get('supplierId') as string || undefined,
      quantity: Number(formData.get('quantity')),
      minQuantity: Number(formData.get('minQuantity')),
      size: formData.get('size') as string || undefined,
      color: formData.get('color') as string || undefined,
      brand: formData.get('brand') as string || undefined,
      material: formData.get('material') as string || undefined,
    }

    // Processa purchasePrice
    if (purchasePrice && purchasePrice.trim() !== '') {
      const parsed = Number(purchasePrice.replace(/[^\d,.-]/g, '').replace(',', '.'))
      if (!isNaN(parsed) && parsed > 0) {
        data.purchasePrice = parsed
      }
    } else {
      // Se foi enviado vazio, remove o campo
      data.purchasePrice = undefined
    }

    // Processa salePrice
    if (salePrice && salePrice.trim() !== '') {
      const parsed = Number(salePrice.replace(/[^\d,.-]/g, '').replace(',', '.'))
      if (!isNaN(parsed) && parsed > 0) {
        data.salePrice = parsed
      }
    } else {
      // Se foi enviado vazio, remove o campo
      data.salePrice = undefined
    }

    const validatedData = productSchema.parse(data)

    await connectDB()

    const product = await Product.findOne({
      _id: id,
      userId: session.user.id as any,
    })

    if (!product) {
      return { error: 'Produto não encontrado' }
    }

    // Prepara dados para atualização
    const updateData: any = {}
    const unsetData: any = {}

    // Verifica se o fornecedor é de vestuário
    const supplierId = formData.get('supplierId') as string
    let isVestuarioSupplier = false
    if (supplierId) {
      const mongoose = await import('mongoose')
      const Supplier = (await import('@/lib/models/Supplier')).default
      const supplier = await Supplier.findOne({ 
        _id: new mongoose.default.Types.ObjectId(supplierId),
        userId: session.user.id as any,
      }).lean()
      isVestuarioSupplier = supplier?.category === 'vestuario'
    }

    // Processa campos de vestuário
    const size = formData.get('size') as string | null
    const color = formData.get('color') as string | null
    const brand = formData.get('brand') as string | null
    const material = formData.get('material') as string | null

    // Campos de vestuário: só atualiza se fornecedor for de vestuário
    if (isVestuarioSupplier) {
      // Se fornecedor é de vestuário, salva os valores (mesmo que vazios, mantém como string vazia)
      if (size !== null) {
        updateData.size = size.trim() || ''
      }
      if (color !== null) {
        updateData.color = color.trim() || ''
      }
      if (brand !== null) {
        updateData.brand = brand.trim() || ''
      }
      if (material !== null) {
        updateData.material = material.trim() || ''
      }
    } else {
      // Se fornecedor não é de vestuário, remove os campos
      unsetData.size = ''
      unsetData.color = ''
      unsetData.brand = ''
      unsetData.material = ''
    }

    // Processa outros campos
    Object.keys(validatedData).forEach(key => {
      // Pula campos de vestuário que já foram processados
      if (['size', 'color', 'brand', 'material'].includes(key)) {
        return
      }
      const value = validatedData[key as keyof typeof validatedData]
      if (value !== undefined) {
        updateData[key] = value
      }
    })

    // Se purchasePrice ou salePrice foram explicitamente removidos (undefined), use $unset
    if (data.purchasePrice === undefined && purchasePrice !== null) {
      unsetData.purchasePrice = ''
      delete updateData.purchasePrice
    }
    if (data.salePrice === undefined && salePrice !== null) {
      unsetData.salePrice = ''
      delete updateData.salePrice
    }

    // Atualiza o produto
    if (Object.keys(unsetData).length > 0) {
      await Product.updateOne(
        { _id: id, userId: session.user.id as any },
        { $unset: unsetData, ...updateData }
      )
    } else {
      await Product.updateOne(
        { _id: id, userId: session.user.id as any },
        updateData
      )
    }

    revalidatePath('/produtos')
    revalidatePath(`/produtos/${id}`)
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    return { error: 'Erro ao atualizar produto' }
  }
}

export async function deleteProduct(id: string) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  try {
    await connectDB()

    const product = await Product.findOne({
      _id: id,
      userId: session.user.id as any,
    })

    if (!product) {
      return { error: 'Produto não encontrado' }
    }

    await Product.deleteOne({ _id: id, userId: session.user.id as any })

    revalidatePath('/produtos')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    return { error: 'Erro ao deletar produto' }
  }
}


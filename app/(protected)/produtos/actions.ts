'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Product from '@/lib/models/Product'
import { productSchema } from '@/lib/validations'
import { z } from 'zod'
import { v2 as cloudinary } from 'cloudinary'

// Configuração do Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Função helper para extrair public_id da URL do Cloudinary
function extractPublicIdFromUrl(url: string): string | null {
  try {
    // Formato: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
    // ou: https://res.cloudinary.com/{cloud_name}/image/upload/{public_id}.{format}
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/)
    if (match && match[1]) {
      return match[1]
    }
    return null
  } catch (error) {
    return null
  }
}

// Função helper para deletar imagem do Cloudinary
async function deleteImageFromCloudinary(imageUrl: string): Promise<void> {
  try {
    const publicId = extractPublicIdFromUrl(imageUrl)
    if (!publicId) {
      console.warn('Não foi possível extrair public_id da URL:', imageUrl)
      return
    }

    await new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          console.error('Erro ao deletar imagem do Cloudinary:', error)
          reject(error)
        } else {
          console.log('Imagem deletada do Cloudinary:', publicId)
          resolve(result)
        }
      })
    })
  } catch (error) {
    console.error('Erro ao deletar imagem do Cloudinary:', error)
    // Não lança erro para não interromper o fluxo de atualização do produto
  }
}

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
      imageUrl: formData.get('imageUrl') as string || undefined,
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
    console.log('validatedData.imageUrl:', validatedData.imageUrl)

    await connectDB()

    const createdProduct = await Product.create({
      ...validatedData,
      userId: session.user.id as any,
    })
    
    console.log('Produto criado com imageUrl:', createdProduct.imageUrl)

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
      imageUrl: formData.get('imageUrl') as string || undefined,
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

    // Processa imageUrl
    const imageUrlValue = formData.get('imageUrl') as string | null
    console.log('=== UPDATE PRODUCT DEBUG ===')
    console.log('imageUrl recebido:', imageUrlValue)
    console.log('imageUrl type:', typeof imageUrlValue)
    console.log('imageUrl length:', imageUrlValue?.length)
    if (imageUrlValue !== null) {
      if (imageUrlValue.trim() !== '') {
        // Se há nova URL, verifica se a imagem antiga precisa ser deletada
        if (product.imageUrl && product.imageUrl !== imageUrlValue.trim()) {
          // Se a URL mudou, deleta a imagem antiga do Cloudinary
          await deleteImageFromCloudinary(product.imageUrl)
        }
        updateData.imageUrl = imageUrlValue.trim()
        console.log('imageUrl será salvo:', updateData.imageUrl)
      } else {
        // Se foi enviado vazio, remove o campo e deleta do Cloudinary
        if (product.imageUrl) {
          await deleteImageFromCloudinary(product.imageUrl)
        }
        unsetData.imageUrl = ''
        console.log('imageUrl será removido e deletado do Cloudinary')
      }
    } else {
      console.log('imageUrl não foi enviado no formData')
    }

    // Processa outros campos
    Object.keys(validatedData).forEach(key => {
      // Pula campos de vestuário e imageUrl que já foram processados
      if (['size', 'color', 'brand', 'material', 'imageUrl'].includes(key)) {
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
    console.log('updateData:', updateData)
    console.log('unsetData:', unsetData)
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
    
    const updatedProduct = await Product.findOne({ _id: id, userId: session.user.id as any }).lean()
    console.log('Produto atualizado com imageUrl:', updatedProduct?.imageUrl)

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

    // Deleta a imagem do Cloudinary se existir
    if (product.imageUrl) {
      await deleteImageFromCloudinary(product.imageUrl)
    }

    await Product.deleteOne({ _id: id, userId: session.user.id as any })

    revalidatePath('/produtos')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    return { error: 'Erro ao deletar produto' }
  }
}


'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Product from '@/lib/models/Product'
import Movement from '@/lib/models/Movement'
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

    const pre_venda = formData.get('pre_venda') === 'true'
    const genero = formData.get('genero') as string | null

    // Helper para converter string vazia em undefined
    const emptyToUndefined = (value: string | null | undefined): string | undefined => {
      if (!value || value.trim() === '') return undefined
      return value.trim()
    }

    // Conecta ao DB antes de verificar a categoria do fornecedor
    await connectDB()

    // Verifica a categoria do fornecedor antes de processar os campos
    const supplierId = formData.get('supplierId') as string
    let supplierCategory: 'geral' | 'vestuario' | 'joia' | 'sapato' = 'geral'
    if (supplierId) {
      const mongoose = await import('mongoose')
      const Supplier = (await import('@/lib/models/Supplier')).default
      const supplier = await Supplier.findOne({ 
        _id: new mongoose.default.Types.ObjectId(supplierId),
        userId: session.user.id as any,
      }).lean()
      supplierCategory = (supplier?.category as any) || 'geral'
    }
    const isVestuarioSupplier = supplierCategory === 'vestuario'
    const isJoiaSupplier = supplierCategory === 'joia'
    const isSapatoSupplier = supplierCategory === 'sapato'

    const data: any = {
      name: formData.get('name') as string,
      nome_vitrine: emptyToUndefined(formData.get('nome_vitrine') as string),
      sku: formData.get('sku') as string || undefined,
      category: formData.get('category') as string || undefined,
      supplierId: supplierId || undefined,
      quantity: Number(formData.get('quantity')),
      minQuantity: Number(formData.get('minQuantity')),
      imageUrl: formData.get('imageUrl') as string || undefined,
      pre_venda: pre_venda,
    }

    // Campos de vestuário: só inclui se fornecedor for de vestuário
    if (isVestuarioSupplier) {
      data.size = emptyToUndefined(formData.get('size') as string)
      data.color = emptyToUndefined(formData.get('color') as string)
      data.brand = emptyToUndefined(formData.get('brand') as string)
      data.material = emptyToUndefined(formData.get('material') as string)
      data.genero = genero && genero.trim() !== '' ? genero.trim() as 'masculino' | 'feminino' | 'unissex' : undefined
    }

    // Campos de jóias: só inclui se fornecedor for de jóias
    if (isJoiaSupplier) {
      data.tipo_joia = emptyToUndefined(formData.get('tipo_joia') as string)
      data.pedra = emptyToUndefined(formData.get('pedra') as string)
      const quilateStr = formData.get('quilate') as string | null
      data.quilate = quilateStr && quilateStr.trim() !== '' ? Number(quilateStr) : undefined
      // Material também é usado para jóias
      data.material = emptyToUndefined(formData.get('material') as string)
    }

    // Campos de sapatos: só inclui se fornecedor for de sapatos
    if (isSapatoSupplier) {
      // Lê 'numeracao' (sem acentuação) do formData e mapeia para 'numeração' no banco
      const numeracaoValue = formData.get('numeracao') as string | null
      const tipoSapatoValue = formData.get('tipo_sapato') as string | null
      
      data.numeração = emptyToUndefined(numeracaoValue)
      data.tipo_sapato = emptyToUndefined(tipoSapatoValue)
      
      // Cor, marca e material também são usados para sapatos
      data.color = emptyToUndefined(formData.get('color') as string)
      data.brand = emptyToUndefined(formData.get('brand') as string)
      data.material = emptyToUndefined(formData.get('material') as string)
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

    // Verifica se deve criar movimentação inicial
    const shouldCreateInitialMovement = formData.get('createInitialMovement') === 'true'
    const initialQuantity = validatedData.quantity

    // Cria produto com quantity = 0 se for criar movimentação inicial
    const productData: any = {
      ...validatedData,
      quantity: shouldCreateInitialMovement ? 0 : validatedData.quantity,
      userId: new (await import('mongoose')).default.Types.ObjectId(session.user.id as string),
    }
    
    // Garante que numeração seja incluído explicitamente se existir
    if (validatedData.numeração !== undefined) {
      productData.numeração = validatedData.numeração
    }
    
    // Garante que campos de jóias sejam incluídos explicitamente se existirem
    if (validatedData.tipo_joia !== undefined) {
      productData.tipo_joia = validatedData.tipo_joia
    }
    if (validatedData.pedra !== undefined) {
      productData.pedra = validatedData.pedra
    }
    if (validatedData.quilate !== undefined) {
      productData.quilate = validatedData.quilate
    }

    // Usa insertOne diretamente na collection para garantir que todos os campos sejam salvos
    // Isso contorna possíveis problemas de validação do schema em cache
    const result = await Product.collection.insertOne(productData)
    
    // Busca o produto criado
    const createdProduct = await Product.findOne({ _id: result.insertedId })
    
    if (!createdProduct) {
      return { error: 'Erro ao criar produto' }
    }
    
    // Cria movimentação inicial se solicitado, houver quantidade e preço de compra
    if (shouldCreateInitialMovement && initialQuantity > 0) {
      const purchasePrice = validatedData.purchasePrice
      
      // Só cria movimentação se houver preço de compra
      if (purchasePrice) {
        const totalPrice = purchasePrice * initialQuantity

        await Movement.create({
          userId: session.user.id as any,
          productId: createdProduct._id,
          supplierId: validatedData.supplierId ? validatedData.supplierId as any : undefined,
          type: 'entrada',
          quantity: initialQuantity,
          previousQuantity: 0,
          newQuantity: initialQuantity,
          price: purchasePrice,
          totalPrice: totalPrice,
          notes: 'Movimentação inicial',
        })

        // Atualiza o estoque do produto
        await Product.updateOne(
          { _id: createdProduct._id },
          { quantity: initialQuantity }
        )
      } else {
        // Se não houver preço de compra, mantém a quantidade inicial no produto
        // mas não cria movimentação
        await Product.updateOne(
          { _id: createdProduct._id },
          { quantity: initialQuantity }
        )
      }
    }

    revalidatePath('/produtos')
    revalidatePath('/dashboard')
    revalidatePath('/movimentacoes')
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

    const pre_venda = formData.get('pre_venda') === 'true'
    const genero = formData.get('genero') as string | null

    // Helper para converter string vazia em undefined
    const emptyToUndefined = (value: string | null | undefined): string | undefined => {
      if (!value || value.trim() === '') return undefined
      return value.trim()
    }

    const data: any = {
      name: formData.get('name') as string,
      nome_vitrine: emptyToUndefined(formData.get('nome_vitrine') as string),
      sku: formData.get('sku') as string || undefined,
      category: formData.get('category') as string || undefined,
      supplierId: formData.get('supplierId') as string || undefined,
      quantity: Number(formData.get('quantity')),
      minQuantity: Number(formData.get('minQuantity')),
      size: formData.get('size') as string || undefined,
      color: formData.get('color') as string || undefined,
      brand: formData.get('brand') as string || undefined,
      material: formData.get('material') as string || undefined,
      genero: genero && genero.trim() !== '' ? genero.trim() as 'masculino' | 'feminino' | 'unissex' : undefined,
      imageUrl: formData.get('imageUrl') as string || undefined,
      pre_venda: pre_venda,
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

    // Verifica a categoria do fornecedor
    const supplierId = formData.get('supplierId') as string
    let supplierCategory: 'geral' | 'vestuario' | 'joia' | 'sapato' = 'geral'
    if (supplierId) {
      const mongoose = await import('mongoose')
      const Supplier = (await import('@/lib/models/Supplier')).default
      const supplier = await Supplier.findOne({ 
        _id: new mongoose.default.Types.ObjectId(supplierId),
        userId: session.user.id as any,
      }).lean()
      supplierCategory = (supplier?.category as any) || 'geral'
    }
    const isVestuarioSupplier = supplierCategory === 'vestuario'
    const isJoiaSupplier = supplierCategory === 'joia'
    const isSapatoSupplier = supplierCategory === 'sapato'

    // Helper para processar campos opcionais (converte string vazia em undefined)
    const processOptionalField = (value: string | null | undefined): string | undefined => {
      if (value === null || value === undefined) return undefined
      const trimmed = value.trim()
      return trimmed === '' ? undefined : trimmed
    }

    // Atualiza pre_venda (sempre salva, mesmo que false)
    updateData.pre_venda = validatedData.pre_venda !== undefined ? validatedData.pre_venda : pre_venda

    // Processa nome_vitrine (campo opcional)
    const nomeVitrineRaw = formData.get('nome_vitrine') as string | null
    const nomeVitrineValue = processOptionalField(nomeVitrineRaw)
    if (nomeVitrineValue === undefined) {
      // Se foi enviado vazio ou null, remove do banco
      unsetData.nome_vitrine = ''
    } else {
      // Se tem valor, atualiza
      updateData.nome_vitrine = nomeVitrineValue
    }

    // Processa SKU (campo opcional)
    const skuValue = processOptionalField(formData.get('sku') as string | null)
    if (skuValue === undefined) {
      unsetData.sku = ''
    } else {
      updateData.sku = skuValue
    }

    // Processa category (campo opcional)
    const categoryValue = processOptionalField(formData.get('category') as string | null)
    if (categoryValue === undefined) {
      unsetData.category = ''
    } else {
      updateData.category = categoryValue
    }

    // Processa campos de vestuário
    const size = formData.get('size') as string | null
    const color = formData.get('color') as string | null
    const brand = formData.get('brand') as string | null
    const material = formData.get('material') as string | null

    // Campos de vestuário: só atualiza se fornecedor for de vestuário
    if (isVestuarioSupplier) {
      // Processa size
      const sizeValue = processOptionalField(size)
      if (sizeValue === undefined) {
        unsetData.size = ''
      } else {
        updateData.size = sizeValue
      }

      // Processa color
      const colorValue = processOptionalField(color)
      if (colorValue === undefined) {
        unsetData.color = ''
      } else {
        updateData.color = colorValue
      }

      // Processa brand
      const brandValue = processOptionalField(brand)
      if (brandValue === undefined) {
        unsetData.brand = ''
      } else {
        updateData.brand = brandValue
      }

      // Processa material
      const materialValue = processOptionalField(material)
      if (materialValue === undefined) {
        unsetData.material = ''
      } else {
        updateData.material = materialValue
      }

      // Processa genero
      const generoValue = processOptionalField(genero)
      if (generoValue === undefined) {
        unsetData.genero = ''
      } else {
        updateData.genero = generoValue as 'masculino' | 'feminino' | 'unissex'
      }
    } else {
      // Se fornecedor não é de vestuário, remove os campos de vestuário
      unsetData.size = ''
      unsetData.color = ''
      unsetData.brand = ''
      unsetData.material = ''
      unsetData.genero = ''
    }

    // Processa campos de jóias
    if (isJoiaSupplier) {
      const tipo_joia = processOptionalField(formData.get('tipo_joia') as string | null)
      const pedra = processOptionalField(formData.get('pedra') as string | null)
      const quilateStr = formData.get('quilate') as string | null
      const quilate = quilateStr && quilateStr.trim() !== '' ? Number(quilateStr) : undefined

      if (tipo_joia === undefined) {
        unsetData.tipo_joia = ''
      } else {
        updateData.tipo_joia = tipo_joia
      }

      if (pedra === undefined) {
        unsetData.pedra = ''
      } else {
        updateData.pedra = pedra
      }

      if (quilate === undefined || isNaN(quilate)) {
        unsetData.quilate = ''
      } else {
        updateData.quilate = quilate
      }

      // Material também é usado para jóias
      const materialValue = processOptionalField(material)
      if (materialValue === undefined) {
        unsetData.material = ''
      } else {
        updateData.material = materialValue
      }
    } else {
      unsetData.tipo_joia = ''
      unsetData.pedra = ''
      unsetData.quilate = ''
    }

    // Processa campos de sapatos
    if (isSapatoSupplier) {
      // Lê 'numeracao' (sem acentuação) do formData e mapeia para 'numeração' no banco
      const numeração = processOptionalField(formData.get('numeracao') as string | null)
      const tipo_sapato = processOptionalField(formData.get('tipo_sapato') as string | null)

      if (numeração === undefined) {
        unsetData.numeração = ''
      } else {
        updateData.numeração = numeração
      }

      if (tipo_sapato === undefined) {
        unsetData.tipo_sapato = ''
      } else {
        updateData.tipo_sapato = tipo_sapato
      }

      // Cor, marca e material também são usados para sapatos
      const colorValue = processOptionalField(color)
      if (colorValue === undefined) {
        unsetData.color = ''
      } else {
        updateData.color = colorValue
      }

      const brandValue = processOptionalField(brand)
      if (brandValue === undefined) {
        unsetData.brand = ''
      } else {
        updateData.brand = brandValue
      }

      const materialValue = processOptionalField(material)
      if (materialValue === undefined) {
        unsetData.material = ''
      } else {
        updateData.material = materialValue
      }
    } else {
      unsetData.numeração = ''
      unsetData.tipo_sapato = ''
    }

    // Processa imageUrl
    const imageUrlValue = formData.get('imageUrl') as string | null

    if (imageUrlValue !== null) {
      const processedImageUrl = processOptionalField(imageUrlValue)
      if (processedImageUrl === undefined) {
        // Se foi enviado vazio, remove o campo e deleta do Cloudinary
        if (product.imageUrl) {
          await deleteImageFromCloudinary(product.imageUrl)
        }
        unsetData.imageUrl = ''
      } else {
        // Se há nova URL, verifica se a imagem antiga precisa ser deletada
        if (product.imageUrl && product.imageUrl !== processedImageUrl) {
          await deleteImageFromCloudinary(product.imageUrl)
        }
        updateData.imageUrl = processedImageUrl
      }
    }

    // Processa outros campos (não opcionais ou já processados)
    Object.keys(validatedData).forEach(key => {
      // Pula campos já processados
      if (['size', 'color', 'brand', 'material', 'imageUrl', 'pre_venda', 'genero', 'sku', 'category', 'supplierId', 'nome_vitrine', 'tipo_joia', 'pedra', 'quilate', 'numeração', 'tipo_sapato'].includes(key)) {
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
    
    // Remove campos de unsetData que também estão em updateData (para evitar conflito)
    const finalUnsetData = { ...unsetData }
    Object.keys(updateData).forEach(key => {
      if (finalUnsetData[key] !== undefined) {
        delete finalUnsetData[key]
      }
    })
    
    // Constrói a operação de update
    const updateOperation: Record<string, any> = { ...updateData }
    if (Object.keys(finalUnsetData).length > 0) {
      updateOperation.$unset = finalUnsetData
    }
    
    
    await Product.updateOne(
      { _id: id, userId: session.user.id as any },
      updateOperation
    )
    
    const updatedProduct = await Product.findOne({ _id: id, userId: session.user.id as any }).lean()

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


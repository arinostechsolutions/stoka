import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Product from '@/lib/models/Product'
import Supplier from '@/lib/models/Supplier'
import mongoose from 'mongoose'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get('supplierId')

    await connectDB()

    const filter: any = { userId: session.user.id as any }
    
    // Filtra por fornecedor se fornecido
    if (supplierId && supplierId !== 'all' && supplierId !== '') {
      try {
        // Converte para ObjectId
        const supplierObjectId = new mongoose.Types.ObjectId(supplierId)
        // Usa $and para combinar userId com $or do supplierId (busca tanto como ObjectId quanto como string)
        // Também tenta buscar quando supplierId está populado (objeto com _id)
        filter.$and = [
          { userId: session.user.id as any },
          {
            $or: [
              { supplierId: supplierObjectId },
              { supplierId: supplierId },
              { 'supplierId._id': supplierObjectId },
              { 'supplierId._id': supplierId }
            ]
          }
        ]
        // Remove userId do nível principal já que está dentro do $and
        delete filter.userId
      } catch (error) {
        console.error('Erro ao converter supplierId para ObjectId:', error)
        // Se falhar a conversão, tenta como string
        filter.$and = [
          { userId: session.user.id as any },
          {
            $or: [
              { supplierId: supplierId },
              { 'supplierId._id': supplierId }
            ]
          }
        ]
        delete filter.userId
      }
    }

    // Garante que o modelo Supplier está registrado antes do populate
    if (!mongoose.models.Supplier) {
      // Força o registro do modelo
      Supplier
    }

    // Busca produtos sem populate primeiro para verificar o formato do supplierId
    let products = await Product.find(filter)
      .select('_id name nome_vitrine imageUrl salePrice quantity supplierId brand size purchasePrice pre_venda genero')
      .sort({ name: 1 })
      .populate({
        path: 'supplierId',
        model: Supplier,
        select: 'name category',
        strictPopulate: false,
      })

    // Se não encontrou produtos e supplierId foi fornecido, tenta buscar de outra forma
    if (products.length === 0 && supplierId && supplierId !== 'all' && supplierId !== '') {
      // Tenta buscar todos os produtos do usuário e filtrar manualmente
      const allProducts = await Product.find({ userId: session.user.id as any })
        .select('_id name nome_vitrine imageUrl salePrice quantity supplierId brand size purchasePrice pre_venda genero')
        .populate({
          path: 'supplierId',
          model: Supplier,
          select: 'name category',
          strictPopulate: false,
        })
      
      // Filtra manualmente comparando supplierId como string
      products = allProducts.filter((p: any) => {
        const pSupplierId = p.supplierId?._id?.toString ? p.supplierId._id.toString() : 
                           (p.supplierId?.toString ? p.supplierId.toString() : 
                           (typeof p.supplierId === 'string' ? p.supplierId : null))
        return pSupplierId === supplierId
      })
    }
    
    // Se não encontrou produtos, busca todos para verificar se existem produtos com esse supplierId
    if (products.length === 0 && supplierId) {
      const allProducts = await Product.find({ userId: session.user.id as any })
        .select('_id name supplierId')
        .populate({
          path: 'supplierId',
          model: Supplier,
          select: 'name',
          strictPopulate: false,
        })
      const productsWithSupplier = allProducts.filter((p: any) => {
        const pSupplierId = p.supplierId?.toString ? p.supplierId.toString() : (p.supplierId?._id?.toString ? p.supplierId._id.toString() : p.supplierId)
        return pSupplierId === supplierId
      })
      if (productsWithSupplier.length > 0) {
      }
    }

    return NextResponse.json(products)
  } catch (error) {
    console.error('Erro ao carregar produtos:', error)
    return NextResponse.json(
      { error: 'Erro ao carregar produtos', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}


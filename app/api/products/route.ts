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
        const mongoose = await import('mongoose')
        filter.supplierId = new mongoose.default.Types.ObjectId(supplierId)
      } catch {
        filter.supplierId = supplierId
      }
    }

    // Garante que o modelo Supplier está registrado antes do populate
    // O import acima já registra o modelo, mas verificamos para garantir
    if (!mongoose.models.Supplier) {
      // Força o registro do modelo
      Supplier
    }

    const products = await Product.find(filter)
      .select('_id name nome_vitrine imageUrl salePrice quantity supplierId brand size purchasePrice pre_venda')
      .populate({
        path: 'supplierId',
        select: 'name',
        strictPopulate: false,
      })
      .sort({ name: 1 })
      .lean()

    return NextResponse.json(products)
  } catch (error) {
    console.error('Erro ao carregar produtos:', error)
    return NextResponse.json(
      { error: 'Erro ao carregar produtos', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}


import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Product from '@/lib/models/Product'

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

    const products = await Product.find(filter)
      .select('_id name quantity supplierId brand size purchasePrice')
      .populate('supplierId', 'name')
      .sort({ name: 1 })
      .lean()

    return NextResponse.json(products)
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao carregar produtos' },
      { status: 500 }
    )
  }
}


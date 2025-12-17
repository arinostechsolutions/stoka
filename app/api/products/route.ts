import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Product from '@/lib/models/Product'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    await connectDB()

    const products = await Product.find({ userId: session.user.id as any })
      .select('_id name quantity')
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


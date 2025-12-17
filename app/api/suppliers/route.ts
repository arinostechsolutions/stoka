import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Supplier from '@/lib/models/Supplier'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    await connectDB()

    const suppliers = await Supplier.find({ userId: session.user.id as any })
      .select('_id name category')
      .sort({ name: 1 })
      .lean()

    return NextResponse.json(suppliers)
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao carregar fornecedores' },
      { status: 500 }
    )
  }
}


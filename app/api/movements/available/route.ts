import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Movement from '@/lib/models/Movement'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    await connectDB()

    // Busca movimentações de saída que não estão associadas a nenhum cliente
    const movements = await Movement.find({
      userId: session.user.id as any,
      type: 'saida',
      $or: [
        { customerId: { $exists: false } },
        { customerId: null },
      ],
    })
      .populate('productId', 'name nome_vitrine brand size')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()

    // Serializa para JSON simples
    const serializedMovements = JSON.parse(JSON.stringify(movements))

    return NextResponse.json(serializedMovements)
  } catch (error) {
    console.error('Erro ao carregar movimentações:', error)
    return NextResponse.json(
      { error: 'Erro ao carregar movimentações' },
      { status: 500 }
    )
  }
}


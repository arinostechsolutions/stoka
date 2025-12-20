import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Customer from '@/lib/models/Customer'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    await connectDB()

    const customers = await Customer.find({ userId: session.user.id as any })
      .sort({ name: 1 })
      .lean()

    // Serializa para JSON simples
    const serializedCustomers = JSON.parse(JSON.stringify(customers))

    return NextResponse.json(serializedCustomers)
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao carregar clientes' },
      { status: 500 }
    )
  }
}


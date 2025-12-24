import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import PaymentInstallment from '@/lib/models/PaymentInstallment'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    await connectDB()

    const customerId = params.id

    // Busca todas as parcelas do cliente (pendentes e pagas)
    const installments = await PaymentInstallment.find({
      customerId: customerId,
      userId: session.user.id as any,
    })
      .populate('movementId', 'createdAt totalRevenue')
      .populate('saleGroupId')
      .sort({ dueDate: 1, installmentNumber: 1 })
      .lean()

    // Serializa para JSON
    const serializedInstallments = JSON.parse(JSON.stringify(installments))

    return NextResponse.json(serializedInstallments)
  } catch (error: any) {
    console.error('Erro ao buscar parcelas:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar parcelas' },
      { status: 500 }
    )
  }
}





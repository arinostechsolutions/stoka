import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import PaymentInstallment from '@/lib/models/PaymentInstallment'
import Movement from '@/lib/models/Movement'
import Product from '@/lib/models/Product'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { installmentId, paidAmount, paidDate, notes } = body

    if (!installmentId || !paidAmount) {
      return NextResponse.json(
        { error: 'ID da parcela e valor pago são obrigatórios' },
        { status: 400 }
      )
    }

    await connectDB()

    const installment = await PaymentInstallment.findOne({
      _id: installmentId,
      userId: session.user.id as any,
    })

    if (!installment) {
      return NextResponse.json(
        { error: 'Parcela não encontrada' },
        { status: 404 }
      )
    }

    const paidAmountNum = Number(paidAmount)
    const newPaidAmount = (installment.paidAmount || 0) + paidAmountNum
    const isFullyPaid = newPaidAmount >= installment.amount
    const paymentDate = paidDate ? new Date(paidDate) : new Date()

    // Atualiza a parcela
    await PaymentInstallment.updateOne(
      { _id: installmentId },
      {
        paidAmount: newPaidAmount,
        paidDate: paymentDate,
        isPaid: isFullyPaid,
        notes: notes || installment.notes,
      }
    )

    // Cria movimentação de entrada para o pagamento da parcela
    if (installment.movementId) {
      const movement = await Movement.findById(installment.movementId)
      if (movement && movement.productId) {
        const product = await Product.findById(movement.productId)
        if (product) {
          const previousQuantity = product.quantity
          const newQuantity = previousQuantity // Não altera estoque, apenas registra o recebimento

          await Movement.create({
            userId: session.user.id as any,
            productId: movement.productId,
            type: 'entrada',
            quantity: 0, // Não altera estoque
            previousQuantity,
            newQuantity,
            price: paidAmountNum,
            totalPrice: paidAmountNum,
            totalRevenue: paidAmountNum, // Adiciona totalRevenue para contabilizar no histórico e top clientes
            customerId: installment.customerId, // Associa ao cliente
            notes: `Pagamento de parcela ${installment.installmentNumber}/${installment.totalInstallments} - Venda parcelada${notes ? ` - ${notes}` : ''}`,
          })
        }
      }
    }

    // Revalida paths
    revalidatePath('/clientes')
    revalidatePath(`/clientes/${installment.customerId}`)
    revalidatePath('/movimentacoes')

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro ao registrar pagamento:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao registrar pagamento' },
      { status: 500 }
    )
  }
}


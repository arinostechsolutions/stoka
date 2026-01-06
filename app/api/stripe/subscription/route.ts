import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import User from '@/lib/models/User'
import { getSubscriptionInfo, formatSubscriptionStatus, formatPlanName } from '@/lib/subscription'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Você precisa estar logado' },
        { status: 401 }
      )
    }

    await connectDB()

    const user = await User.findById(session.user.id)

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    const subscriptionInfo = getSubscriptionInfo(user)

    return NextResponse.json({
      ...subscriptionInfo,
      statusFormatted: formatSubscriptionStatus(subscriptionInfo.status),
      planFormatted: formatPlanName(subscriptionInfo.plan),
      hasStripeCustomer: !!user.stripeCustomerId,
    })
  } catch (error) {
    console.error('Erro ao buscar subscription:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar informações da assinatura' },
      { status: 500 }
    )
  }
}


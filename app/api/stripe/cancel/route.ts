import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import connectDB from '@/lib/db'
import User from '@/lib/models/User'

export async function POST() {
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

    if (!user?.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'Você não possui uma assinatura ativa' },
        { status: 400 }
      )
    }

    // Cancelar assinatura no Stripe (ao final do período atual)
    const subscription = await stripe.subscriptions.update(
      user.stripeSubscriptionId,
      {
        cancel_at_period_end: true,
      }
    )

    const subscriptionData = subscription as any // eslint-disable-line

    // Atualizar usuário no banco
    await User.findByIdAndUpdate(user._id, {
      subscriptionStatus: 'canceled',
    })

    return NextResponse.json({
      success: true,
      message: 'Assinatura será cancelada ao final do período atual',
      cancelAt: subscriptionData.cancel_at 
        ? new Date(subscriptionData.cancel_at * 1000).toISOString()
        : subscriptionData.current_period_end 
          ? new Date(subscriptionData.current_period_end * 1000).toISOString()
          : null,
    })
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error)
    return NextResponse.json(
      { error: 'Erro ao cancelar assinatura' },
      { status: 500 }
    )
  }
}

// Reativar assinatura cancelada (se ainda estiver no período)
export async function DELETE() {
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

    if (!user?.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'Você não possui uma assinatura' },
        { status: 400 }
      )
    }

    // Reativar assinatura no Stripe
    const subscription = await stripe.subscriptions.update(
      user.stripeSubscriptionId,
      {
        cancel_at_period_end: false,
      }
    )

    // Atualizar usuário no banco
    await User.findByIdAndUpdate(user._id, {
      subscriptionStatus: subscription.status,
    })

    return NextResponse.json({
      success: true,
      message: 'Assinatura reativada com sucesso',
    })
  } catch (error) {
    console.error('Erro ao reativar assinatura:', error)
    return NextResponse.json(
      { error: 'Erro ao reativar assinatura' },
      { status: 500 }
    )
  }
}


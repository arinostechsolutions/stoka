import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import User from '@/lib/models/User'
import { stripe } from '@/lib/stripe'

/**
 * API para corrigir subscription de um usuário manualmente
 * 
 * GET /api/admin/fix-subscription?key=ADMIN_KEY&email=usuario@email.com
 */
export async function GET(request: NextRequest) {
  // Apenas em desenvolvimento
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Esta rota só funciona em desenvolvimento' },
      { status: 403 }
    )
  }

  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')
  const email = searchParams.get('email')

  // Verificar chave admin
  if (key !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json(
      { error: 'Chave admin inválida' },
      { status: 401 }
    )
  }

  if (!email) {
    return NextResponse.json(
      { error: 'Email é obrigatório. Use ?email=usuario@email.com' },
      { status: 400 }
    )
  }

  try {
    await connectDB()

    const user = await User.findOne({ email })

    if (!user) {
      return NextResponse.json(
        { error: `Usuário ${email} não encontrado` },
        { status: 404 }
      )
    }

    if (!user.stripeCustomerId) {
      return NextResponse.json(
        { error: 'Usuário não tem stripeCustomerId' },
        { status: 400 }
      )
    }

    // Buscar subscriptions do cliente no Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      limit: 1,
    })

    if (subscriptions.data.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma subscription encontrada no Stripe para este cliente' },
        { status: 404 }
      )
    }

    const subscription = subscriptions.data[0]
    const priceId = subscription.items.data[0].price.id

    // Determinar plano baseado no preço
    const prices = {
      test: {
        starter: process.env.STRIPE_PRICE_STARTER_TEST,
        premium: process.env.STRIPE_PRICE_PREMIUM_TEST,
      },
      live: {
        starter: process.env.STRIPE_PRICE_STARTER_LIVE,
        premium: process.env.STRIPE_PRICE_PREMIUM_LIVE,
      },
    }

    let plan: 'starter' | 'premium' | null = null

    if (priceId === prices.test.starter || priceId === prices.live.starter) {
      plan = 'starter'
    } else if (priceId === prices.test.premium || priceId === prices.live.premium) {
      plan = 'premium'
    }

    // Se não conseguiu determinar pelo priceId, verificar o valor
    if (!plan) {
      const price = await stripe.prices.retrieve(priceId)
      const amount = price.unit_amount || 0
      // R$ 49,90 = 4990 centavos, R$ 79,90 = 7990 centavos
      if (amount <= 5000) {
        plan = 'starter'
      } else {
        plan = 'premium'
      }
    }

    // Preparar dados para atualização
    const subscriptionData = subscription as any // eslint-disable-line
    const updateData: any = {
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      subscriptionStatus: subscription.status,
      plan: plan,
    }

    // Adicionar campos opcionais se existirem
    if (subscriptionData.current_period_end) {
      updateData.stripeCurrentPeriodEnd = new Date(subscriptionData.current_period_end * 1000)
    }
    
    if (subscriptionData.trial_end) {
      updateData.trialEndsAt = new Date(subscriptionData.trial_end * 1000)
    }

    // Atualizar usuário
    await User.findByIdAndUpdate(user._id, updateData)

    // Buscar usuário atualizado
    const updatedUser = await User.findById(user._id)

    if (!updatedUser) {
      return NextResponse.json({ error: 'Usuário não encontrado após atualização' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription corrigida com sucesso',
      user: {
        email: updatedUser.email,
        plan: updatedUser.plan,
        subscriptionStatus: updatedUser.subscriptionStatus,
        stripeSubscriptionId: updatedUser.stripeSubscriptionId,
        trialEndsAt: updatedUser.trialEndsAt,
      },
      stripeData: {
        subscriptionId: subscription.id,
        status: subscription.status,
        priceId: priceId,
        trialEnd: subscription.trial_end 
          ? new Date(subscription.trial_end * 1000).toISOString() 
          : null,
      },
      configuredPrices: {
        starterTest: prices.test.starter || 'NÃO CONFIGURADO',
        premiumTest: prices.test.premium || 'NÃO CONFIGURADO',
        actualPriceId: priceId,
      }
    })
  } catch (error: any) {
    console.error('Erro ao corrigir subscription:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao corrigir subscription' },
      { status: 500 }
    )
  }
}


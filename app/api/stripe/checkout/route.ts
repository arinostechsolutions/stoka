import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe, getStripePrices, TRIAL_DAYS } from '@/lib/stripe'
import connectDB from '@/lib/db'
import User from '@/lib/models/User'

// URL base do app com fallback
const getAppUrl = () => {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Você precisa estar logado' },
        { status: 401 }
      )
    }

    const { priceType } = await request.json()

    if (!priceType || !['starter', 'premium'].includes(priceType)) {
      return NextResponse.json(
        { error: 'Tipo de plano inválido' },
        { status: 400 }
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

    const prices = getStripePrices()
    const priceId = priceType === 'starter' ? prices.STARTER : prices.PREMIUM

    if (!priceId) {
      return NextResponse.json(
        { error: 'Preço não configurado no Stripe' },
        { status: 500 }
      )
    }

    // Criar ou recuperar customer do Stripe
    let customerId = user.stripeCustomerId

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user._id.toString(),
        },
      })
      customerId = customer.id

      // Salvar o customerId no usuário
      await User.findByIdAndUpdate(user._id, {
        stripeCustomerId: customerId,
      })
    }

    // Verificar se o usuário já teve um trial antes
    const hadTrialBefore = user.trialEndsAt !== undefined

    // Criar checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // Dar trial apenas se o usuário nunca teve um antes
      subscription_data: hadTrialBefore
        ? undefined
        : {
            trial_period_days: TRIAL_DAYS,
          },
      success_url: `${getAppUrl()}/checkout/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getAppUrl()}/precos`,
      metadata: {
        userId: user._id.toString(),
        plan: priceType,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      locale: 'pt-BR',
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('Erro ao criar checkout session:', error)
    return NextResponse.json(
      { error: 'Erro ao processar pagamento' },
      { status: 500 }
    )
  }
}


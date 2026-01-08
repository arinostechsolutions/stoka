import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import connectDB from '@/lib/db'
import User from '@/lib/models/User'

// Usar webhook secret diferente para dev/prod
const webhookSecret = process.env.NODE_ENV === 'development'
  ? process.env.STRIPE_WEBHOOK_SECRET_TEST
  : process.env.STRIPE_WEBHOOK_SECRET_LIVE

// Helper para extrair dados da subscription de forma segura
function getSubscriptionData(subscription: Stripe.Subscription) {
  const sub = subscription as any // eslint-disable-line
  return {
    id: sub.id as string,
    status: sub.status as string,
    currentPeriodEnd: sub.current_period_end as number | undefined,
    trialEnd: sub.trial_end as number | null,
    priceId: sub.items?.data?.[0]?.price?.id as string,
    cancelAtPeriodEnd: sub.cancel_at_period_end as boolean | undefined,
    canceledAt: sub.canceled_at as number | null,
  }
}

// Helper para criar data válida ou undefined
function safeDate(timestamp: number | undefined | null): Date | undefined {
  if (!timestamp || isNaN(timestamp)) {
    console.log('⚠️ Timestamp inválido:', timestamp)
    return undefined
  }
  const date = new Date(timestamp * 1000)
  if (isNaN(date.getTime())) {
    console.log('⚠️ Data inválida criada de:', timestamp)
    return undefined
  }
  return date
}

export async function POST(request: NextRequest) {
  console.log('\n========================================')
  console.log('🔔 WEBHOOK RECEBIDO!')
  console.log('========================================')
  console.log('⏰ Timestamp:', new Date().toISOString())
  
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  console.log('📝 Webhook Secret configurado:', webhookSecret ? `${webhookSecret.substring(0, 10)}...` : '❌ NÃO CONFIGURADO')
  console.log('🔑 Signature recebida:', signature ? `${signature.substring(0, 20)}...` : '❌ NÃO RECEBIDA')

  if (!signature || !webhookSecret) {
    console.error('❌ ERRO: Webhook secret ou signature ausente')
    return NextResponse.json(
      { error: 'Webhook secret ou signature ausente' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    console.log('✅ Assinatura verificada com sucesso!')
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ ERRO ao verificar webhook:', errorMessage)
    return NextResponse.json(
      { error: 'Webhook signature inválida' },
      { status: 400 }
    )
  }

  console.log('📦 Tipo do evento:', event.type)
  console.log('🆔 Event ID:', event.id)

  await connectDB()
  console.log('💾 Conectado ao banco de dados')

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        console.log('\n--- CHECKOUT SESSION COMPLETED ---')
        const session = event.data.object as Stripe.Checkout.Session
        
        console.log('📋 Session ID:', session.id)
        console.log('👤 Customer ID:', session.customer)
        console.log('📧 Customer Email:', session.customer_email)
        console.log('🎯 Mode:', session.mode)
        console.log('📝 Metadata:', JSON.stringify(session.metadata, null, 2))

        if (session.mode === 'subscription' && session.subscription) {
          const subscriptionRaw = await stripe.subscriptions.retrieve(
            session.subscription as string
          )
          const subscription = getSubscriptionData(subscriptionRaw)
          
          console.log('📦 Subscription ID:', subscription.id)
          console.log('📊 Subscription Status:', subscription.status)

          const userId = session.metadata?.userId
          const plan = session.metadata?.plan as 'starter' | 'premium'

          console.log('🆔 User ID dos metadata:', userId || '❌ NÃO ENCONTRADO')
          console.log('📋 Plano dos metadata:', plan || '❌ NÃO ENCONTRADO')

          if (userId) {
            const updateData: Record<string, unknown> = {
              stripeSubscriptionId: subscription.id,
              stripePriceId: subscription.priceId,
              subscriptionStatus: subscription.status,
              plan: plan,
            }
            
            // Só adicionar datas se forem válidas
            const periodEnd = safeDate(subscription.currentPeriodEnd)
            const trialEnd = safeDate(subscription.trialEnd)
            
            if (periodEnd) updateData.stripeCurrentPeriodEnd = periodEnd
            if (trialEnd) updateData.trialEndsAt = trialEnd
            
            console.log('📝 Dados a atualizar:', JSON.stringify(updateData, null, 2))
            
            const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true })
            
            if (updatedUser) {
              console.log('✅ Usuário atualizado com sucesso!')
              console.log('   Email:', updatedUser.email)
              console.log('   Plan:', updatedUser.plan)
              console.log('   Status:', updatedUser.subscriptionStatus)
            } else {
              console.log('❌ Usuário não encontrado com ID:', userId)
            }
          } else {
            console.log('⚠️ userId não encontrado nos metadata, tentando por email...')
            
            if (session.customer_email) {
              const user = await User.findOne({ email: session.customer_email })
              if (user) {
                console.log('✅ Usuário encontrado por email:', user.email)
                
                const updateData: Record<string, unknown> = {
                  stripeCustomerId: session.customer as string,
                  stripeSubscriptionId: subscription.id,
                  stripePriceId: subscription.priceId,
                  subscriptionStatus: subscription.status,
                  plan: plan,
                }
                
                const periodEnd = safeDate(subscription.currentPeriodEnd)
                const trialEnd = safeDate(subscription.trialEnd)
                if (periodEnd) updateData.stripeCurrentPeriodEnd = periodEnd
                if (trialEnd) updateData.trialEndsAt = trialEnd
                
                await User.findByIdAndUpdate(user._id, updateData)
                console.log('✅ Usuário atualizado por email!')
              } else {
                console.log('❌ Usuário não encontrado por email:', session.customer_email)
              }
            }
          }
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        console.log(`\n--- ${event.type.toUpperCase()} ---`)
        const subscriptionRaw = event.data.object as Stripe.Subscription
        const subscription = getSubscriptionData(subscriptionRaw)
        const customerId = (subscriptionRaw as any).customer as string // eslint-disable-line

        console.log('📦 Subscription ID:', subscription.id)
        console.log('👤 Customer ID:', customerId)
        console.log('📊 Status:', subscription.status)
        console.log('💰 Price ID:', subscription.priceId)
        console.log('🚫 Cancel at period end:', subscription.cancelAtPeriodEnd)
        console.log('⏰ Canceled at:', subscription.canceledAt)

        // Encontrar usuário pelo customerId
        const user = await User.findOne({ stripeCustomerId: customerId })
        console.log('🔍 Busca por stripeCustomerId:', customerId)
        console.log('👤 Usuário encontrado:', user ? user.email : '❌ NÃO ENCONTRADO')

        if (user) {
          // Determinar o plano baseado no preço
          const priceId = subscription.priceId
          let plan: 'starter' | 'premium' | null = null

          // Verificar qual plano é baseado no priceId
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

          console.log('💰 Preços configurados:')
          console.log('   Starter Test:', prices.test.starter || '❌ NÃO CONFIGURADO')
          console.log('   Premium Test:', prices.test.premium || '❌ NÃO CONFIGURADO')
          console.log('   Price ID recebido:', priceId)

          if (priceId === prices.test.starter || priceId === prices.live.starter) {
            plan = 'starter'
          } else if (priceId === prices.test.premium || priceId === prices.live.premium) {
            plan = 'premium'
          }

          console.log('📋 Plano determinado:', plan || '❌ NÃO DETERMINADO')

          // Se não conseguiu determinar, tentar pelo valor do preço
          if (!plan) {
            console.log('⚠️ Tentando determinar plano pelo valor...')
            try {
              const price = await stripe.prices.retrieve(priceId)
              const amount = price.unit_amount || 0
              console.log('💵 Valor do preço:', amount, 'centavos')
              
              if (amount <= 5000) {
                plan = 'starter'
              } else {
                plan = 'premium'
              }
              console.log('📋 Plano determinado pelo valor:', plan)
            } catch (e) {
              console.log('❌ Erro ao buscar preço:', e)
            }
          }

          const periodEnd = safeDate(subscription.currentPeriodEnd)
          const trialEnd = safeDate(subscription.trialEnd)
          
          // Se cancel_at_period_end for true e estiver em trial, marcar como canceled e remover trialEndsAt
          // Isso garante bloqueio imediato quando usuário cancela durante trial
          const isTrialing = subscription.status === 'trialing' && trialEnd && new Date(trialEnd.getTime()) > new Date()
          // Verificar também canceledAt para garantir que foi cancelado
          const isCanceled = subscription.canceledAt !== null && subscription.canceledAt !== undefined
          const shouldBlockTrial = (subscription.cancelAtPeriodEnd || isCanceled) && isTrialing
          
          console.log('🔍 Verificações:')
          console.log('   Está em trial?', isTrialing)
          console.log('   Foi cancelado?', isCanceled)
          console.log('   Cancel at period end?', subscription.cancelAtPeriodEnd)
          console.log('   Deve bloquear trial?', shouldBlockTrial)
          
          const updateData: Record<string, unknown> = {
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            // Se estiver cancelando durante trial, marcar como canceled imediatamente
            subscriptionStatus: shouldBlockTrial ? 'canceled' : subscription.status,
            plan: plan,
          }
          
          if (periodEnd) updateData.stripeCurrentPeriodEnd = periodEnd
          
          // Se cancelar durante trial, remover trialEndsAt para bloquear acesso imediatamente
          if (shouldBlockTrial || subscription.status === 'canceled') {
            console.log('⚠️ Cancelamento durante trial detectado - removendo trialEndsAt e bloqueando acesso')
            updateData.trialEndsAt = null
          } else if (trialEnd) {
            updateData.trialEndsAt = trialEnd
          }

          console.log('📝 Dados a atualizar:', JSON.stringify(updateData, null, 2))

          await User.findByIdAndUpdate(user._id, updateData)
          console.log('✅ Usuário atualizado com sucesso!')
        } else {
          console.log('⚠️ Usuário não encontrado, tentando buscar por email do customer...')
          
          try {
            const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
            if (customer.email) {
              const userByEmail = await User.findOne({ email: customer.email })
              if (userByEmail) {
                console.log('✅ Usuário encontrado por email:', userByEmail.email)
                
                const priceId = subscription.priceId
                let plan: 'starter' | 'premium' | null = null
                
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

                if (priceId === prices.test.starter || priceId === prices.live.starter) {
                  plan = 'starter'
                } else if (priceId === prices.test.premium || priceId === prices.live.premium) {
                  plan = 'premium'
                }

                if (!plan) {
                  const price = await stripe.prices.retrieve(priceId)
                  const amount = price.unit_amount || 0
                  plan = amount <= 5000 ? 'starter' : 'premium'
                }

                const periodEndByEmail = safeDate(subscription.currentPeriodEnd)
                const trialEndByEmail = safeDate(subscription.trialEnd)
                
                // Se cancel_at_period_end for true e estiver em trial, marcar como canceled e remover trialEndsAt
                const isTrialingByEmail = subscription.status === 'trialing' && trialEndByEmail && new Date(trialEndByEmail.getTime()) > new Date()
                // Verificar também canceledAt para garantir que foi cancelado
                const isCanceledByEmail = subscription.canceledAt !== null && subscription.canceledAt !== undefined
                const shouldBlockTrialByEmail = (subscription.cancelAtPeriodEnd || isCanceledByEmail) && isTrialingByEmail
                
                console.log('🔍 Verificações (por email):')
                console.log('   Está em trial?', isTrialingByEmail)
                console.log('   Foi cancelado?', isCanceledByEmail)
                console.log('   Cancel at period end?', subscription.cancelAtPeriodEnd)
                console.log('   Deve bloquear trial?', shouldBlockTrialByEmail)
                
                const updateByEmail: Record<string, unknown> = {
                  stripeCustomerId: customerId,
                  stripeSubscriptionId: subscription.id,
                  stripePriceId: priceId,
                  // Se estiver cancelando durante trial, marcar como canceled imediatamente
                  subscriptionStatus: shouldBlockTrialByEmail ? 'canceled' : subscription.status,
                  plan: plan,
                }
                
                if (periodEndByEmail) updateByEmail.stripeCurrentPeriodEnd = periodEndByEmail
                
                // Se cancelar durante trial, remover trialEndsAt para bloquear acesso imediatamente
                if (shouldBlockTrialByEmail || subscription.status === 'canceled') {
                  console.log('⚠️ Cancelamento durante trial detectado - removendo trialEndsAt e bloqueando acesso')
                  updateByEmail.trialEndsAt = null
                } else if (trialEndByEmail) {
                  updateByEmail.trialEndsAt = trialEndByEmail
                }
                
                await User.findByIdAndUpdate(userByEmail._id, updateByEmail)
                console.log('✅ Usuário atualizado por email!')
              }
            }
          } catch (e) {
            console.log('❌ Erro ao buscar customer:', e)
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        console.log('\n--- SUBSCRIPTION DELETED ---')
        const subscriptionRaw = event.data.object as Stripe.Subscription
        const customerId = (subscriptionRaw as any).customer as string // eslint-disable-line

        console.log('📦 Subscription ID:', subscriptionRaw.id)
        console.log('👤 Customer ID:', customerId)

        const user = await User.findOne({ stripeCustomerId: customerId })
        console.log('👤 Usuário encontrado:', user ? user.email : '❌ NÃO ENCONTRADO')

        if (user) {
          await User.findByIdAndUpdate(user._id, {
            subscriptionStatus: 'canceled',
            plan: null,
            stripeSubscriptionId: undefined,
            stripePriceId: undefined,
          })
          console.log('✅ Subscription cancelada no banco!')
        }
        break
      }

      case 'invoice.payment_succeeded': {
        console.log('\n--- INVOICE PAYMENT SUCCEEDED ---')
        const invoice = event.data.object as Stripe.Invoice
        
        console.log('📄 Invoice ID:', invoice.id)
        console.log('👤 Customer ID:', invoice.customer)
        console.log('💰 Amount Paid:', invoice.amount_paid)

        const subscriptionId = (invoice as any).subscription as string | null // eslint-disable-line

        if (subscriptionId) {
          const subscriptionRaw = await stripe.subscriptions.retrieve(subscriptionId)
          const subscription = getSubscriptionData(subscriptionRaw)

          const customerId = invoice.customer as string
          const user = await User.findOne({ stripeCustomerId: customerId })
          console.log('👤 Usuário encontrado:', user ? user.email : '❌ NÃO ENCONTRADO')

          if (user) {
            const invoiceUpdate: Record<string, unknown> = {
              subscriptionStatus: subscription.status,
            }
            
            const invoicePeriodEnd = safeDate(subscription.currentPeriodEnd)
            if (invoicePeriodEnd) invoiceUpdate.stripeCurrentPeriodEnd = invoicePeriodEnd
            
            await User.findByIdAndUpdate(user._id, invoiceUpdate)
            console.log('✅ Período atualizado!')
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        console.log('\n--- INVOICE PAYMENT FAILED ---')
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        console.log('📄 Invoice ID:', invoice.id)
        console.log('👤 Customer ID:', customerId)

        const user = await User.findOne({ stripeCustomerId: customerId })
        console.log('👤 Usuário encontrado:', user ? user.email : '❌ NÃO ENCONTRADO')

        if (user) {
          await User.findByIdAndUpdate(user._id, {
            subscriptionStatus: 'past_due',
          })
          console.log('⚠️ Status atualizado para past_due!')
        }
        break
      }

      case 'customer.created': {
        console.log('\n--- CUSTOMER CREATED ---')
        const customer = event.data.object as Stripe.Customer
        
        console.log('👤 Customer ID:', customer.id)
        console.log('📧 Customer Email:', customer.email)
        console.log('📝 Metadata:', JSON.stringify(customer.metadata, null, 2))

        if (customer.email) {
          const user = await User.findOne({ email: customer.email })
          if (user) {
            await User.findByIdAndUpdate(user._id, {
              stripeCustomerId: customer.id,
            })
            console.log('✅ stripeCustomerId salvo para:', user.email)
          } else {
            console.log('⚠️ Usuário não encontrado com email:', customer.email)
          }
        }
        break
      }

      default:
        console.log(`\n⚠️ Evento não tratado: ${event.type}`)
    }

    console.log('\n========================================')
    console.log('✅ WEBHOOK PROCESSADO COM SUCESSO!')
    console.log('========================================\n')

    return NextResponse.json({ received: true })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : ''
    console.error('\n========================================')
    console.error('❌ ERRO AO PROCESSAR WEBHOOK:', errorMessage)
    console.error('Stack:', errorStack)
    console.error('========================================\n')
    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    )
  }
}

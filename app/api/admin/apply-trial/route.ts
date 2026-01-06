import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import User from '@/lib/models/User'

// Configurações do trial
const TRIAL_DAYS = 7
const DEFAULT_PLAN = 'premium' // Dar acesso total durante o trial

/**
 * API para aplicar trial a todos os usuários existentes sem assinatura.
 * 
 * IMPORTANTE: Esta rota é protegida por uma chave secreta.
 * 
 * Para executar, faça uma requisição POST:
 * curl -X POST http://localhost:3000/api/admin/apply-trial \
 *   -H "Content-Type: application/json" \
 *   -H "x-admin-key: SUA_CHAVE_SECRETA"
 * 
 * Ou acesse no navegador (apenas em desenvolvimento):
 * http://localhost:3000/api/admin/apply-trial?key=SUA_CHAVE_SECRETA
 */

export async function POST(request: NextRequest) {
  try {
    // Verificar chave de admin
    const adminKey = request.headers.get('x-admin-key')
    const expectedKey = process.env.ADMIN_SECRET_KEY

    if (!expectedKey) {
      return NextResponse.json(
        { error: 'ADMIN_SECRET_KEY não configurada' },
        { status: 500 }
      )
    }

    if (adminKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Chave de admin inválida' },
        { status: 401 }
      )
    }

    await connectDB()

    // Calcular data de fim do trial (7 dias a partir de agora)
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS)

    // Buscar usuários sem subscription
    const usersWithoutSubscription = await User.find({
      $or: [
        { subscriptionStatus: { $exists: false } },
        { subscriptionStatus: null },
        { subscriptionStatus: '' },
      ]
    }).select('email name')

    if (usersWithoutSubscription.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Todos os usuários já possuem assinatura configurada',
        usersUpdated: 0,
      })
    }

    // Aplicar trial a todos
    const result = await User.updateMany(
      {
        $or: [
          { subscriptionStatus: { $exists: false } },
          { subscriptionStatus: null },
          { subscriptionStatus: '' },
        ]
      },
      {
        $set: {
          subscriptionStatus: 'trialing',
          plan: DEFAULT_PLAN,
          trialEndsAt: trialEndsAt,
        }
      }
    )

    return NextResponse.json({
      success: true,
      message: `Trial de ${TRIAL_DAYS} dias aplicado com sucesso`,
      usersUpdated: result.modifiedCount,
      plan: DEFAULT_PLAN,
      trialEndsAt: trialEndsAt.toISOString(),
      users: usersWithoutSubscription.map(u => ({ email: u.email, name: u.name })),
    })

  } catch (error) {
    console.error('Erro ao aplicar trial:', error)
    return NextResponse.json(
      { error: 'Erro ao aplicar trial' },
      { status: 500 }
    )
  }
}

// GET para facilitar teste em desenvolvimento
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

  if (!key) {
    return NextResponse.json({
      message: 'API para aplicar trial a usuários existentes',
      usage: 'GET /api/admin/apply-trial?key=SUA_ADMIN_SECRET_KEY',
      note: 'Adicione ADMIN_SECRET_KEY no seu .env.local',
    })
  }

  // Criar uma request fake com o header
  const fakeRequest = new NextRequest(request.url, {
    headers: {
      'x-admin-key': key,
    },
  })

  return POST(fakeRequest)
}


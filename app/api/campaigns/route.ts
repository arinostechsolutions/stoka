import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Campaign from '@/lib/models/Campaign'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    await connectDB()

    const campaigns = await Campaign.find({ userId: session.user.id as any })
      .sort({ name: 1 })
      .lean()

    // Serializa para JSON simples
    const serializedCampaigns = JSON.parse(JSON.stringify(campaigns))

    return NextResponse.json(serializedCampaigns)
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao carregar campanhas' },
      { status: 500 }
    )
  }
}


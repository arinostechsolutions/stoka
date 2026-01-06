import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import User from '@/lib/models/User'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { completed } = await request.json()

    await connectDB()

    await User.findByIdAndUpdate(session.user.id, {
      tutorialCompleted: completed,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao atualizar tutorial:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar tutorial' },
      { status: 500 }
    )
  }
}


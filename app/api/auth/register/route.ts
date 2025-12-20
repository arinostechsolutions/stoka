import { NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import User from '@/lib/models/User'
import { hashPassword } from '@/lib/auth'
import { registerSchema } from '@/lib/validations'

export async function POST(request: Request) {
  try {
    const body = await request.json()    
    const validatedData = registerSchema.parse(body)
    try {
      await connectDB()
    } catch (dbError: any) {
      console.error('Erro ao conectar com MongoDB:', dbError.message)
      console.error('Stack:', dbError.stack)
      return NextResponse.json(
        { 
          error: 'Erro ao conectar com o banco de dados',
          details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
        },
        { status: 500 }
      )
    }

    const emailToCheck = validatedData.email.toLowerCase().trim()
    const existingUser = await User.findOne({ email: emailToCheck })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(validatedData.password)
    const user = await User.create({
      name: validatedData.name.trim(),
      email: emailToCheck,
      password: hashedPassword,
    })
    return NextResponse.json(
      { message: 'Conta criada com sucesso', userId: user._id.toString() },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Erro ao registrar usuário:', error)
    console.error('Stack:', error.stack)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 400 }
      )
    }

    if (error.name === 'ValidationError') {
      const firstError = Object.values(error.errors)[0] as any
      return NextResponse.json(
        { error: firstError?.message || 'Dados inválidos' },
        { status: 400 }
      )
    }

    // Log completo do erro para debug
    console.error('Erro completo:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    })

    return NextResponse.json(
      { 
        error: 'Erro ao criar conta',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}


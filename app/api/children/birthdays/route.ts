import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Customer from '@/lib/models/Customer'

// Força renderização dinâmica
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    try {
      await connectDB()
    } catch (dbError: any) {
      console.error('Erro ao conectar com o banco de dados:', dbError.message)
      return NextResponse.json(
        { error: 'Erro ao conectar com o banco de dados. Tente novamente em alguns instantes.' },
        { status: 503 }
      )
    }

    // Busca todos os clientes do usuário
    const customers = await Customer.find({ userId: session.user.id as any })
      .select('_id name phone instagram children')
      .lean()

    // Filtra crianças com aniversário no mês atual
    const now = new Date()
    const currentMonth = now.getMonth() + 1 // 1-12
    const currentYear = now.getFullYear()

    const childrenWithBirthdays: Array<{
      _id: string
      customerId: string
      customerName: string
      customerPhone?: string
      customerInstagram?: string
      childName: string
      birthday: Date
      age?: number
      size?: string | string[]
      gender?: 'masculino' | 'feminino'
    }> = []

    customers.forEach((customer: any) => {
      if (customer.children && Array.isArray(customer.children)) {
        customer.children.forEach((child: any) => {
          if (child.birthday) {
            const birthday = new Date(child.birthday)
            const birthdayMonth = birthday.getMonth() + 1 // 1-12
            
            if (birthdayMonth === currentMonth) {
              // Calcula a idade
              let age: number | undefined = child.age
              if (!age && birthday) {
                const today = new Date()
                age = today.getFullYear() - birthday.getFullYear()
                const monthDiff = today.getMonth() - birthday.getMonth()
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
                  age--
                }
              }

              childrenWithBirthdays.push({
                _id: child._id?.toString() || `${customer._id}-${child.name}`,
                customerId: customer._id.toString(),
                customerName: customer.name,
                customerPhone: customer.phone,
                customerInstagram: customer.instagram,
                childName: child.name,
                birthday: birthday,
                age: age,
                size: child.size,
                gender: child.gender,
              })
            }
          }
        })
      }
    })

    // Ordena por dia do mês
    childrenWithBirthdays.sort((a, b) => {
      const dayA = a.birthday.getDate()
      const dayB = b.birthday.getDate()
      return dayA - dayB
    })

    // Serializa para JSON simples
    const serialized = JSON.parse(JSON.stringify(childrenWithBirthdays))

    return NextResponse.json({ children: serialized })
  } catch (error) {
    console.error('Erro ao buscar aniversários:', error)
    return NextResponse.json(
      { error: 'Erro ao carregar aniversários' },
      { status: 500 }
    )
  }
}


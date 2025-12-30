import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import StoreAnalytics from '@/lib/models/StoreAnalytics'
import PublicStore from '@/lib/models/PublicStore'

// Função auxiliar para detectar tipo de dispositivo
function detectDeviceType(userAgent: string): 'mobile' | 'desktop' | 'tablet' {
  const ua = userAgent.toLowerCase()
  
  // Tablets
  if (ua.includes('tablet') || ua.includes('ipad') || (ua.includes('android') && !ua.includes('mobile'))) {
    return 'tablet'
  }
  
  // Mobile
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone') || ua.includes('ipod')) {
    return 'mobile'
  }
  
  // Desktop (padrão)
  return 'desktop'
}

// Função para obter IP do cliente
function getClientIP(request: Request): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return undefined
}

export async function POST(request: Request) {
  try {
    await connectDB()

    // Tenta ler como JSON primeiro, se falhar tenta como texto (sendBeacon)
    let body: any
    const contentType = request.headers.get('content-type')
    
    if (contentType?.includes('application/json')) {
      body = await request.json()
    } else {
      // Para sendBeacon que envia como Blob
      const text = await request.text()
      try {
        body = JSON.parse(text)
      } catch {
        // Se não conseguir parsear, tenta ler como FormData
        const formData = await request.formData()
        body = {
          storeId: formData.get('storeId'),
          sessionId: formData.get('sessionId'),
          eventType: formData.get('eventType'),
          data: formData.get('data') ? JSON.parse(formData.get('data') as string) : {},
        }
      }
    }

    const {
      storeId,
      sessionId,
      eventType,
      data,
    } = body

    if (!storeId || !sessionId || !eventType) {
      return NextResponse.json(
        { error: 'storeId, sessionId e eventType são obrigatórios' },
        { status: 400 }
      )
    }

    // Verifica se a loja existe
    const store = await PublicStore.findById(storeId).lean()
    if (!store) {
      return NextResponse.json(
        { error: 'Loja não encontrada' },
        { status: 404 }
      )
    }

    const userAgent = request.headers.get('user-agent') || ''
    const deviceType = detectDeviceType(userAgent)
    const ipAddress = getClientIP(request)
    const referrer = request.headers.get('referer') || undefined

    // Busca ou cria sessão
    let analytics = await StoreAnalytics.findOne({
      storeId,
      sessionId,
    })

    if (!analytics) {
      // Cria nova sessão
      analytics = new StoreAnalytics({
        storeId,
        sessionId,
        deviceType,
        userAgent,
        ipAddress,
        referrer,
        startTime: new Date(),
        pageViews: 1,
        productsViewed: [],
        productsSelected: [],
        whatsappClicks: 0,
        filtersUsed: {},
        imagesExpanded: [],
      })
    } else {
      // Atualiza sessão existente
      analytics.pageViews += 1
      analytics.updatedAt = new Date()
    }

    // Processa eventos
    switch (eventType) {
      case 'page_view':
        // Já incrementado acima
        break

      case 'product_view':
        if (data?.productId && !analytics.productsViewed.includes(data.productId)) {
          analytics.productsViewed.push(data.productId)
        }
        break

      case 'product_select':
        if (data?.productId && !analytics.productsSelected.includes(data.productId)) {
          analytics.productsSelected.push(data.productId)
        }
        break

      case 'product_unselect':
        if (data?.productId) {
          analytics.productsSelected = analytics.productsSelected.filter(
            (id: string) => id !== data.productId
          )
        }
        break

      case 'whatsapp_click':
        analytics.whatsappClicks += 1
        break

      case 'filter_used':
        if (data?.filterType && data?.filterValue) {
          if (data.filterType === 'size') {
            analytics.filtersUsed.size = data.filterValue
          } else if (data.filterType === 'genero') {
            analytics.filtersUsed.genero = data.filterValue
          }
        }
        break

      case 'image_expand':
        if (data?.productId && !analytics.imagesExpanded.includes(data.productId)) {
          analytics.imagesExpanded.push(data.productId)
        }
        break

      case 'session_end':
        analytics.endTime = new Date()
        if (analytics.startTime) {
          analytics.timeOnPage = Math.floor(
            (analytics.endTime.getTime() - analytics.startTime.getTime()) / 1000
          )
        }
        break

      default:
        break
    }

    await analytics.save()

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro ao salvar analytics:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar analytics', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')

    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId é obrigatório' },
        { status: 400 }
      )
    }

    await connectDB()

    // Busca analytics da loja
    const analytics = await StoreAnalytics.find({ storeId })
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json(analytics)
  } catch (error: any) {
    console.error('Erro ao buscar analytics:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar analytics', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')

    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId é obrigatório' },
        { status: 400 }
      )
    }

    await connectDB()

    // Verifica se a loja existe e pertence ao usuário
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const store = await PublicStore.findOne({
      _id: storeId,
      userId: session.user.id as any,
    }).lean()

    if (!store) {
      return NextResponse.json(
        { error: 'Loja não encontrada ou sem permissão' },
        { status: 404 }
      )
    }

    // Deleta todos os analytics da loja
    const result = await StoreAnalytics.deleteMany({ storeId })

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `${result.deletedCount} registro(s) de analytics deletado(s)`,
    })
  } catch (error: any) {
    console.error('Erro ao deletar analytics:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar analytics', details: error.message },
      { status: 500 }
    )
  }
}


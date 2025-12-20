import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Product from '@/lib/models/Product'
import Movement from '@/lib/models/Movement'
import { productSchema } from '@/lib/validations'
import { z } from 'zod'

// Função helper para converter string vazia em undefined
const emptyToUndefined = (value: string | undefined): string | undefined => {
  return value && value.trim() !== '' ? value.trim() : undefined
}

// Função helper para parsear número (aceita vírgula ou ponto)
const parseNumber = (value: string | undefined): number | undefined => {
  if (!value || value.trim() === '') return undefined
  const parsed = Number(String(value).replace(',', '.'))
  return !isNaN(parsed) && parsed >= 0 ? parsed : undefined
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const supplierId = formData.get('supplierId') as string

    if (!file) {
      return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })
    }

    // Lê o CSV
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV deve ter pelo menos uma linha de dados (além do cabeçalho)' }, { status: 400 })
    }

    // Processa cabeçalho (normaliza para lowercase e remove espaços)
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    
    const results = {
      success: [] as { line: number; product: string }[],
      errors: [] as { line: number; error: string; data?: any }[]
    }

    await connectDB()

    // Processa cada linha (pula o cabeçalho)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue // Pula linhas vazias

      // Processa valores (considera vírgulas dentro de aspas)
      // Usa split simples primeiro, depois processa aspas se necessário
      const values: string[] = []
      
      // Se a linha não tem aspas, usa split simples (mais rápido e confiável)
      if (!line.includes('"')) {
        values.push(...line.split(',').map(v => v.trim()))
      } else {
        // Se tem aspas, processa manualmente
        let currentValue = ''
        let inQuotes = false

        for (let j = 0; j < line.length; j++) {
          const char = line[j]
          if (char === '"') {
            inQuotes = !inQuotes
          } else if (char === ',' && !inQuotes) {
            values.push(currentValue.trim())
            currentValue = ''
          } else {
            currentValue += char
          }
        }
        values.push(currentValue.trim()) // Último valor
      }
      
      // Garante que temos o mesmo número de valores que headers (preenche com strings vazias se necessário)
      while (values.length < headers.length) {
        values.push('')
      }
      
      // Limita ao número de headers (caso tenha mais valores que headers)
      if (values.length > headers.length) {
        values.splice(headers.length)
      }

      // Cria objeto com os dados da linha
      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })

      try {
        // Verifica se deve criar movimentação inicial (normaliza o valor)
        // IMPORTANTE: Lê ANTES de mapear os outros campos para evitar que seja atribuído ao material
        const criarMovimentacaoValue = (row.criar_movimentacao_inicial || row.movimentacao_inicial || '').trim().toLowerCase()
        const createInitialMovement = 
          criarMovimentacaoValue === 'true' || 
          criarMovimentacaoValue === '1' ||
          criarMovimentacaoValue === 'sim' ||
          criarMovimentacaoValue === 'yes'

        // Mapeia campos do CSV para o schema
        // IMPORTANTE: Não inclui criar_movimentacao_inicial no productData
        const preVendaValue = (row.pre_venda || row.prevenda || row['pre venda'] || '').trim().toLowerCase()
        const preVenda = preVendaValue === 'true' || preVendaValue === '1' || preVendaValue === 'sim' || preVendaValue === 'yes'
        
        const productData: any = {
          name: (row.nome || row.name || '').trim(),
          sku: emptyToUndefined(row.sku),
          category: emptyToUndefined(row.categoria || row.category),
          supplierId: supplierId && supplierId !== '' ? supplierId : undefined,
          quantity: Number(row.quantidade || row.quantity || 0),
          minQuantity: Number(row.estoque_minimo || row.minquantity || row['estoque minimo'] || 0),
          purchasePrice: parseNumber(row.preco_compra || row.purchaseprice || row['preco compra']),
          salePrice: parseNumber(row.preco_venda || row.saleprice || row['preco venda']),
          size: emptyToUndefined(row.tamanho || row.size),
          color: emptyToUndefined(row.cor || row.color),
          brand: emptyToUndefined(row.marca || row.brand),
          material: emptyToUndefined(row.material),
          pre_venda: preVenda || undefined,
          genero: emptyToUndefined(row.genero || row.gender),
        }

        // Remove campos undefined antes de validar
        Object.keys(productData).forEach(key => {
          if (productData[key] === undefined) {
            delete productData[key]
          }
        })

        // Valida com Zod
        const validated = productSchema.parse(productData)
        
        const initialQuantity = validated.quantity

        // Cria produto com quantity = 0 se for criar movimentação inicial
        const productToCreate = {
          ...validated,
          quantity: createInitialMovement ? 0 : initialQuantity,
          userId: session.user.id as any,
        }

        // Cria o produto
        const product = await Product.create(productToCreate)

        // Cria movimentação inicial se solicitado, houver quantidade e preço de compra
        if (createInitialMovement && initialQuantity > 0) {
          const purchasePrice = validated.purchasePrice
          
          // Só cria movimentação se houver preço de compra
          if (purchasePrice) {
            const totalPrice = purchasePrice * initialQuantity

            await Movement.create({
              userId: session.user.id as any,
              productId: product._id,
              supplierId: validated.supplierId ? validated.supplierId as any : undefined,
              type: 'entrada',
              quantity: initialQuantity,
              previousQuantity: 0,
              newQuantity: initialQuantity,
              price: purchasePrice,
              totalPrice: totalPrice,
              notes: 'Movimentação inicial (importação CSV)',
            })

            // Atualiza o estoque do produto
            await Product.updateOne(
              { _id: product._id },
              { quantity: initialQuantity }
            )
          } else {
            // Se não houver preço de compra, mantém a quantidade inicial no produto
            // mas não cria movimentação
            await Product.updateOne(
              { _id: product._id },
              { quantity: initialQuantity }
            )
          }
        }

        results.success.push({ line: i + 1, product: product.name })
      } catch (error: any) {
        results.errors.push({
          line: i + 1,
          error: error instanceof z.ZodError 
            ? error.errors[0].message 
            : error.message || 'Erro desconhecido',
          data: row
        })
      }
    }

    return NextResponse.json({
      success: true,
      imported: results.success.length,
      errors: results.errors.length,
      details: results
    })
  } catch (error: any) {
    console.error('Erro ao processar CSV:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao processar CSV' },
      { status: 500 }
    )
  }
}


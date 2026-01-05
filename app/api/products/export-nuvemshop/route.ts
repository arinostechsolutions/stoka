import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Product from '@/lib/models/Product'

// Função para criar slug amigável
function createSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .trim()
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
}

// Função para escapar valores CSV (formato Nuvemshop usa ;)
function escapeCSV(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return ''
  const str = String(value)
  // Se contém ; ou " ou quebra de linha, precisa ser escapado
  if (str.includes(';') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

// Mapeia gênero para formato Nuvemshop
function mapGenero(genero: string | undefined): string {
  if (!genero) return ''
  const map: Record<string, string> = {
    'masculino': 'Masculino',
    'feminino': 'Feminino',
    'unissex': 'Unissex',
  }
  return map[genero.toLowerCase()] || ''
}

interface ProductData {
  _id: string
  name: string
  nome_vitrine?: string
  sku?: string
  category?: string
  quantity: number
  purchasePrice?: number
  salePrice?: number
  size?: string
  color?: string
  brand?: string
  material?: string
  imageUrl?: string
  genero?: string
  numeração?: string
}

interface NuvemshopRow {
  identificadorUrl: string
  nome: string
  categorias: string
  variacaoNome1: string
  variacaoValor1: string
  variacaoNome2: string
  variacaoValor2: string
  variacaoNome3: string
  variacaoValor3: string
  preco: string
  precoPromocional: string
  peso: string
  altura: string
  largura: string
  comprimento: string
  estoque: string
  sku: string
  codigoBarras: string
  exibirNaLoja: string
  freteGratis: string
  descricao: string
  tags: string
  tituloSEO: string
  descricaoSEO: string
  marca: string
  produtoFisico: string
  mpn: string
  sexo: string
  faixaEtaria: string
  custo: string
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    await connectDB()

    // Busca todos os produtos do usuário
    const products = await Product.find({ userId: session.user.id as any })
      .sort({ name: 1, size: 1, color: 1 })
      .lean() as unknown as ProductData[]

    if (products.length === 0) {
      return NextResponse.json({ error: 'Nenhum produto encontrado' }, { status: 404 })
    }

    // Agrupa produtos pelo nome base (para criar variantes)
    // Usa nome_vitrine se existir, senão usa name
    const productGroups = new Map<string, ProductData[]>()

    products.forEach(product => {
      // Nome base para agrupamento (usa nome_vitrine se existir, senão name)
      const baseName = product.nome_vitrine || product.name
      const existingGroup = productGroups.get(baseName)
      
      if (existingGroup) {
        existingGroup.push(product)
      } else {
        productGroups.set(baseName, [product])
      }
    })

    // Gera as linhas do CSV
    const rows: NuvemshopRow[] = []

    productGroups.forEach((groupProducts, baseName) => {
      const slug = createSlug(baseName)
      
      // Verifica se este grupo tem variações (mais de um produto ou tem cor/tamanho)
      const hasVariations = groupProducts.length > 1 || 
        groupProducts.some(p => p.size || p.color || p.numeração)
      
      groupProducts.forEach((product, index) => {
        const isFirstInGroup = index === 0
        
        // Determina as variações
        let variacaoNome1 = ''
        let variacaoValor1 = ''
        let variacaoNome2 = ''
        let variacaoValor2 = ''
        let variacaoNome3 = ''
        let variacaoValor3 = ''

        if (hasVariations) {
          // Variação 1: Cor (se existir)
          if (product.color) {
            variacaoNome1 = 'Cor'
            variacaoValor1 = product.color
          }
          
          // Variação 2: Tamanho (se existir)
          if (product.size) {
            if (variacaoNome1) {
              variacaoNome2 = 'Tamanho'
              variacaoValor2 = product.size
            } else {
              variacaoNome1 = 'Tamanho'
              variacaoValor1 = product.size
            }
          }
          
          // Variação 3: Numeração (para sapatos, se existir)
          if (product.numeração) {
            if (!variacaoNome1) {
              variacaoNome1 = 'Numeração'
              variacaoValor1 = product.numeração
            } else if (!variacaoNome2) {
              variacaoNome2 = 'Numeração'
              variacaoValor2 = product.numeração
            } else {
              variacaoNome3 = 'Numeração'
              variacaoValor3 = product.numeração
            }
          }
        }

        // Formata preço (usa vírgula como decimal para Nuvemshop)
        const formatPrice = (price?: number): string => {
          if (!price) return ''
          return price.toFixed(2).replace('.', ',')
        }

        const row: NuvemshopRow = {
          identificadorUrl: slug,
          // Nome, categorias, descrição etc só na primeira linha do grupo
          nome: isFirstInGroup ? baseName : '',
          categorias: isFirstInGroup ? (product.category || '') : '',
          variacaoNome1,
          variacaoValor1,
          variacaoNome2,
          variacaoValor2,
          variacaoNome3,
          variacaoValor3,
          preco: formatPrice(product.salePrice),
          precoPromocional: '', // Pode ser implementado se houver campo de preço promocional
          peso: '', // Não temos este campo
          altura: '',
          largura: '',
          comprimento: '',
          estoque: product.quantity.toString(),
          sku: product.sku || '',
          codigoBarras: '',
          exibirNaLoja: product.quantity > 0 ? 'SIM' : 'NÃO',
          freteGratis: 'NÃO',
          descricao: isFirstInGroup ? (product.material ? `Material: ${product.material}` : '') : '',
          tags: '',
          tituloSEO: '',
          descricaoSEO: '',
          marca: isFirstInGroup ? (product.brand || '') : '',
          produtoFisico: 'SIM',
          mpn: '',
          sexo: isFirstInGroup ? mapGenero(product.genero) : '',
          faixaEtaria: '',
          custo: formatPrice(product.purchasePrice),
        }

        rows.push(row)
      })
    })

    // Monta o cabeçalho do CSV (formato Nuvemshop)
    const headers = [
      'Identificador URL',
      'Nome',
      'Categorias',
      'Nome da variação 1',
      'Valor da variação 1',
      'Nome da variação 2',
      'Valor da variação 2',
      'Nome da variação 3',
      'Valor da variação 3',
      'Preço',
      'Preço promocional',
      'Peso (kg)',
      'Altura (cm)',
      'Largura (cm)',
      'Comprimento (cm)',
      'Estoque',
      'SKU',
      'Código de barras',
      'Exibir na loja',
      'Frete gratis',
      'Descrição',
      'Tags',
      'Título para SEO',
      'Descrição para SEO',
      'Marca',
      'Produto Físico',
      'MPN (Cód. Exclusivo Modelo Fabricante)',
      'Sexo',
      'Faixa etária',
      'Custo',
    ]

    // Gera o CSV
    let csv = headers.join(';') + '\n'
    
    rows.forEach(row => {
      const values = [
        escapeCSV(row.identificadorUrl),
        escapeCSV(row.nome),
        escapeCSV(row.categorias),
        escapeCSV(row.variacaoNome1),
        escapeCSV(row.variacaoValor1),
        escapeCSV(row.variacaoNome2),
        escapeCSV(row.variacaoValor2),
        escapeCSV(row.variacaoNome3),
        escapeCSV(row.variacaoValor3),
        escapeCSV(row.preco),
        escapeCSV(row.precoPromocional),
        escapeCSV(row.peso),
        escapeCSV(row.altura),
        escapeCSV(row.largura),
        escapeCSV(row.comprimento),
        escapeCSV(row.estoque),
        escapeCSV(row.sku),
        escapeCSV(row.codigoBarras),
        escapeCSV(row.exibirNaLoja),
        escapeCSV(row.freteGratis),
        escapeCSV(row.descricao),
        escapeCSV(row.tags),
        escapeCSV(row.tituloSEO),
        escapeCSV(row.descricaoSEO),
        escapeCSV(row.marca),
        escapeCSV(row.produtoFisico),
        escapeCSV(row.mpn),
        escapeCSV(row.sexo),
        escapeCSV(row.faixaEtaria),
        escapeCSV(row.custo),
      ]
      csv += values.join(';') + '\n'
    })

    // Retorna o CSV como download
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="produtos-nuvemshop-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error: any) {
    console.error('Erro ao exportar produtos:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao exportar produtos' },
      { status: 500 }
    )
  }
}


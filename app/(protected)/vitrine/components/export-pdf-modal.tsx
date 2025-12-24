'use client'

import { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { FileDown, Loader2, Image as ImageIcon, X } from 'lucide-react'
import jsPDF from 'jspdf'
import { formatPhone, formatCurrency } from '@/lib/utils'

interface ExportPdfModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: any[]
  customers: any[]
}

export function ExportPdfModal({ open, onOpenChange, products, customers }: ExportPdfModalProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all')
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'out_of_stock'>('all')
  const [sizeFilter, setSizeFilter] = useState<string>('all')
  const [genderFilter, setGenderFilter] = useState<'all' | 'masculino' | 'feminino' | 'unissex'>('all')
  const [preVendaFilter, setPreVendaFilter] = useState<'all' | 'pre_venda' | 'pronta_entrega'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [customerSearchTerm, setCustomerSearchTerm] = useState('')
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null)
  const [backgroundImageFile, setBackgroundImageFile] = useState<File | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportAllProducts, setExportAllProducts] = useState(false)
  const [exportPreVenda, setExportPreVenda] = useState(false)
  const [exportSemEstoque, setExportSemEstoque] = useState(false)

  // Cliente selecionado
  const customer = useMemo(() => {
    return customers.find((c: any) => c._id === selectedCustomer)
  }, [customers, selectedCustomer])

  // Filtra clientes para exibição no select
  const filteredCustomers = useMemo(() => {
    if (!customerSearchTerm.trim()) {
      return customers
    }
    const search = customerSearchTerm.toLowerCase()
    return customers.filter((c: any) => 
      c.name.toLowerCase().includes(search) ||
      c.phone?.toLowerCase().includes(search) ||
      c.instagram?.toLowerCase().includes(search)
    )
  }, [customers, customerSearchTerm])

  // Extrai tamanhos únicos dos produtos e das crianças do cliente
  const availableSizes = useMemo(() => {
    const sizes = new Set<string>()
    
    products.forEach((product: any) => {
      if (product.size && product.size.trim() !== '') {
        sizes.add(product.size)
      }
    })
    
    if (customer && customer.children) {
      customer.children.forEach((child: any) => {
        if (child.size) {
          if (Array.isArray(child.size)) {
            child.size.forEach((size: string) => {
              if (size && size.trim() !== '') {
                sizes.add(size.trim())
              }
            })
          } else if (typeof child.size === 'string' && child.size.trim() !== '') {
            sizes.add(child.size.trim())
          }
        }
      })
    }
    
    return Array.from(sizes).sort()
  }, [products, customer])

  // Filtra produtos baseado nos filtros
  const filteredProducts = useMemo(() => {
    return products.filter((product: any) => {
      // Se exportAllProducts estiver marcado, ignora filtros de cliente/criança
      if (exportAllProducts) {
        // Aplica filtro de estoque
        if (!exportSemEstoque && product.quantity <= 0) return false
        
        // Aplica filtro de pré-venda
        if (exportPreVenda && !product.pre_venda) return false
        if (!exportPreVenda && product.pre_venda) return false
        
        // Aplica busca por nome
        const displayName = product.nome_vitrine || product.name
        if (searchTerm && !displayName.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false
        }
        
        return true
      }
      
      // Lógica original quando exportAllProducts está desmarcado
      if (availabilityFilter === 'available' && product.quantity <= 0) return false
      if (availabilityFilter === 'out_of_stock' && product.quantity > 0) return false
      if (sizeFilter !== 'all' && product.size !== sizeFilter) return false
      if (genderFilter !== 'all') {
        if (product.genero !== genderFilter && product.genero !== 'unissex') return false
      }
      if (preVendaFilter === 'pre_venda' && !product.pre_venda) return false
      if (preVendaFilter === 'pronta_entrega' && product.pre_venda) return false
      const displayName = product.nome_vitrine || product.name
      if (searchTerm && !displayName.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }

      // Filtros inteligentes baseados no cliente selecionado
      if (customer && customer.children && customer.children.length > 0) {
        const matchesChild = customer.children.some((child: any) => {
          if (child.size && product.size) {
            let childSizes: string[] = []
            if (Array.isArray(child.size)) {
              childSizes = child.size.map((s: string) => s.trim().toLowerCase())
            } else if (typeof child.size === 'string') {
              childSizes = child.size.split(',').map((s: string) => s.trim().toLowerCase()).filter((s: string) => s.length > 0)
            }
            if (childSizes.length > 0) {
              const productSize = product.size.trim().toLowerCase()
              if (!childSizes.includes(productSize)) return false
            }
          }
          if (child.gender && product.genero) {
            if (product.genero === 'unissex') return true
            if (product.genero !== child.gender) return false
          }
          return true
        })
        if (!matchesChild) return false
      }

      return true
    })
  }, [products, availabilityFilter, sizeFilter, genderFilter, preVendaFilter, searchTerm, customer, exportAllProducts, exportPreVenda, exportSemEstoque])

  // Calcula produtos para exportação (agrupados por cliente/criança ou todos os produtos)
  const exportData = useMemo(() => {
    const data: Array<{
      customerName: string
      customerPhone: string
      childSize: string
      childName: string
      suggestedProducts: Array<{ 
        _id: string
        name: string
        nome_vitrine?: string
        price: number
        imageUrl?: string
        size?: string
        pre_venda?: boolean
      }>
    }> = []

    // Se exportAllProducts estiver marcado, exporta todos os produtos filtrados
    if (exportAllProducts) {
      const allProducts = filteredProducts.map((product: any) => ({
        _id: product._id,
        name: product.nome_vitrine || product.name,
        price: product.salePrice || 0,
        imageUrl: product.imageUrl,
        size: product.size,
        pre_venda: product.pre_venda || false,
      }))

      if (allProducts.length > 0) {
        let sectionName = 'Catálogo Completo'
        if (exportPreVenda) {
          sectionName = 'Pré-venda'
        }
        
        data.push({
          customerName: 'Todos os Produtos',
          customerPhone: '',
          childSize: '-',
          childName: sectionName,
          suggestedProducts: allProducts,
        })
      }

      return data
    }

    // Se um cliente específico está selecionado
    if (selectedCustomer !== 'all' && customer) {
      if (customer.children && customer.children.length > 0) {
        customer.children.forEach((child: any) => {
          // Verifica se a criança corresponde aos filtros
          let childSizes: string[] = []
          if (child.size) {
            if (Array.isArray(child.size)) {
              childSizes = child.size.map((s: string) => s.trim())
            } else if (typeof child.size === 'string') {
              childSizes = child.size.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
            }
          }

          // Filtra produtos que correspondem a esta criança
          const childProducts = filteredProducts.filter((product: any) => {
            // Verifica tamanho
            if (childSizes.length > 0 && product.size) {
              const productSize = product.size.trim().toLowerCase()
              if (!childSizes.map((s: string) => s.toLowerCase()).includes(productSize)) {
                return false
              }
            }

            // Verifica gênero
            if (child.gender && product.genero) {
              if (product.genero !== 'unissex' && product.genero !== child.gender) {
                return false
              }
            }

            return true
          })

          if (childProducts.length > 0) {
            const suggestedProducts = childProducts.map((product: any) => ({
              _id: product._id,
              name: product.nome_vitrine || product.name,
              price: product.salePrice || 0,
              imageUrl: product.imageUrl,
              size: product.size,
              pre_venda: product.pre_venda || false,
            }))

            data.push({
              customerName: customer.name,
              customerPhone: customer.phone || '',
              childSize: childSizes.join(', ') || '-',
              childName: child.name || '',
              suggestedProducts,
            })
          }
        })
      }
    } else {
      // Se "Todos os Clientes" está selecionado, processa todos os clientes com filhos
      customers.forEach((customer: any) => {
        if (!customer.children || customer.children.length === 0) return

        customer.children.forEach((child: any) => {
          // Extrai tamanhos da criança
          let childSizes: string[] = []
          if (child.size) {
            if (Array.isArray(child.size)) {
              childSizes = child.size.map((s: string) => s.trim())
            } else if (typeof child.size === 'string') {
              childSizes = child.size.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
            }
          }

          // Verifica se a criança corresponde aos filtros de tamanho e gênero
          if (sizeFilter !== 'all') {
            if (!childSizes.includes(sizeFilter)) return
          }

          if (genderFilter !== 'all' && genderFilter !== 'unissex') {
            if (child.gender !== genderFilter) return
          }

          // Filtra produtos que correspondem a esta criança (usando filteredProducts que já foi filtrado pelos filtros gerais)
          const childProducts = filteredProducts.filter((product: any) => {
            // Verifica tamanho
            if (childSizes.length > 0 && product.size) {
              const productSize = product.size.trim().toLowerCase()
              if (!childSizes.map((s: string) => s.toLowerCase()).includes(productSize)) {
                return false
              }
            }

            // Verifica gênero
            if (child.gender && product.genero) {
              if (product.genero !== 'unissex' && product.genero !== child.gender) {
                return false
              }
            }

            return true
          })

          if (childProducts.length > 0) {
            const suggestedProducts = childProducts.map((product: any) => ({
              _id: product._id,
              name: product.nome_vitrine || product.name,
              price: product.salePrice || 0,
              imageUrl: product.imageUrl,
              size: product.size,
              pre_venda: product.pre_venda || false,
            }))

            data.push({
              customerName: customer.name,
              customerPhone: customer.phone || '',
              childSize: childSizes.join(', ') || '-',
              childName: child.name || '',
              suggestedProducts,
            })
          }
        })
      })
    }

    return data
  }, [customers, selectedCustomer, customer, filteredProducts, sizeFilter, genderFilter, exportAllProducts, preVendaFilter, exportPreVenda])

  // Função para carregar imagem e converter para base64
  const loadImageAsDataUrl = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(img, 0, 0)
            resolve(canvas.toDataURL('image/jpeg', 0.85))
          } else {
            reject(new Error('Erro ao criar contexto do canvas'))
          }
        } catch (error) {
          reject(error)
        }
      }
      
      img.onerror = (error) => {
        reject(new Error('Erro ao carregar imagem'))
      }
      
      // Tenta carregar a imagem
      img.src = url
      
      // Timeout de segurança
      setTimeout(() => {
        if (!img.complete) {
          reject(new Error('Timeout ao carregar imagem'))
        }
      }, 10000)
    })
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const doc = new jsPDF('landscape', 'mm', 'a4')
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 10
      const cardWidth = (pageWidth - margin * 3) / 2 // 2 colunas
      const cardHeight = 140
      const imageHeight = 100
      
      let x = margin
      let y = margin + 15 // Espaço para título
      let pageNumber = 1

      // Agrupa produtos por cliente e criança, mas agrupa crianças do mesmo cliente
      const productsByChild: Array<{
        customerName: string
        customerPhone: string
        childName: string
        childSize: string
        products: any[]
      }> = []
      
      // Primeiro, agrupa por cliente para reorganizar crianças
      const byCustomer = new Map<string, Array<{
        childName: string
        childSize: string
        products: any[]
      }>>()
      
      exportData.forEach((item) => {
        if (item.suggestedProducts.length > 0) {
          if (!byCustomer.has(item.customerName)) {
            byCustomer.set(item.customerName, [])
          }
          byCustomer.get(item.customerName)!.push({
            childName: item.childName,
            childSize: item.childSize,
            products: item.suggestedProducts,
          })
        }
      })
      
      // Agora reorganiza: para cada cliente, agrupa crianças e seus produtos
      byCustomer.forEach((childrenData, customerName) => {
        // Pega o primeiro item para obter customerPhone
        const firstItem = exportData.find(item => item.customerName === customerName)
        const customerPhone = firstItem?.customerPhone || ''
        
        // Se há múltiplas crianças, agrupa produtos únicos e cria uma única entrada
        if (childrenData.length > 1) {
          // Coleta todos os produtos únicos (por _id)
          const uniqueProductsMap = new Map<string, any>()
          childrenData.forEach(child => {
            child.products.forEach(product => {
              if (!uniqueProductsMap.has(product._id)) {
                uniqueProductsMap.set(product._id, product)
              }
            })
          })
          
          // Cria uma única entrada com todos os nomes de crianças e tamanhos
          const allChildNames = childrenData.map(c => c.childName).join(' / ')
          const allChildSizes = childrenData.map(c => c.childSize).filter(s => s && s !== '-').join(' / ')
          
          productsByChild.push({
            customerName,
            customerPhone,
            childName: allChildNames,
            childSize: allChildSizes || '-',
            products: Array.from(uniqueProductsMap.values()),
          })
        } else {
          // Se há apenas uma criança, adiciona normalmente
          childrenData.forEach(child => {
            productsByChild.push({
              customerName,
              customerPhone,
              childName: child.childName,
              childSize: child.childSize,
              products: child.products,
            })
          })
        }
      })

      // Se não há dados, mostra mensagem
      if (productsByChild.length === 0) {
        doc.setFontSize(12)
        doc.text('Nenhum dado encontrado com os filtros selecionados.', margin, 50)
        doc.save('catalogo_exclusivo.pdf')
        setIsExporting(false)
        return
      }

      // Determina o nome do cliente para o título e nome do arquivo
      let customerNameForTitle = 'Catálogo Exclusivo'
      let fileName = 'catalogo_exclusivo'
      
      if (exportAllProducts) {
        customerNameForTitle = exportPreVenda ? 'Catálogo - Pré-venda' : 'Catálogo Completo'
        fileName = exportPreVenda ? 'catalogo_pre_venda' : 'catalogo_completo'
      } else if (selectedCustomer !== 'all' && customer) {
        customerNameForTitle = `Catálogo Exclusivo - ${customer.name}`
        // Remove caracteres especiais do nome para o arquivo
        fileName = `catalogo_exclusivo_${customer.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
      } else if (exportData.length > 0 && exportData[0].customerName) {
        // Se há apenas um cliente nos dados
        const uniqueCustomers = new Set(exportData.map(item => item.customerName))
        if (uniqueCustomers.size === 1) {
          const singleCustomer = Array.from(uniqueCustomers)[0]
          customerNameForTitle = `Catálogo Exclusivo - ${singleCustomer}`
          fileName = `catalogo_exclusivo_${singleCustomer.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
        }
      }

      // Título na primeira página
      doc.setFontSize(20)
      doc.setFont(undefined, 'bold')
      doc.text(customerNameForTitle, margin, 10)
      doc.setFontSize(12)
      doc.setFont(undefined, 'normal')
      doc.setTextColor(100, 100, 100)
      const now = new Date()
      const dateStr = now.toLocaleDateString('pt-BR')
      const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      doc.text(
        `Gerado em: ${dateStr} às ${timeStr}`,
        margin,
        15
      )
      doc.setTextColor(0, 0, 0)

      // Carrega a imagem de fundo uma vez se houver
      let backgroundImageDataUrl: string | null = null
      if (backgroundImage) {
        try {
          backgroundImageDataUrl = await loadImageAsDataUrl(backgroundImage)
        } catch (error) {
          console.error('Erro ao carregar imagem de fundo:', error)
        }
      }

      // Função auxiliar para adicionar imagem de fundo na página atual
      const addBackgroundToCurrentPage = () => {
        if (backgroundImageDataUrl) {
          const currentPageWidth = doc.internal.pageSize.getWidth()
          const currentPageHeight = doc.internal.pageSize.getHeight()
          
          // Adiciona a imagem de fundo cobrindo toda a página
          doc.addImage(
            backgroundImageDataUrl,
            'JPEG',
            0,
            0,
            currentPageWidth,
            currentPageHeight,
            undefined,
            'FAST'
          )
        }
      }

      // Adiciona imagem de fundo na primeira página
      addBackgroundToCurrentPage()

      // Processa produtos agrupados por criança
      for (let childIndex = 0; childIndex < productsByChild.length; childIndex++) {
        const childData = productsByChild[childIndex]
        
        // Verifica se precisa de nova página antes de adicionar o cabeçalho da criança
        if (y + 20 + cardHeight > pageHeight - margin) {
          doc.addPage()
          pageNumber++
          // Adiciona imagem de fundo na nova página
          addBackgroundToCurrentPage()
          y = margin
          x = margin
        }

        // Cabeçalho da criança/seção (centralizado)
        if (childIndex > 0) {
          y += 8 // Espaço antes do cabeçalho
        }
        doc.setFontSize(16)
        doc.setFont(undefined, 'bold')
        doc.setTextColor(0, 0, 0) // Preto
        doc.text(`${childData.childName}`, pageWidth / 2, y, { align: 'center' })
        if (childData.childSize && childData.childSize !== '-') {
          doc.setFontSize(14)
          doc.setFont(undefined, 'bold') // Negrito
          doc.setTextColor(0, 0, 0) // Preto
          doc.text(`Tamanho: ${childData.childSize}`, pageWidth / 2, y + 8, { align: 'center' })
        }
        y += 18 // Espaço após o cabeçalho

        // Processa produtos desta criança
        for (let i = 0; i < childData.products.length; i++) {
          const product = childData.products[i]

          // Verifica se precisa de nova página
          if (y + cardHeight > pageHeight - margin) {
            doc.addPage()
            pageNumber++
            
            // Adiciona imagem de fundo na nova página
            await addBackgroundToCurrentPage()
            
            y = margin
            x = margin
            // Adiciona cabeçalho da criança na nova página (centralizado)
            doc.setFontSize(16)
            doc.setFont(undefined, 'bold')
            doc.setTextColor(0, 0, 0) // Preto
            doc.text(`${childData.childName}`, pageWidth / 2, y, { align: 'center' })
            if (childData.childSize && childData.childSize !== '-') {
              doc.setFontSize(14)
              doc.setFont(undefined, 'bold') // Negrito
              doc.setTextColor(0, 0, 0) // Preto
              doc.text(`Tamanho: ${childData.childSize}`, pageWidth / 2, y + 8, { align: 'center' })
            }
            y += 18
          }

          // Adiciona imagem (sem borda do card)
          let imageLoaded = false
          let actualImageHeight = imageHeight // Altura real da imagem renderizada
          if (product.imageUrl) {
            try {
            const imageDataUrl = await loadImageAsDataUrl(product.imageUrl)
            const maxWidth = cardWidth - 4
            const maxHeight = imageHeight
            
            // Carrega a imagem para obter dimensões originais
            const img = new Image()
            img.src = imageDataUrl
            await new Promise((resolve, reject) => {
              if (img.complete) {
                resolve(null)
              } else {
                img.onload = () => resolve(null)
                img.onerror = () => reject(new Error('Erro ao carregar imagem'))
              }
            })
            
            // Calcula dimensões mantendo proporção
            let finalWidth = maxWidth
            let finalHeight = maxHeight
            const aspectRatio = img.width / img.height
            
            if (aspectRatio > maxWidth / maxHeight) {
              // Imagem mais larga - ajusta pela largura
              finalWidth = maxWidth
              finalHeight = maxWidth / aspectRatio
            } else {
              // Imagem mais alta - ajusta pela altura
              finalHeight = maxHeight
              finalWidth = maxHeight * aspectRatio
            }
            
            // Guarda a altura real da imagem
            actualImageHeight = finalHeight
            
            // Centraliza a imagem horizontalmente no card
            const imgX = x + (cardWidth - finalWidth) / 2
            const imgY = y
            
            doc.addImage(
              imageDataUrl,
              'JPEG',
              imgX,
              imgY,
              finalWidth,
              finalHeight,
              undefined,
              'FAST'
            )
            imageLoaded = true
            } catch (error) {
              console.error('Erro ao carregar imagem:', error)
              imageLoaded = false
            }
          }
          
          // Placeholder se não há imagem ou se falhou ao carregar
          if (!imageLoaded) {
            doc.setFillColor(240, 240, 240)
            const placeholderWidth = cardWidth - 4
            const placeholderHeight = imageHeight
            const placeholderX = x + (cardWidth - placeholderWidth) / 2
            doc.rect(placeholderX, y, placeholderWidth, placeholderHeight, 'F')
            doc.setFontSize(11)
            doc.setTextColor(150, 150, 150)
            doc.text('Sem imagem', x + cardWidth / 2, y + placeholderHeight / 2 + 2, { align: 'center' })
            doc.setTextColor(0, 0, 0)
            actualImageHeight = placeholderHeight
          }

          // Calcula a posição inicial do texto baseado na altura real da imagem
          const textStartY = y + actualImageHeight + 8

          // Nome do produto (centralizado, negrito e preto)
          doc.setFontSize(13)
          doc.setFont(undefined, 'bold')
          doc.setTextColor(0, 0, 0) // Preto
          const productName = product.name
          const maxWidth = cardWidth - 4
          const splitName = doc.splitTextToSize(productName, maxWidth)
          // Centraliza cada linha do texto
          splitName.forEach((line: string, index: number) => {
            doc.text(line, x + cardWidth / 2, textStartY + (index * 6), { align: 'center' })
          })

          // Tamanho e pré-venda (se houver) - centralizado
          let infoY = textStartY + (splitName.length * 6) + 4
          if (product.size) {
            doc.setFontSize(11)
            doc.setFont(undefined, 'bold') // Negrito para tamanho
            doc.setTextColor(0, 0, 0) // Preto
            doc.text(`Tamanho: ${product.size}`, x + cardWidth / 2, infoY, { align: 'center' })
            infoY += 6
          }
          if (product.pre_venda) {
            doc.setFontSize(10)
            doc.setFont(undefined, 'bold')
            doc.setTextColor(255, 140, 0) // Laranja para pré-venda
            doc.text('Pré-venda', x + cardWidth / 2, infoY, { align: 'center' })
            infoY += 6
          }

          // Preço (centralizado, negrito e preto)
          doc.setFontSize(18)
          doc.setFont(undefined, 'bold')
          doc.setTextColor(0, 0, 0) // Preto
          const priceY = y + cardHeight - 8
          doc.text(formatCurrency(product.price), x + cardWidth / 2, priceY, { align: 'center' })

          // Move para próxima posição
          x += cardWidth + margin
          if (x + cardWidth > pageWidth - margin) {
            x = margin
            y += cardHeight + margin
          }
        }
        
        // Adiciona espaço entre grupos de crianças
        if (childIndex < productsByChild.length - 1) {
          y += 5
        }
      }

      // Salva o PDF com nome personalizado
      doc.save(`${fileName}.pdf`)
      onOpenChange(false)
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      alert('Erro ao exportar PDF. Tente novamente.')
    } finally {
      setIsExporting(false)
    }
  }

  const getFilterDisplayText = (value: string, type: 'availability' | 'size' | 'gender' | 'type') => {
    if (value === 'all') return 'Tudo'
    if (type === 'availability') {
      if (value === 'available') return 'Disponível'
      if (value === 'out_of_stock') return 'Sem Estoque'
    }
    if (type === 'gender') {
      if (value === 'masculino') return 'Masculino'
      if (value === 'feminino') return 'Feminino'
      if (value === 'unissex') return 'Unissex'
    }
    if (type === 'type') {
      if (value === 'pre_venda') return 'Pré-venda'
      if (value === 'pronta_entrega') return 'Pronta Entrega'
    }
    return value
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-6 w-6" />
            Exportar para PDF
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Configure os filtros abaixo para exportar um relatório com clientes, tamanhos e peças sugeridas.
          </p>

          {/* Checkbox para exportar todas as roupas */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="exportAllProducts"
                checked={exportAllProducts}
                onCheckedChange={(checked) => setExportAllProducts(checked === true)}
              />
              <label
                htmlFor="exportAllProducts"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Exportar todas as roupas disponíveis (ignora filtros de cliente/criança)
              </label>
            </div>
            
            {/* Checkboxes adicionais quando exportAllProducts está marcado */}
            {exportAllProducts && (
              <div className="space-y-2 pl-6 border-l-2 border-primary/20">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="exportPreVenda"
                    checked={exportPreVenda}
                    onCheckedChange={(checked) => setExportPreVenda(checked === true)}
                  />
                  <label
                    htmlFor="exportPreVenda"
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Exportar pré-venda
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="exportSemEstoque"
                    checked={exportSemEstoque}
                    onCheckedChange={(checked) => setExportSemEstoque(checked === true)}
                  />
                  <label
                    htmlFor="exportSemEstoque"
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Exportar sem estoque
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Seleção de Cliente */}
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger disabled={exportAllProducts}>
                <SelectValue 
                  placeholder="Selecione um cliente"
                  displayValue={selectedCustomer === 'all' ? 'Todos os Clientes' : customers.find((c: any) => c._id === selectedCustomer)?.name}
                />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1.5 border-b">
                  <Input
                    placeholder="Buscar cliente..."
                    value={customerSearchTerm}
                    onChange={(e) => {
                      e.stopPropagation()
                      setCustomerSearchTerm(e.target.value)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="h-8"
                  />
                </div>
                <SelectItem value="all">Todos os Clientes</SelectItem>
                {filteredCustomers.length === 0 ? (
                  <SelectItem value="no-results">
                    Nenhum cliente encontrado
                  </SelectItem>
                ) : (
                  filteredCustomers.map((customer: any) => (
                    <SelectItem key={customer._id} value={customer._id}>
                      {customer.name}
                      {customer.children && customer.children.length > 0 && (
                        <span className="text-muted-foreground ml-2">
                          ({customer.children.length} criança{customer.children.length !== 1 ? 's' : ''})
                        </span>
                      )}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Imagem de Fundo */}
          <div className="space-y-2">
            <Label>Imagem de Fundo (Opcional)</Label>
            <div className="space-y-2">
              {backgroundImage ? (
                <div className="relative">
                  <div className="relative w-full h-32 border rounded-lg overflow-hidden bg-muted">
                    <img
                      src={backgroundImage}
                      alt="Preview do fundo"
                      className="w-full h-full object-contain"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setBackgroundImage(null)
                        setBackgroundImageFile(null)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    A imagem será usada como fundo do PDF
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-muted hover:bg-muted/80 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <ImageIcon className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Clique para enviar</span> ou arraste e solte
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG ou WEBP (máx. 5MB)</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Tamanho recomendado: 1123 × 794 pixels
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            alert('Arquivo muito grande. Tamanho máximo: 5MB')
                            return
                          }
                          setBackgroundImageFile(file)
                          const reader = new FileReader()
                          reader.onloadend = () => {
                            setBackgroundImage(reader.result as string)
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Busca */}
          <div className="space-y-2">
            <Label>Buscar Produto</Label>
            <Input
              placeholder="Digite o nome do produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Disponibilidade</Label>
            <Select value={availabilityFilter} onValueChange={(value: any) => setAvailabilityFilter(value)}>
              <SelectTrigger disabled={exportAllProducts}>
                  <SelectValue 
                    placeholder="Selecione um filtro"
                    displayValue={getFilterDisplayText(availabilityFilter, 'availability')}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tudo</SelectItem>
                  <SelectItem value="available">Disponível</SelectItem>
                  <SelectItem value="out_of_stock">Sem Estoque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tamanho</Label>
              <Select value={sizeFilter} onValueChange={setSizeFilter}>
                <SelectTrigger disabled={exportAllProducts}>
                  <SelectValue 
                    placeholder="Selecione um filtro"
                    displayValue={sizeFilter === 'all' ? 'Tudo' : sizeFilter}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tudo</SelectItem>
                  {availableSizes.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Gênero</Label>
              <Select value={genderFilter} onValueChange={(value: any) => setGenderFilter(value)}>
                <SelectTrigger disabled={exportAllProducts}>
                  <SelectValue 
                    placeholder="Selecione um filtro"
                    displayValue={getFilterDisplayText(genderFilter, 'gender')}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tudo</SelectItem>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="feminino">Feminino</SelectItem>
                  <SelectItem value="unissex">Unissex</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={preVendaFilter} onValueChange={(value: any) => setPreVendaFilter(value)}>
                <SelectTrigger disabled={exportAllProducts}>
                  <SelectValue 
                    placeholder="Selecione um filtro"
                    displayValue={getFilterDisplayText(preVendaFilter, 'type')}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tudo</SelectItem>
                  <SelectItem value="pre_venda">Pré-venda</SelectItem>
                  <SelectItem value="pronta_entrega">Pronta Entrega</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Resumo */}
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>{exportData.length}</strong> registro(s) serão exportados
              {exportData.length > 0 && (
                <span>
                  {' '}com <strong>{exportData.reduce((acc, item) => acc + item.suggestedProducts.length, 0)}</strong> peça(s) sugerida(s)
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={isExporting || exportData.length === 0}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" />
                Exportar PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}


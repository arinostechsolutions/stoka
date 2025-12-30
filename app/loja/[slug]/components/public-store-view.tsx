'use client'

import { useState, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package, Award, Ruler, ShoppingCart, MessageCircle, Check, X, Filter } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface Product {
  _id: string
  name: string
  nome_vitrine?: string
  imageUrl?: string
  salePrice?: number
  brand?: string
  size?: string
  quantity: number
  pre_venda?: boolean
  genero?: 'masculino' | 'feminino' | 'unissex'
}

interface Store {
  _id: string
  title: string
  description?: string
  whatsappMessage: string
  phone: string
  backgroundColor?: string
  logoUrl?: string
}

interface PublicStoreViewProps {
  store: Store
  products: Product[]
}

export function PublicStoreView({ store, products }: PublicStoreViewProps) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [expandedImage, setExpandedImage] = useState<{ url: string; alt: string } | null>(null)
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedGenero, setSelectedGenero] = useState<string>('')

  const toggleProduct = useCallback((productId: string) => {
    setSelectedProducts((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId)
      } else {
        return [...prev, productId]
      }
    })
  }, [])

  const generateWhatsAppLink = useCallback(() => {
    if (selectedProducts.length === 0) return '#'

    const selectedProductsData = products.filter((p) => selectedProducts.includes(p._id))
    
    // Monta a mensagem
    let message = store.whatsappMessage + '\n\n'
    
    selectedProductsData.forEach((product, index) => {
      const displayName = product.nome_vitrine || product.name
      message += `${index + 1}. ${displayName}`
      
      if (product.size) {
        message += ` - Tamanho: ${product.size}`
      }
      
      if (product.brand) {
        message += ` - Marca: ${product.brand}`
      }
      
      if (product.salePrice) {
        message += ` - R$ ${product.salePrice.toFixed(2).replace('.', ',')}`
      }
      
      message += '\n'
    })

    // Codifica a mensagem para URL
    const encodedMessage = encodeURIComponent(message)
    
    // Formata o telefone (garante que tenha código do país)
    let phone = store.phone.replace(/\D/g, '')
    if (!phone.startsWith('55') && phone.length === 11) {
      phone = '55' + phone
    }

    return `https://wa.me/${phone}?text=${encodedMessage}`
  }, [selectedProducts, products, store])

  // Extrai tamanhos únicos dos produtos
  const availableSizes = useMemo(() => {
    const sizes = new Set<string>()
    products.forEach((product) => {
      if (product.size) {
        sizes.add(product.size)
      }
    })
    return Array.from(sizes).sort()
  }, [products])

  // Filtra produtos baseado nos filtros
  const filteredProducts = useMemo(() => {
    let filtered = products

    // Filtro de tamanho
    if (selectedSize) {
      filtered = filtered.filter((product) => product.size === selectedSize)
    }

    // Filtro de gênero
    if (selectedGenero) {
      filtered = filtered.filter((product) => product.genero === selectedGenero)
    }

    return filtered
  }, [products, selectedSize, selectedGenero])

  const selectedProductsData = useMemo(() => {
    return filteredProducts.filter((p) => selectedProducts.includes(p._id))
  }, [filteredProducts, selectedProducts])

  const backgroundColor = store.backgroundColor || '#FFFFFF'

  return (
    <div className="min-h-screen" style={{ backgroundColor }}>
      <div className="container mx-auto px-4 md:px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          {store.logoUrl && (
            <div className="mb-4 flex justify-center">
              <div className="relative w-32 h-32 md:w-48 md:h-48">
                <Image
                  src={store.logoUrl}
                  alt={`${store.title} - Logotipo`}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>
          )}
          <h1 className="text-4xl font-bold mb-2">{store.title}</h1>
          {store.description && (
            <p className="text-lg text-muted-foreground">{store.description}</p>
          )}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-2xl mx-auto">
            <div className="space-y-2 text-sm text-blue-800">
              <p className="flex items-center justify-center gap-2 font-medium">
                <Check className="h-4 w-4" />
                <span>Clique na peça para selecionar e depois clique/toque no botão &quot;Falar Comigo&quot; para me chamar no WhatsApp!</span>
              </p>
              <p className="flex items-center justify-center gap-2 text-blue-700">
                <span>Para ver os detalhes, use o link &quot;Ver imagem em tamanho original&quot; no card do produto</span>
              </p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        {products.length > 0 && (
          <div className="mb-6 max-w-2xl mx-auto relative z-50">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 md:p-6 border border-gray-200 shadow-sm relative">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Filtros</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="size-filter" className="text-sm font-medium">
                    Tamanho
                  </Label>
                  <Select value={selectedSize} onValueChange={setSelectedSize}>
                    <SelectTrigger id="size-filter" className="h-11 bg-white">
                      <SelectValue placeholder="Todos os tamanhos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os tamanhos</SelectItem>
                      {availableSizes.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="genero-filter" className="text-sm font-medium">
                    Gênero
                  </Label>
                  <Select value={selectedGenero} onValueChange={setSelectedGenero}>
                    <SelectTrigger id="genero-filter" className="h-11 bg-white">
                      <SelectValue placeholder="Todos os gêneros" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os gêneros</SelectItem>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                      <SelectItem value="unissex">Unissex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {(selectedSize || selectedGenero) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setSelectedSize('')
                      setSelectedGenero('')
                    }}
                    className="text-sm text-primary hover:text-primary/80 underline transition-colors"
                  >
                    Limpar filtros
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Produtos */}
        {filteredProducts.length > 0 ? (
          <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8 max-w-xs mx-auto md:max-w-none">
            {filteredProducts.map((product) => {
              const isSelected = selectedProducts.includes(product._id)
              const displayName = product.nome_vitrine || product.name

              return (
                <Card
                  key={product._id}
                  className={`overflow-hidden transition-all duration-300 cursor-pointer rounded-xl ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary scale-[1.02] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]'
                      : 'border-0 hover:scale-[1.02] shadow-[0_20px_25px_-5px_rgba(0,0,0,0.3),0_10px_10px_-5px_rgba(0,0,0,0.2)] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_10px_15px_-3px_rgba(0,0,0,0.3)]'
                  }`}
                  onClick={() => toggleProduct(product._id)}
                >
                  <CardContent className="p-0">
                    {/* Imagem */}
                    <div className="relative w-full h-40 md:h-56 bg-muted overflow-hidden">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={displayName}
                          fill
                          className="object-cover transition-transform duration-300"
                          unoptimized
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Package className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      
                      {/* Badge de pré-venda */}
                      {product.pre_venda && (
                        <div className="absolute top-2 left-2 z-10">
                          <Badge className="bg-orange-500 text-white hover:bg-orange-600">
                            Pré-venda
                          </Badge>
                        </div>
                      )}
                      
                      {/* Badge de selecionado */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 z-10">
                          <Badge className="bg-primary text-primary-foreground">
                            <Check className="h-3 w-3 mr-1" />
                            Selecionado
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Informações */}
                    <div className="p-3 md:p-5 bg-white">
                      <h3 className="font-bold text-base md:text-lg mb-1 md:mb-2 line-clamp-2 text-gray-900">{displayName}</h3>
                      
                      {product.nome_vitrine && (
                        <p className="text-xs md:text-sm text-muted-foreground line-clamp-1 mb-1 md:mb-2">
                          {product.name}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-1.5 md:gap-2 mb-2 md:mb-3">
                        {product.size && (
                          <Badge variant="outline" className="text-xs">
                            <Ruler className="h-3 w-3 mr-1" />
                            Tamanho: {product.size}
                          </Badge>
                        )}
                        {product.brand && (
                          <Badge variant="outline" className="text-xs">
                            <Award className="h-3 w-3 mr-1" />
                            {product.brand}
                          </Badge>
                        )}
                      </div>

                      {/* Link para ver imagem */}
                      {product.imageUrl && (
                        <div className="mb-2 md:mb-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setExpandedImage({ url: product.imageUrl!, alt: displayName })
                            }}
                            className="text-xs text-primary hover:text-primary/80 underline transition-colors"
                          >
                            Ver imagem em tamanho original
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-100">
                        {product.salePrice && (
                          <p className="text-xl md:text-2xl font-bold text-primary">
                            {formatCurrency(product.salePrice)}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : products.length > 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">Nenhum produto encontrado com os filtros selecionados</p>
            <button
              onClick={() => {
                setSelectedSize('')
                setSelectedGenero('')
              }}
              className="mt-4 text-sm text-primary hover:text-primary/80 underline transition-colors"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">Nenhum produto disponível no momento</p>
          </div>
        )}

        {/* Botão Fixo de WhatsApp */}
        {selectedProducts.length > 0 && (
          <div className="fixed bottom-4 right-4 z-50">
            <Button
              size="lg"
              className="shadow-lg h-14 px-6 gap-3"
              onClick={() => {
                const link = generateWhatsAppLink()
                window.open(link, '_blank')
              }}
            >
              <MessageCircle className="h-5 w-5" />
              Falar comigo ({selectedProducts.length})
            </Button>
          </div>
        )}

        {/* Contador de selecionados (quando não há botão fixo) */}
        {selectedProducts.length > 0 && (
          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground">
              {selectedProducts.length} produto(s) selecionado(s)
            </p>
          </div>
        )}

        {/* Rodapé */}
        <footer className="mt-12 pt-8 pb-4 text-center border-t border-gray-200/50">
          <p className="text-sm text-muted-foreground">
            Powered by{' '}
            <a
              href="https://wa.me/5522992645933"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-foreground hover:text-primary transition-colors underline"
            >
              AG2 Soluções Tecnológicas
            </a>
          </p>
        </footer>
      </div>

      {/* Modal de Imagem Expandida */}
      {expandedImage && (
        <div 
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90"
          onClick={() => setExpandedImage(null)}
        >
          {/* Container da imagem - impede fechamento ao clicar na imagem */}
          <div 
            className="relative max-w-[90vw] max-h-[90vh] md:max-w-[40vw] md:max-h-[80vh] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={expandedImage.url}
              alt={expandedImage.alt}
              width={1200}
              height={1200}
              className="max-w-full max-h-full object-contain"
              unoptimized
              priority
            />
            {/* Botão de fechar */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setExpandedImage(null)
              }}
              className="absolute right-4 top-4 z-20 rounded-full p-2 bg-black/70 text-white hover:bg-black/90 hover:text-white transition-colors backdrop-blur-sm"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Fechar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}



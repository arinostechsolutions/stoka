'use client'

import { useState, useMemo, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Search, Package, Award, Ruler, Filter } from 'lucide-react'
import Image from 'next/image'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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

interface ProductSelectorProps {
  products: Product[]
  selectedProducts: string[]
  onSelectionChange: (selected: string[]) => void
}

export function ProductSelector({ products, selectedProducts, onSelectionChange }: ProductSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedGenero, setSelectedGenero] = useState<string>('')

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

  const filteredProducts = useMemo(() => {
    let filtered = products

    // Filtro de busca por texto
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter((product) => {
        const displayName = product.nome_vitrine || product.name
        return (
          displayName.toLowerCase().includes(term) ||
          product.name.toLowerCase().includes(term) ||
          product.brand?.toLowerCase().includes(term) ||
          product.size?.toLowerCase().includes(term)
        )
      })
    }

    // Filtro de tamanho
    if (selectedSize) {
      filtered = filtered.filter((product) => product.size === selectedSize)
    }

    // Filtro de gênero
    if (selectedGenero) {
      filtered = filtered.filter((product) => product.genero === selectedGenero)
    }

    return filtered
  }, [products, searchTerm, selectedSize, selectedGenero])

  const handleToggle = useCallback((productId: string) => {
    const newSelection = selectedProducts.includes(productId)
      ? selectedProducts.filter((id) => id !== productId)
      : [...selectedProducts, productId]
    onSelectionChange(newSelection)
  }, [selectedProducts, onSelectionChange])

  const handleCardClick = useCallback((productId: string) => {
    handleToggle(productId)
  }, [handleToggle])

  const handleCheckboxChange = useCallback((productId: string, checked: boolean) => {
    if (checked) {
      if (!selectedProducts.includes(productId)) {
        onSelectionChange([...selectedProducts, productId])
      }
    } else {
      onSelectionChange(selectedProducts.filter((id) => id !== productId))
    }
  }, [selectedProducts, onSelectionChange])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="search">Buscar Produtos</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, marca, tamanho..."
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-3 relative z-50">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-semibold">Filtros</Label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative">
          <div className="space-y-2">
            <Label htmlFor="size-filter" className="text-xs">Tamanho</Label>
            <Select value={selectedSize} onValueChange={setSelectedSize}>
              <SelectTrigger id="size-filter" className="h-9">
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
            <Label htmlFor="genero-filter" className="text-xs">Gênero</Label>
            <Select value={selectedGenero} onValueChange={setSelectedGenero}>
              <SelectTrigger id="genero-filter" className="h-9">
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
      </div>

      <div className="text-sm text-muted-foreground">
        {selectedProducts.length} produto(s) selecionado(s) de {filteredProducts.length} produto(s) filtrado(s) de {products.length} total
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product) => {
          const isSelected = selectedProducts.includes(product._id)
          const displayName = product.nome_vitrine || product.name

          return (
            <Card
              key={product._id}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5 ring-2 ring-primary'
                  : 'hover:border-primary/50'
              }`}
              onClick={() => handleCardClick(product._id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleCheckboxChange(product._id, checked === true)}
                      className="mt-1"
                    />
                  </div>
                  
                  {product.imageUrl && (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border bg-muted shrink-0">
                      <Image
                        src={product.imageUrl}
                        alt={displayName}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-2">{displayName}</h4>
                    {product.nome_vitrine && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{product.name}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {product.pre_venda && (
                        <Badge className="bg-orange-500 text-white hover:bg-orange-600 text-xs">
                          Pré-venda
                        </Badge>
                      )}
                      {product.size && (
                        <Badge variant="outline" className="text-xs">
                          <Ruler className="h-2.5 w-2.5 mr-1" />
                          {product.size}
                        </Badge>
                      )}
                      {product.brand && (
                        <Badge variant="outline" className="text-xs">
                          <Award className="h-2.5 w-2.5 mr-1" />
                          {product.brand}
                        </Badge>
                      )}
                    </div>

                    {product.salePrice && (
                      <p className="text-sm font-semibold text-primary mt-1">
                        R$ {product.salePrice.toFixed(2).replace('.', ',')}
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground mt-1">
                      Estoque: {product.quantity}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Nenhum produto encontrado</p>
        </div>
      )}
    </div>
  )
}



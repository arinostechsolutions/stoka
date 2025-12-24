'use client'

import { useState, useTransition } from 'react'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Package, Hash, Tag, Building2, Box, AlertTriangle, DollarSign, Ruler, Palette, Award, Shirt, Upload, X, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { createProduct, updateProduct } from '../actions'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import imageCompression from 'browser-image-compression'

async function fetchSuppliers() {
  const res = await fetch('/api/suppliers')
  if (!res.ok) throw new Error('Erro ao carregar fornecedores')
  const data = await res.json()
  // Retorna fornecedores com category incluída
  return data
}

interface ProductFormProps {
  children: React.ReactNode
  product?: {
    _id: string
    name: string
    nome_vitrine?: string
    sku?: string
    category?: string
    supplierId?: string
    quantity: number
    minQuantity: number
    purchasePrice?: number
    salePrice?: number
    size?: string
    color?: string
    brand?: string
    material?: string
    imageUrl?: string
    pre_venda?: boolean
    genero?: 'masculino' | 'feminino' | 'unissex'
    // Campos específicos para jóias
    tipo_joia?: string
    pedra?: string
    quilate?: number
    // Campos específicos para sapatos
    numeração?: string
    tipo_sapato?: string
  }
}

export function ProductForm({ children, product }: ProductFormProps) {
  const router = useRouter()
  const formRef = React.useRef<HTMLFormElement>(null)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [selectedSupplier, setSelectedSupplier] = useState(product?.supplierId || '')
  const [purchasePrice, setPurchasePrice] = useState<string>(product?.purchasePrice?.toString() || '')
  const [salePrice, setSalePrice] = useState<string>(product?.salePrice?.toString() || '')
  const [size, setSize] = useState(product?.size || '')
  const [color, setColor] = useState(product?.color || '')
  const [brand, setBrand] = useState(product?.brand || '')
  const [material, setMaterial] = useState(product?.material || '')
  const [genero, setGenero] = useState<'masculino' | 'feminino' | 'unissex' | ''>(product?.genero || '')
  const [pre_venda, setPre_venda] = useState(product?.pre_venda || false)
  // Campos específicos para jóias
  const [tipo_joia, setTipo_joia] = useState((product as any)?.tipo_joia || '')
  const [pedra, setPedra] = useState((product as any)?.pedra || '')
  const [quilate, setQuilate] = useState((product as any)?.quilate?.toString() || '')
  // Campos específicos para sapatos
  const [numeração, setNumeração] = useState((product as any)?.numeração || '')
  const [tipo_sapato, setTipo_sapato] = useState((product as any)?.tipo_sapato || '')
  const [imageUrl, setImageUrl] = useState(product?.imageUrl || '')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(product?.imageUrl || null)
  const [isUploading, setIsUploading] = useState(false)
  const [imageCompressionInfo, setImageCompressionInfo] = useState<{ original: number; compressed: number } | null>(null)
  const [createInitialMovement, setCreateInitialMovement] = useState(false)

  const { data: suppliers = [], isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: fetchSuppliers,
  })
  
  // Verifica a categoria do fornecedor selecionado
  const selectedSupplierData = React.useMemo(() => {
    return suppliers.find((s: any) => s._id === selectedSupplier)
  }, [suppliers, selectedSupplier])
  
  const supplierCategory = React.useMemo(() => {
    return selectedSupplierData?.category || 'geral'
  }, [selectedSupplierData])
  
  const isVestuarioSupplier = supplierCategory === 'vestuario'
  const isJoiaSupplier = supplierCategory === 'joia'
  const isSapatoSupplier = supplierCategory === 'sapato'
  

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validação do tipo de arquivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Tipo de arquivo inválido. Use JPEG, PNG ou WebP')
      return
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    let processedFile = file
    const originalSize = file.size

    // Se o arquivo exceder 5MB, comprime
    if (file.size > maxSize) {
      setIsUploading(true)
      setImageCompressionInfo(null)
      try {
        const options = {
          maxSizeMB: 5,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: file.type,
        }
        
        processedFile = await imageCompression(file, options)
        
        // Verifica se ainda está acima do limite após compressão
        if (processedFile.size > maxSize) {
          // Tenta compressão mais agressiva
          const aggressiveOptions = {
            maxSizeMB: 5,
            maxWidthOrHeight: 1600,
            useWebWorker: true,
            fileType: file.type,
            initialQuality: 0.7,
          }
          processedFile = await imageCompression(file, aggressiveOptions)
        }

        // Salva informações de compressão para exibir ao usuário
        if (processedFile.size < originalSize) {
          setImageCompressionInfo({
            original: originalSize,
            compressed: processedFile.size,
          })
        }
      } catch (error: any) {
        console.error('Erro ao comprimir imagem:', error)
        setError('Erro ao comprimir imagem. Tente uma imagem menor.')
        setIsUploading(false)
        setImageCompressionInfo(null)
        return
      } finally {
        setIsUploading(false)
      }
    } else {
      setImageCompressionInfo(null)
    }

    setImageFile(processedFile)
    setError('')

    // Cria preview local
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(processedFile)
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setImageUrl('')
    setImageCompressionInfo(null)
  }

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Erro ao fazer upload da imagem')
    }

    const data = await res.json()
    return data.url
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    // Validação: se criar movimentação inicial, preço de compra é obrigatório
    if (!product && createInitialMovement) {
      const quantityValue = (e.currentTarget.querySelector('[name="quantity"]') as HTMLInputElement)?.value
      const quantity = Number(quantityValue || 0)
      
      if (quantity > 0 && (!purchasePrice || purchasePrice.trim() === '')) {
        setError('Preço de Compra é obrigatório quando você marca "Criar movimentação inicial"')
        return
      }
    }
    
    setIsUploading(true)

    try {
      // Faz upload da imagem se houver arquivo selecionado
      // Prioridade: 1) Novo arquivo para upload, 2) imageUrl limpo (remover), 3) Manter existente
      let finalImageUrl: string
      
      if (imageFile) {
        // Se há novo arquivo, faz upload (prioridade máxima)
        try {
          finalImageUrl = await uploadImage(imageFile)
        } catch (err: any) {
          setError(err.message || 'Erro ao fazer upload da imagem')
          setIsUploading(false)
          return
        }
      } else if (imageUrl === '') {
        // Se imageUrl foi explicitamente limpo (removido) e não há novo arquivo, remove do banco
        finalImageUrl = ''
      } else {
        // Se não há novo arquivo e imageUrl não foi limpo, mantém o existente
        finalImageUrl = imageUrl || (product?.imageUrl || '')
      }
    

      // Cria FormData a partir do formulário usando ref
      const form = formRef.current || e.currentTarget
      if (!form) {
        setError('Erro ao processar formulário')
        setIsUploading(false)
        return
      }
      
      const formData = new FormData(form)

      // Adiciona a URL da imagem (sempre, mesmo que vazia)
      formData.set('imageUrl', finalImageUrl || '')
      
      // Adiciona flag para criar movimentação inicial (apenas para novos produtos)
      if (!product) {
        formData.set('createInitialMovement', createInitialMovement ? 'true' : 'false')
      }

      // Garante que nome_vitrine seja sempre enviado (captura do formulário ou vazio)
      const nomeVitrineInput = form.querySelector<HTMLInputElement>('input[name="nome_vitrine"]')
      const nomeVitrineValue = nomeVitrineInput ? nomeVitrineInput.value || '' : ''
      formData.set('nome_vitrine', nomeVitrineValue)

    // Garante que os campos de vestuário sejam sempre enviados (mesmo que vazios)
    // Isso é necessário para que o backend saiba que os campos foram enviados
    if (isVestuarioSupplier) {
      formData.set('size', size || '')
      formData.set('color', color || '')
      formData.set('brand', brand || '')
      formData.set('material', material || '')
      formData.set('genero', genero || '')
    } else {
      // Se não é fornecedor de vestuário, envia vazio para remover o campo
      formData.set('genero', '')
    }

    // Garante que os campos de jóias sejam sempre enviados (mesmo que vazios)
    if (isJoiaSupplier) {
      formData.set('tipo_joia', tipo_joia || '')
      formData.set('pedra', pedra || '')
      formData.set('quilate', quilate || '')
      formData.set('material', material || '')
    } else {
      // Se não é fornecedor de jóias, envia vazio para remover os campos
      formData.set('tipo_joia', '')
      formData.set('pedra', '')
      formData.set('quilate', '')
    }

    // Garante que os campos de sapatos sejam sempre enviados (mesmo que vazios)
    if (isSapatoSupplier) {
      // Usa 'numeracao' (sem acentuação) para evitar problemas de encoding no FormData
      formData.set('numeracao', numeração || '')
      formData.set('tipo_sapato', tipo_sapato || '')
      formData.set('color', color || '')
      formData.set('brand', brand || '')
      formData.set('material', material || '')
    } else {
      // Se não é fornecedor de sapatos, envia vazio para remover os campos
      formData.set('numeracao', '')
      formData.set('tipo_sapato', '')
    }
      
    // Adiciona pre_venda (sempre envia, mesmo que false)
    formData.set('pre_venda', pre_venda ? 'true' : 'false')

    startTransition(async () => {
      const result = product
        ? await updateProduct(product._id, formData)
        : await createProduct(formData)

      if (result.error) {
        setError(result.error)
          setIsUploading(false)
      } else {
        setOpen(false)
        setPurchasePrice('')
        setSalePrice('')
        setSize('')
        setColor('')
        setBrand('')
        setMaterial('')
        setGenero('')
        setTipo_joia('')
        setPedra('')
        setQuilate('')
        setNumeração('')
        setTipo_sapato('')
        setPre_venda(false)
        setImageUrl('')
        setImageFile(null)
        setImagePreview(null)
        setImageCompressionInfo(null)
        setIsUploading(false)
        router.refresh()
      }
    })
    } catch (err: any) {
      setError(err.message || 'Erro ao processar formulário')
      setIsUploading(false)
    }
  }

  // Reset form when modal opens/closes or product changes
  React.useEffect(() => {
    if (open && product) {
      setSelectedSupplier(product.supplierId || '')
      setPurchasePrice(product.purchasePrice?.toString() || '')
      setSalePrice(product.salePrice?.toString() || '')
      setSize(product.size || '')
      setColor(product.color || '')
      setBrand(product.brand || '')
      setMaterial(product.material || '')
      setGenero(product.genero || '')
      setPre_venda(product.pre_venda || false)
      setTipo_joia((product as any)?.tipo_joia || '')
      setPedra((product as any)?.pedra || '')
      setQuilate((product as any)?.quilate?.toString() || '')
      setNumeração((product as any)?.numeração || '')
      setTipo_sapato((product as any)?.tipo_sapato || '')
      setImageUrl(product.imageUrl || '')
      setImagePreview(product.imageUrl || null)
      setImageFile(null)
    } else if (!open && !product) {
      // Só reseta se não estiver editando
      setSelectedSupplier('')
      setPurchasePrice('')
      setSalePrice('')
      setSize('')
      setColor('')
      setBrand('')
      setMaterial('')
      setGenero('')
      setPre_venda(false)
      setTipo_joia('')
      setPedra('')
      setQuilate('')
      setNumeração('')
      setTipo_sapato('')
      setImageUrl('')
      setImageFile(null)
      setImagePreview(null)
      setImageCompressionInfo(null)
      setCreateInitialMovement(false)
    }
  }, [open, product])

  return (
    <>
      <div onClick={() => setOpen(true)}>{children}</div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              {product ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
          </DialogHeader>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            <div className="space-y-4">
              {/* Fornecedor - PRIMEIRO CAMPO */}
              <div className="space-y-2">
                <Label htmlFor="supplier" className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Fornecedor
                </Label>
                {isLoadingSuppliers ? (
                  <div className="h-11 w-full rounded-md border bg-muted animate-pulse" />
                ) : (
                  <Select
                    value={selectedSupplier}
                    onValueChange={setSelectedSupplier}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue 
                        placeholder="Selecione um fornecedor"
                        displayValue={
                          selectedSupplier
                            ? suppliers.find((s: any) => s._id === selectedSupplier)?.name || ''
                            : undefined
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum fornecedor</SelectItem>
                      {suppliers.map((supplier: any) => {
                        const categoryIcon = 
                          supplier.category === 'vestuario' ? '👕' :
                          supplier.category === 'joia' ? '💎' :
                          supplier.category === 'sapato' ? '👟' :
                          ''
                        return (
                          <SelectItem key={supplier._id} value={supplier._id}>
                            {supplier.name} {categoryIcon}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                )}
                <input type="hidden" name="supplierId" value={selectedSupplier} />
              </div>

              {/* Campos de vestuário - aparecem IMEDIATAMENTE após selecionar fornecedor de vestuário */}
              {isVestuarioSupplier && (
                <div className="space-y-4 p-4 bg-purple-50 rounded-lg border-2 border-purple-200 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Shirt className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-purple-900">Informações de Vestuário</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="size" className="text-sm font-semibold flex items-center gap-2">
                        <Ruler className="h-4 w-4" />
                        Tamanho
                      </Label>
                      <Input
                        id="size"
                        name="size"
                        value={size}
                        onChange={(e) => setSize(e.target.value)}
                        placeholder="Ex: P, M, G, GG"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="color" className="text-sm font-semibold flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        Cor
                      </Label>
                      <Input
                        id="color"
                        name="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        placeholder="Ex: Azul, Vermelho"
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="brand" className="text-sm font-semibold flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        Marca
                      </Label>
                      <Input
                        id="brand"
                        name="brand"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        placeholder="Ex: Nike, Adidas"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="material" className="text-sm font-semibold flex items-center gap-2">
                        <Shirt className="h-4 w-4" />
                        Material
                      </Label>
                      <Input
                        id="material"
                        name="material"
                        value={material}
                        onChange={(e) => setMaterial(e.target.value)}
                        placeholder="Ex: Algodão, Poliéster"
                        className="h-11"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Campo Gênero (para vestuário) */}
              {isVestuarioSupplier && (
                <div className="space-y-2">
                  <Label htmlFor="genero" className="text-sm font-semibold flex items-center gap-2">
                    <Shirt className="h-4 w-4" />
                    Gênero
                  </Label>
                  <Select value={genero} onValueChange={(value: any) => setGenero(value)}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecione o gênero" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Não especificado</SelectItem>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                      <SelectItem value="unissex">Unissex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Campos de Jóias */}
              {isJoiaSupplier && (
                <div className="space-y-4 p-4 bg-amber-50 rounded-lg border-2 border-amber-200 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-5 w-5 text-amber-600" />
                    <h3 className="font-semibold text-amber-900">Informações de Jóia</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tipo_joia" className="text-sm font-semibold flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Tipo de Jóia
                      </Label>
                      <Select value={tipo_joia} onValueChange={setTipo_joia}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Não especificado</SelectItem>
                          <SelectItem value="anel">Anel</SelectItem>
                          <SelectItem value="brinco">Brinco</SelectItem>
                          <SelectItem value="colar">Colar</SelectItem>
                          <SelectItem value="pulseira">Pulseira</SelectItem>
                          <SelectItem value="pingente">Pingente</SelectItem>
                          <SelectItem value="broche">Broche</SelectItem>
                          <SelectItem value="tiara">Tiara</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      {/* Campo hidden para garantir que o valor seja enviado no formData */}
                      <input type="hidden" name="tipo_joia" value={tipo_joia} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="material" className="text-sm font-semibold flex items-center gap-2">
                        <Shirt className="h-4 w-4" />
                        Material
                      </Label>
                      <Select value={material} onValueChange={setMaterial}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Selecione o material" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Não especificado</SelectItem>
                          <SelectItem value="ouro">Ouro</SelectItem>
                          <SelectItem value="prata">Prata</SelectItem>
                          <SelectItem value="ouro-branco">Ouro Branco</SelectItem>
                          <SelectItem value="platina">Platina</SelectItem>
                          <SelectItem value="aço">Aço</SelectItem>
                          <SelectItem value="latão">Latão</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      {/* Campo hidden para garantir que o valor seja enviado no formData */}
                      <input type="hidden" name="material" value={material} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pedra" className="text-sm font-semibold flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        Pedra
                      </Label>
                      <Input
                        id="pedra"
                        name="pedra"
                        value={pedra}
                        onChange={(e) => setPedra(e.target.value)}
                        placeholder="Ex: Diamante, Rubi, Esmeralda"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quilate" className="text-sm font-semibold flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        Quilate
                      </Label>
                      <Input
                        id="quilate"
                        name="quilate"
                        type="number"
                        min="0"
                        step="0.1"
                        value={quilate}
                        onChange={(e) => setQuilate(e.target.value)}
                        placeholder="Ex: 18, 24"
                        className="h-11"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Campos de Sapatos */}
              {isSapatoSupplier && (
                <div className="space-y-4 p-4 bg-green-50 rounded-lg border-2 border-green-200 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Ruler className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-green-900">Informações de Sapato</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="numeração" className="text-sm font-semibold flex items-center gap-2">
                        <Ruler className="h-4 w-4" />
                        Numeração
                      </Label>
                      <Input
                        id="numeração"
                        name="numeracao"
                        value={numeração}
                        onChange={(e) => setNumeração(e.target.value)}
                        placeholder="Ex: 35, 36, 37, 38, 39, 40"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tipo_sapato" className="text-sm font-semibold flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Tipo de Sapato
                      </Label>
                      <Select value={tipo_sapato} onValueChange={setTipo_sapato}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Não especificado</SelectItem>
                          <SelectItem value="tênis">Tênis</SelectItem>
                          <SelectItem value="sandália">Sandália</SelectItem>
                          <SelectItem value="bota">Bota</SelectItem>
                          <SelectItem value="sapato-social">Sapato Social</SelectItem>
                          <SelectItem value="sapatilha">Sapatilha</SelectItem>
                          <SelectItem value="chinelo">Chinelo</SelectItem>
                          <SelectItem value="rasteira">Rasteira</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      {/* Campo hidden para garantir que o valor seja enviado no formData */}
                      <input type="hidden" name="tipo_sapato" value={tipo_sapato} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="color" className="text-sm font-semibold flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        Cor
                      </Label>
                      <Input
                        id="color"
                        name="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        placeholder="Ex: Preto, Branco, Marrom"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="brand" className="text-sm font-semibold flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        Marca
                      </Label>
                      <Input
                        id="brand"
                        name="brand"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        placeholder="Ex: Nike, Adidas, Vans"
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="material" className="text-sm font-semibold flex items-center gap-2">
                      <Shirt className="h-4 w-4" />
                      Material
                    </Label>
                    <Select value={material} onValueChange={setMaterial}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Selecione o material" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Não especificado</SelectItem>
                        <SelectItem value="couro">Couro</SelectItem>
                        <SelectItem value="sintético">Sintético</SelectItem>
                        <SelectItem value="camurça">Camurça</SelectItem>
                        <SelectItem value="tecido">Tecido</SelectItem>
                        <SelectItem value="borracha">Borracha</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Campo Pre-Venda */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <input
                    type="checkbox"
                    id="pre_venda"
                    checked={pre_venda}
                    onChange={(e) => setPre_venda(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label 
                    htmlFor="pre_venda" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Produto em Pré-venda
                  </Label>
                </div>
              </div>

              {/* Upload de Imagem */}
              <div className="space-y-2">
                <Label htmlFor="image" className="text-sm font-semibold flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Imagem do Produto
                </Label>
                <div className="space-y-3">
                  {imagePreview ? (
                    <div className="relative group">
                      <div className="relative w-full h-48 rounded-lg border-2 border-dashed border-muted-foreground/25 overflow-hidden bg-muted/50">
                        <Image
                          src={imagePreview}
                          alt="Preview"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={handleRemoveImage}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            disabled={isUploading}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Remover
                          </Button>
                        </div>
                      </div>
                      {isUploading && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Comprimindo imagem...</span>
                        </div>
                      )}
                      {imageFile && !isUploading && (
                        <div className="space-y-1 mt-1">
                          <p className="text-xs text-muted-foreground">
                            Imagem será enviada ao salvar o produto
                          </p>
                          {imageCompressionInfo && (
                            <p className="text-xs text-amber-600">
                              Imagem comprimida: {(imageCompressionInfo.original / 1024 / 1024).toFixed(2)}MB → {(imageCompressionInfo.compressed / 1024 / 1024).toFixed(2)}MB
                              ({((1 - imageCompressionInfo.compressed / imageCompressionInfo.original) * 100).toFixed(0)}% de redução)
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      <Input
                        id="image"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleImageSelect}
                        disabled={isUploading}
                        className="h-11 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                      />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Formatos aceitos: JPEG, PNG, WebP. Tamanho máximo: 5MB. A imagem será enviada apenas ao salvar o produto.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Nome do Produto *
                </Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={product?.name}
                  required
                  placeholder="Ex: Notebook Dell"
                  className="h-11 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome_vitrine" className="text-sm font-semibold flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Nome na Vitrine
                </Label>
                <Input
                  id="nome_vitrine"
                  name="nome_vitrine"
                  defaultValue={product?.nome_vitrine}
                  placeholder="Ex: Notebook Dell Inspiron 15 (será exibido na vitrine)"
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Nome personalizado para exibição na vitrine. Se não preenchido, será usado o nome do produto.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku" className="text-sm font-semibold flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    SKU
                  </Label>
                  <Input
                    id="sku"
                    name="sku"
                    defaultValue={product?.sku}
                    placeholder="Ex: NTB-001"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-semibold flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Categoria
                  </Label>
                  <Input
                    id="category"
                    name="category"
                    defaultValue={product?.category}
                    placeholder="Ex: Eletrônicos"
                    className="h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg border">
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-sm font-semibold flex items-center gap-2">
                    <Box className="h-4 w-4" />
                    Estoque Inicial *
                  </Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="0"
                    defaultValue={product?.quantity ?? 0}
                    required
                    className="h-11 text-lg font-semibold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minQuantity" className="text-sm font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Estoque Mínimo *
                  </Label>
                  <Input
                    id="minQuantity"
                    name="minQuantity"
                    type="number"
                    min="0"
                    defaultValue={product?.minQuantity ?? 0}
                    required
                    className="h-11 text-lg font-semibold"
                  />
                </div>
              </div>

              {!product && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <input
                      type="checkbox"
                      id="createInitialMovement"
                      checked={createInitialMovement}
                      onChange={(e) => setCreateInitialMovement(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label 
                      htmlFor="createInitialMovement" 
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Criar movimentação inicial para refletir no estoque e estatísticas
                    </Label>
                  </div>
                  {createInitialMovement && (
                    <Alert className="bg-amber-50 border-amber-200">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-sm text-amber-800">
                        <strong>Atenção:</strong> Para criar a movimentação inicial, o <strong>Preço de Compra</strong> é obrigatório. 
                        A movimentação só será registrada se o preço de compra for informado.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchasePrice" className="text-sm font-semibold flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Preço de Compra
                    {!product && createInitialMovement && (
                      <span className="text-destructive">*</span>
                    )}
                  </Label>
                  <CurrencyInput
                    id="purchasePrice"
                    name="purchasePrice"
                    value={purchasePrice}
                    onChange={setPurchasePrice}
                    placeholder="0,00"
                    className="h-11"
                    required={!product && createInitialMovement}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salePrice" className="text-sm font-semibold flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Preço de Venda
                  </Label>
                  <CurrencyInput
                    id="salePrice"
                    name="salePrice"
                    value={salePrice}
                    onChange={setSalePrice}
                    placeholder="0,00"
                    className="h-11"
                  />
                </div>
              </div>

            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="h-11"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending || isUploading} className="h-11 min-w-[120px]">
                {(isPending || isUploading) ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isUploading ? 'Enviando imagem...' : (product ? 'Salvando...' : 'Criando...')}
                  </span>
                ) : (
                  product ? 'Atualizar' : 'Criar Produto'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

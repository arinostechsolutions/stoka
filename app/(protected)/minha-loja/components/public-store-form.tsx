'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertCircle, Globe, MessageSquare, Phone, Package, Loader2, Image as ImageIcon, X, Palette } from 'lucide-react'
import { createPublicStore, updatePublicStore } from '../actions'
import { ProductSelector } from './product-selector'
import { useQuery } from '@tanstack/react-query'
import imageCompression from 'browser-image-compression'
import Image from 'next/image'

async function fetchProducts() {
  const res = await fetch('/api/products')
  if (!res.ok) throw new Error('Erro ao carregar produtos')
  return res.json()
}

interface PublicStoreFormProps {
  store?: {
    _id: string
    slug: string
    title: string
    description?: string
    whatsappMessage: string
    phone: string
    selectedProducts: string[]
    isActive: boolean
    backgroundColor?: string
    logoUrl?: string
  } | null
}

export function PublicStoreForm({ store }: PublicStoreFormProps) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [slug, setSlug] = useState(store?.slug || '')
  const [title, setTitle] = useState(store?.title || '')
  const [description, setDescription] = useState(store?.description || '')
  const [whatsappMessage, setWhatsappMessage] = useState(store?.whatsappMessage || 'Olá! Tenho interesse nos seguintes produtos:')
  const [phone, setPhone] = useState(store?.phone || '')
  const [selectedProducts, setSelectedProducts] = useState<string[]>(store?.selectedProducts || [])
  const [isActive, setIsActive] = useState(store?.isActive ?? true)
  const [backgroundColor, setBackgroundColor] = useState(store?.backgroundColor || '#FFFFFF')
  const [logoUrl, setLogoUrl] = useState(store?.logoUrl || '')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(store?.logoUrl || null)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [logoCompressionInfo, setLogoCompressionInfo] = useState<{ original: number; compressed: number } | null>(null)

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  })

  // Sincroniza os dados quando o store mudar
  useEffect(() => {
    if (store) {
      setSlug(store.slug || '')
      setTitle(store.title || '')
      setDescription(store.description || '')
      setWhatsappMessage(store.whatsappMessage || 'Olá! Tenho interesse nos seguintes produtos:')
      setPhone(store.phone || '')
      setSelectedProducts(store.selectedProducts || [])
      setIsActive(store.isActive ?? true)
      setBackgroundColor(store.backgroundColor || '#FFFFFF')
      setLogoUrl(store.logoUrl || '')
      setLogoPreview(store.logoUrl || null)
      setLogoFile(null) // Limpa o arquivo quando carrega do banco
    } else {
      // Reset quando não há store
      setBackgroundColor('#FFFFFF')
      setLogoUrl('')
      setLogoPreview(null)
      setLogoFile(null)
    }
  }, [store]) // Sincroniza quando o store mudar completamente

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setIsUploadingLogo(true)
      setLogoCompressionInfo(null)
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
          setLogoCompressionInfo({
            original: originalSize,
            compressed: processedFile.size,
          })
        }
      } catch (error: any) {
        console.error('Erro ao comprimir imagem:', error)
        setError('Erro ao comprimir imagem. Tente uma imagem menor.')
        setIsUploadingLogo(false)
        setLogoCompressionInfo(null)
        return
      } finally {
        setIsUploadingLogo(false)
      }
    } else {
      setLogoCompressionInfo(null)
    }

    setLogoFile(processedFile)
    setError('')

    // Cria preview local
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result as string)
    }
    reader.readAsDataURL(processedFile)
  }

  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    setLogoUrl('')
    setLogoCompressionInfo(null)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!slug.trim()) {
      setError('Slug é obrigatório')
      return
    }

    if (!title.trim()) {
      setError('Título é obrigatório')
      return
    }

    if (!whatsappMessage.trim()) {
      setError('Mensagem do WhatsApp é obrigatória')
      return
    }

    if (!phone.trim()) {
      setError('Número do WhatsApp é obrigatório')
      return
    }

    // Upload do logotipo se houver arquivo novo
    let finalLogoUrl = logoUrl
    if (logoFile) {
      try {
        setIsUploadingLogo(true)
        const uploadFormData = new FormData()
        uploadFormData.append('file', logoFile)
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        })
        
        if (!uploadResponse.ok) {
          throw new Error('Erro ao fazer upload do logotipo')
        }
        
        const uploadData = await uploadResponse.json()
        finalLogoUrl = uploadData.url
      } catch (err: any) {
        setError(err.message || 'Erro ao fazer upload do logotipo')
        setIsUploadingLogo(false)
        return
      } finally {
        setIsUploadingLogo(false)
      }
    }

    const formData = new FormData()
    formData.set('slug', slug.trim().toLowerCase())
    formData.set('title', title.trim())
    formData.set('description', description.trim())
    formData.set('whatsappMessage', whatsappMessage.trim())
    formData.set('phone', phone.replace(/\D/g, ''))
    formData.set('selectedProducts', JSON.stringify(selectedProducts))
    formData.set('isActive', isActive ? 'true' : 'false')
    formData.set('backgroundColor', backgroundColor || '#FFFFFF')
    formData.set('logoUrl', finalLogoUrl || '')

    console.log('=== FORMULÁRIO - ANTES DE ENVIAR ===')
    console.log('backgroundColor no estado:', backgroundColor)
    console.log('finalLogoUrl:', finalLogoUrl)
    console.log('backgroundColor no FormData:', formData.get('backgroundColor'))
    console.log('logoUrl no FormData:', formData.get('logoUrl'))

    startTransition(async () => {
      const result = store
        ? await updatePublicStore(store._id, formData)
        : await createPublicStore(formData)

      if (result.error) {
        setError(result.error)
      } else {
        if (finalLogoUrl) {
          setLogoUrl(finalLogoUrl)
        }
        router.refresh()
      }
    })
  }


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Informações Básicas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="slug" className="text-sm font-semibold">
              Slug da URL *
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/loja/</span>
              <Input
                id="slug"
                value={slug}
                onKeyDown={(e) => {
                  // Intercepta a tecla Space e converte para traço
                  if (e.key === ' ') {
                    e.preventDefault()
                    const input = e.target as HTMLInputElement
                    const cursorPosition = input.selectionStart || 0
                    const newValue = 
                      slug.slice(0, cursorPosition) + 
                      '-' + 
                      slug.slice(cursorPosition)
                    setSlug(newValue)
                    // Reposiciona o cursor após o traço inserido
                    setTimeout(() => {
                      input.setSelectionRange(cursorPosition + 1, cursorPosition + 1)
                    }, 0)
                  }
                }}
                onChange={(e) => {
                  const inputValue = e.target.value
                  // Primeiro converte para minúsculas
                  let processedValue = inputValue.toLowerCase()
                  
                  // Converte espaços em traços (ANTES de remover outros caracteres)
                  processedValue = processedValue.replace(/\s+/g, '-')
                  
                  // Remove caracteres inválidos (mantém apenas letras, números e traços)
                  processedValue = processedValue.replace(/[^a-z0-9-]/g, '')
                  
                  // Remove traços múltiplos consecutivos
                  processedValue = processedValue.replace(/-+/g, '-')
                  
                  // Remove traços no início e fim
                  processedValue = processedValue.replace(/^-+|-+$/g, '')
                  
                  setSlug(processedValue)
                }}
                placeholder="minha-loja"
                required
                className="flex-1"
                disabled={!!store}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {store 
                ? 'O slug não pode ser alterado após a criação'
                : 'URL única da sua loja (apenas letras minúsculas, números e hífens)'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-semibold">
              Título da Loja *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Minha Loja de Roupas"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold">
              Descrição (opcional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva sua loja..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Personalização Visual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="backgroundColor" className="text-sm font-semibold flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Cor de Fundo
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="backgroundColor"
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-20 h-10 cursor-pointer"
                disabled={isPending || isUploadingLogo}
              />
              <Input
                type="text"
                value={backgroundColor}
                onChange={(e) => {
                  const value = e.target.value
                  if (value.match(/^#[0-9A-Fa-f]{0,6}$/) || value === '') {
                    setBackgroundColor(value || '#FFFFFF')
                  }
                }}
                placeholder="#FFFFFF"
                className="flex-1 font-mono"
                disabled={isPending || isUploadingLogo}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Escolha a cor de fundo da sua página pública
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo" className="text-sm font-semibold flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Logotipo
            </Label>
            {logoPreview ? (
              <div className="relative inline-block">
                <div className="relative w-32 h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg overflow-hidden bg-muted/50">
                  <Image
                    src={logoPreview}
                    alt="Preview do logotipo"
                    fill
                    className="object-contain p-2"
                    unoptimized
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  onClick={handleRemoveLogo}
                  disabled={isPending || isUploadingLogo}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                <label
                  htmlFor="logo"
                  className={`flex flex-col items-center justify-center cursor-pointer ${isPending || isUploadingLogo ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground text-center">
                    {isUploadingLogo ? 'Comprimindo imagem...' : 'Clique para fazer upload do logotipo'}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    JPEG, PNG ou WebP (máx. 5MB)
                  </span>
                </label>
                <input
                  id="logo"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleLogoSelect}
                  className="hidden"
                  disabled={isPending || isUploadingLogo}
                />
              </div>
            )}
            {logoCompressionInfo && (
              <p className="text-xs text-green-600">
                Imagem comprimida: {(logoCompressionInfo.original / 1024 / 1024).toFixed(2)}MB → {(logoCompressionInfo.compressed / 1024 / 1024).toFixed(2)}MB
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              O logotipo será exibido acima do título na página pública. Imagens maiores que 5MB serão comprimidas automaticamente.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Configuração do WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-semibold flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Número do WhatsApp *
            </Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '')
                setPhone(value)
              }}
              placeholder="5511999999999 (apenas números com DDD e código do país)"
              required
            />
            <p className="text-xs text-muted-foreground">
              Formato: código do país + DDD + número (ex: 5511999999999)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsappMessage" className="text-sm font-semibold">
              Mensagem Personalizada *
            </Label>
            <Textarea
              id="whatsappMessage"
              value={whatsappMessage}
              onChange={(e) => setWhatsappMessage(e.target.value)}
              placeholder="Olá! Tenho interesse nos seguintes produtos:"
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground">
              Esta mensagem aparecerá antes da lista de produtos. Use emojis se desejar! 😊
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Produtos Selecionados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProductSelector
            products={products}
            selectedProducts={selectedProducts}
            onSelectionChange={setSelectedProducts}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked === true)}
            />
            <Label htmlFor="isActive" className="text-sm font-medium cursor-pointer">
              Publicar página (tornar pública)
            </Label>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Quando desmarcado, a página não estará acessível publicamente
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 mb-0">
        <Button type="submit" disabled={isPending || isUploadingLogo}>
          {(isPending || isUploadingLogo) ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isUploadingLogo ? 'Fazendo upload do logotipo...' : 'Salvando...'}
            </>
          ) : store ? (
            'Atualizar Loja'
          ) : (
            'Criar Loja'
          )}
        </Button>
      </div>
    </form>
  )
}



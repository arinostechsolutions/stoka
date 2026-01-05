'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Download, Loader2, Store, CheckCircle, AlertCircle, Info } from 'lucide-react'

interface ExportNuvemshopButtonProps {
  children?: React.ReactNode
}

export function ExportNuvemshopButton({ children }: ExportNuvemshopButtonProps) {
  const [open, setOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch('/api/products/export-nuvemshop')
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao exportar produtos')
      }

      // Pega o blob do CSV
      const blob = await response.blob()
      
      // Cria link de download
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      // Pega o nome do arquivo do header ou usa padrão
      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `produtos-nuvemshop-${new Date().toISOString().split('T')[0]}.csv`
      
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Erro ao exportar produtos')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {children || (
          <Button variant="outline" size="lg">
            <Store className="mr-2 h-4 w-4" />
            Exportar Nuvemshop
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={(newOpen) => {
        setOpen(newOpen)
        if (!newOpen) {
          setError('')
          setSuccess(false)
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="h-6 w-6 text-primary" />
              Exportar para Nuvemshop
            </DialogTitle>
            <DialogDescription>
              Exporte seus produtos no formato CSV compatível com a Nuvemshop.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700 dark:text-green-300">
                  Produtos exportados com sucesso! O download foi iniciado automaticamente.
                </AlertDescription>
              </Alert>
            )}

            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700 dark:text-blue-300">
                <p className="font-semibold mb-2">Como funciona:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Produtos com <strong>mesmo nome</strong> são agrupados como variantes</li>
                  <li><strong>Cor</strong> e <strong>Tamanho</strong> são usados como variações</li>
                  <li>O <strong>Identificador URL</strong> é gerado automaticamente</li>
                  <li>Produtos sem estoque ficam como &quot;Não exibir na loja&quot;</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
              <p className="font-medium">Campos exportados:</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground text-xs">
                <span>• Nome do produto</span>
                <span>• Categoria</span>
                <span>• Cor (variação)</span>
                <span>• Tamanho (variação)</span>
                <span>• Preço de venda</span>
                <span>• Preço de custo</span>
                <span>• Estoque</span>
                <span>• SKU</span>
                <span>• Marca</span>
                <span>• Gênero</span>
                <span>• Material (descrição)</span>
                <span>• Numeração (sapatos)</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isExporting}
            >
              Fechar
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar CSV
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}


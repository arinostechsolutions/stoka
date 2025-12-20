'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Upload, FileText, AlertCircle, CheckCircle, Loader2, Download } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

async function fetchSuppliers() {
  const res = await fetch('/api/suppliers')
  if (!res.ok) throw new Error('Erro ao carregar fornecedores')
  return res.json()
}

export function ImportProductsForm({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<any>(null)

  const { data: suppliers = [], isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: fetchSuppliers,
  })

  // Encontra o nome do fornecedor selecionado
  const selectedSupplierName = suppliers.find((s: any) => s._id === selectedSupplier)?.name || ''

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Por favor, selecione um arquivo CSV')
        setFile(null)
        return
      }
      setFile(selectedFile)
      setError('')
      setResult(null)
    }
  }

  const handleDownloadTemplate = () => {
    const template = `nome,sku,categoria,quantidade,estoque_minimo,preco_compra,preco_venda,tamanho,cor,marca,material,pre_venda,genero,criar_movimentacao_inicial
Produto Exemplo 1,SKU001,Eletrônicos,10,2,50.00,100.00,,,,,false,,true
Produto Exemplo 2,SKU002,Vestuário,5,1,30.00,79.90,P,Azul,Nike,Algodão,false,masculino,true
Produto Exemplo 3,SKU003,,20,5,,,G,,,,true,feminino,false`

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'template-produtos.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResult(null)

    if (!selectedSupplier) {
      setError('Selecione um fornecedor')
      return
    }

    if (!file) {
      setError('Selecione um arquivo CSV')
      return
    }

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('supplierId', selectedSupplier)

        const res = await fetch('/api/products/import', {
          method: 'POST',
          body: formData,
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Erro ao importar produtos')
          return
        }

        setResult(data)
        
        // Limpa o formulário após sucesso
        if (data.errors === 0) {
          setFile(null)
          setSelectedSupplier('')
          // Reset do input file
          const fileInput = document.getElementById('csv-file') as HTMLInputElement
          if (fileInput) fileInput.value = ''
        }
        
        router.refresh()
      } catch (err: any) {
        setError(err.message || 'Erro ao importar produtos')
      }
    })
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>{children}</div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-6 w-6 text-primary" />
              Importar Produtos via CSV
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {result && (
              <Alert variant={result.errors > 0 ? 'default' : 'default'}>
                {result.errors > 0 ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-semibold">
                      {result.imported} produtos importados com sucesso
                      {result.errors > 0 && `, ${result.errors} erros encontrados`}
                    </p>
                    {result.errors > 0 && result.details?.errors && (
                      <div className="mt-2 text-sm space-y-1">
                        <p className="font-medium">Erros encontrados:</p>
                        {result.details.errors.slice(0, 5).map((err: any, idx: number) => (
                          <p key={idx} className="text-muted-foreground">
                            Linha {err.line}: {err.error}
                          </p>
                        ))}
                        {result.details.errors.length > 5 && (
                          <p className="text-muted-foreground">
                            ... e mais {result.details.errors.length - 5} erro(s)
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>Fornecedor *</Label>
              {isLoadingSuppliers ? (
                <div className="h-11 w-full rounded-md border bg-muted animate-pulse" />
              ) : (
                <Select
                  value={selectedSupplier}
                  onValueChange={setSelectedSupplier}
                >
                  <SelectTrigger>
                    <SelectValue 
                      placeholder="Selecione um fornecedor"
                      displayValue={selectedSupplierName}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier: any) => (
                      <SelectItem key={supplier._id} value={supplier._id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Arquivo CSV *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  className="h-auto p-1 text-xs"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Baixar Template
                </Button>
              </div>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={isPending}
              />
              {file && (
                <p className="text-xs text-muted-foreground">
                  Arquivo selecionado: {file.name}
                </p>
              )}
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-semibold">Formato esperado:</p>
                <p className="font-mono text-[10px]">
                  nome,sku,categoria,quantidade,estoque_minimo,preco_compra,preco_venda,tamanho,cor,marca,material,pre_venda,genero,criar_movimentacao_inicial
                </p>
                <p className="mt-1">
                  Campos opcionais podem ser deixados vazios. Use vírgula como separador.
                </p>
                <p className="mt-1 text-amber-600">
                  <strong>pre_venda:</strong> Use &quot;true&quot;, &quot;1&quot;, &quot;sim&quot; ou &quot;yes&quot; para marcar como pré-venda. (opcional)
                </p>
                <p className="mt-1 text-amber-600">
                  <strong>genero:</strong> Use &quot;masculino&quot;, &quot;feminino&quot; ou &quot;unissex&quot;. Apenas para produtos de vestuário. (opcional)
                </p>
                <p className="mt-1 text-amber-600">
                  <strong>criar_movimentacao_inicial:</strong> Use &quot;true&quot;, &quot;1&quot;, &quot;sim&quot; ou &quot;yes&quot; para criar movimentação inicial. 
                  Requer preço_compra preenchido.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false)
                  setFile(null)
                  setResult(null)
                  setError('')
                  setSelectedSupplier('')
                }}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending || !file || !selectedSupplier}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Importar
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}


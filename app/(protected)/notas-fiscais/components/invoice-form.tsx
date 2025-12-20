'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { FileText, ExternalLink, User, Building2, MapPin, Phone, Mail, Copy, Check, Package } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'

interface InvoiceFormProps {
  children: React.ReactNode
  movement: any
}

export function InvoiceForm({ children, movement }: InvoiceFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // Dados do cliente
  const [clientType, setClientType] = useState<'cpf' | 'cnpj'>('cpf')
  const [clientDocument, setClientDocument] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [clientCity, setClientCity] = useState('')
  const [clientState, setClientState] = useState('')
  const [clientZipCode, setClientZipCode] = useState('')

  // Estados brasileiros
  const states = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ]

  const product = movement.productId

  // Calcula valores
  const unitPrice = movement.salePrice || 0
  const quantity = movement.quantity
  const subtotal = unitPrice * quantity
  const discount = movement.discountValue || 0
  const total = movement.totalRevenue || subtotal

  // Gera resumo formatado para copiar
  const generateSummary = () => {
    return `
DADOS DO CLIENTE:
${clientType.toUpperCase()}: ${clientDocument}
Nome/Razão Social: ${clientName}
${clientEmail ? `Email: ${clientEmail}` : ''}
${clientPhone ? `Telefone: ${clientPhone}` : ''}
${clientAddress ? `Endereço: ${clientAddress}` : ''}
${clientCity ? `Cidade: ${clientCity}` : ''}
${clientState ? `Estado: ${clientState}` : ''}
${clientZipCode ? `CEP: ${clientZipCode}` : ''}

DADOS DO PRODUTO:
Produto: ${product?.name || 'N/A'}
Quantidade: ${quantity}
Preço Unitário: ${formatCurrency(unitPrice)}
${discount > 0 ? `Desconto: ${formatCurrency(discount)}` : ''}
Total: ${formatCurrency(total)}
    `.trim()
  }

  const handleCopy = async () => {
    const summary = generateSummary()
    await navigator.clipboard.writeText(summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleOpenEmissor = () => {
    // Abre o Emissor Web do governo em nova aba
    window.open('https://www.gov.br/nfse/pt-br', '_blank')
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>{children}</div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Emissão de Nota Fiscal
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Informações do Produto */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Dados do Produto
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Produto:</span>
                    <span className="font-medium">{product?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quantidade:</span>
                    <span className="font-medium">{quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Preço Unitário:</span>
                    <span className="font-medium">{formatCurrency(unitPrice)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Desconto:</span>
                      <span className="font-medium text-red-600">- {formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t font-semibold">
                    <span>Total:</span>
                    <span className="text-primary">{formatCurrency(total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dados do Cliente */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Dados do Cliente
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tipo de Documento</Label>
                    <Select value={clientType} onValueChange={(v: 'cpf' | 'cnpj') => setClientType(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cpf">CPF</SelectItem>
                        <SelectItem value="cnpj">CNPJ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{clientType === 'cpf' ? 'CPF' : 'CNPJ'} *</Label>
                    <Input
                      value={clientDocument}
                      onChange={(e) => setClientDocument(e.target.value)}
                      placeholder={clientType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{clientType === 'cpf' ? 'Nome Completo' : 'Razão Social'} *</Label>
                    <Input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder={clientType === 'cpf' ? 'Nome completo do cliente' : 'Razão social da empresa'}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="email@exemplo.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Telefone</Label>
                      <Input
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Endereço</Label>
                    <Input
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      placeholder="Rua, número, complemento"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Cidade</Label>
                      <Input
                        value={clientCity}
                        onChange={(e) => setClientCity(e.target.value)}
                        placeholder="Cidade"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Estado</Label>
                      <Select value={clientState} onValueChange={setClientState}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {states.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>CEP</Label>
                      <Input
                        value={clientZipCode}
                        onChange={(e) => setClientZipCode(e.target.value)}
                        placeholder="00000-000"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resumo e Ações */}
            <div className="flex flex-col gap-3 pt-4 border-t">
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleOpenEmissor}
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir Emissor Web do Governo
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCopy}
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copiar Resumo
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Fechar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Preencha os dados acima e use o botão "Copiar Resumo" para facilitar o preenchimento no Emissor Web.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}


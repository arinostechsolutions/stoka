import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

export const productSchema = z.object({
  name: z.string().min(1, 'Nome do produto é obrigatório'),
  nome_vitrine: z.string().optional(),
  sku: z.string().optional(),
  category: z.string().optional(),
  supplierId: z.string().optional(),
  quantity: z.number().min(0, 'Quantidade não pode ser negativa'),
  minQuantity: z.number().min(0, 'Estoque mínimo não pode ser negativa'),
  purchasePrice: z.number().min(0, 'Preço de compra não pode ser negativo').optional(),
  salePrice: z.number().min(0, 'Preço de venda não pode ser negativo').optional(),
  // Campos específicos para vestuário
  size: z.string().optional(),
  color: z.string().optional(),
  brand: z.string().optional(),
  material: z.string().optional(),
  imageUrl: z.string().url('URL da imagem inválida').optional().or(z.literal('')),
  pre_venda: z.boolean().optional().default(false),
  genero: z.enum(['masculino', 'feminino', 'unissex']).optional(),
})

export const movementSchema = z.object({
  productId: z.string().min(1, 'Produto é obrigatório'),
  supplierId: z.string().optional(),
  type: z.enum(['entrada', 'saida', 'ajuste']),
  quantity: z.number().min(0, 'Quantidade não pode ser negativa'),
  price: z.number().min(0, 'Preço não pode ser negativo').optional(),
  salePrice: z.number().min(0, 'Preço de venda não pode ser negativo').optional(),
  discountType: z.enum(['percent', 'fixed']).optional(),
  discountValue: z.number().min(0, 'Valor do desconto não pode ser negativo').optional(),
  campaignId: z.string().optional(),
  notes: z.string().optional(),
})

export const supplierSchema = z.object({
  name: z.string().min(1, 'Nome do fornecedor é obrigatório'),
  category: z.enum(['geral', 'vestuario']).optional().default('geral'),
  cnpj: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
})

export const childSchema = z.object({
  name: z.string().min(1, 'Nome da criança é obrigatório'),
  age: z.number().min(0, 'Idade não pode ser negativa').optional(),
  size: z.string().optional(),
  gender: z.enum(['masculino', 'feminino']).optional(),
})

export const customerSchema = z.object({
  name: z.string().min(1, 'Nome do cliente é obrigatório'),
  phone: z.string().optional(),
  address: z.string().optional(),
  instagram: z.string().optional(),
  children: z.array(childSchema).optional().default([]),
})

export const campaignSchema = z.object({
  name: z.string().min(1, 'Nome da campanha é obrigatório'),
  description: z.string().optional(),
})

export const publicStoreSchema = z.object({
  slug: z.string()
    .min(3, 'Slug deve ter no mínimo 3 caracteres')
    .max(50, 'Slug deve ter no máximo 50 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Slug inválido. Use apenas letras minúsculas, números e hífens'),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  whatsappMessage: z.string().min(1, 'Mensagem do WhatsApp é obrigatória'),
  phone: z.string()
    .min(10, 'Número do WhatsApp inválido')
    .regex(/^\d+$/, 'Número do WhatsApp deve conter apenas dígitos'),
  selectedProducts: z.array(z.string()).optional().default([]),
  isActive: z.boolean().optional().default(true),
  backgroundColor: z.string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Cor de fundo inválida. Use formato hexadecimal (ex: #FFFFFF)')
    .optional(),
  logoUrl: z.string().url('URL do logotipo inválida').optional().or(z.literal('')),
})

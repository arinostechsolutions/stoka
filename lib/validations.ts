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
})

export const movementSchema = z.object({
  productId: z.string().min(1, 'Produto é obrigatório'),
  supplierId: z.string().optional(),
  type: z.enum(['entrada', 'saida', 'ajuste']),
  quantity: z.number().min(0, 'Quantidade não pode ser negativa'),
  price: z.number().min(0, 'Preço não pode ser negativo').optional(),
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


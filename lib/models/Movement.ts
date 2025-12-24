import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export type MovementType = 'entrada' | 'saida' | 'ajuste'

export interface IMovement extends Document {
  userId: Types.ObjectId
  productId: Types.ObjectId
  supplierId?: Types.ObjectId
  type: MovementType
  quantity: number
  previousQuantity: number
  newQuantity: number
  price?: number // Preço unitário na movimentação (entrada)
  totalPrice?: number // Preço total (quantity * price) para entrada
  salePrice?: number // Preço unitário de venda (saída)
  discountType?: 'percent' | 'fixed' // Tipo de desconto
  discountValue?: number // Valor do desconto (percentual ou fixo)
  totalRevenue?: number // Receita total após desconto (quantity * salePrice - discount)
  campaignId?: Types.ObjectId // Campanha associada à venda
  customerId?: Types.ObjectId // Cliente associado à venda
  paymentMethod?: 'cartao_credito' | 'cartao_debito' | 'pix' | 'pix_parcelado' // Meio de pagamento
  installmentsCount?: number // Quantidade de parcelas (apenas para pix_parcelado)
  installmentDueDate?: Date // Data limite para pagamento da primeira parcela (apenas para pix_parcelado)
  saleGroupId?: Types.ObjectId // ID para agrupar múltiplas vendas (quando uma venda tem múltiplos produtos)
  notes?: string
  createdAt: Date
}

const MovementSchema = new Schema<IMovement>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      index: true,
      required: false,
    },
    type: {
      type: String,
      enum: ['entrada', 'saida', 'ajuste'],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, 'Quantidade não pode ser negativa'],
    },
    previousQuantity: {
      type: Number,
      required: true,
    },
    newQuantity: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      min: [0, 'Preço não pode ser negativo'],
    },
    totalPrice: {
      type: Number,
      min: [0, 'Preço total não pode ser negativo'],
    },
    salePrice: {
      type: Number,
      min: [0, 'Preço de venda não pode ser negativo'],
    },
    discountType: {
      type: String,
      enum: ['percent', 'fixed'],
    },
    discountValue: {
      type: Number,
      min: [0, 'Valor do desconto não pode ser negativo'],
    },
    totalRevenue: {
      type: Number,
      min: [0, 'Receita total não pode ser negativa'],
    },
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      index: true,
      required: false,
    },
    paymentMethod: {
      type: String,
      enum: ['cartao_credito', 'cartao_debito', 'pix', 'pix_parcelado'],
      required: false,
    },
    installmentsCount: {
      type: Number,
      min: [1, 'Quantidade de parcelas deve ser pelo menos 1'],
    },
    installmentDueDate: {
      type: Date,
    },
    saleGroupId: {
      type: Schema.Types.ObjectId,
      index: true,
      required: false,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

MovementSchema.index({ userId: 1, createdAt: -1 })
MovementSchema.index({ productId: 1, createdAt: -1 })
MovementSchema.index({ userId: 1, supplierId: 1 })
MovementSchema.index({ userId: 1, type: 1, createdAt: -1 })
MovementSchema.index({ customerId: 1, createdAt: -1 })
MovementSchema.index({ saleGroupId: 1 })

const Movement: Model<IMovement> = mongoose.models.Movement || mongoose.model<IMovement>('Movement', MovementSchema)

export default Movement

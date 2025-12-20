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

const Movement: Model<IMovement> = mongoose.models.Movement || mongoose.model<IMovement>('Movement', MovementSchema)

export default Movement

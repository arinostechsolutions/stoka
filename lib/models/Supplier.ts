import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export type SupplierCategory = 'geral' | 'vestuario'

export interface ISupplier extends Document {
  userId: Types.ObjectId
  name: string
  category?: SupplierCategory
  cnpj?: string
  email?: string
  phone?: string
  address?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const SupplierSchema = new Schema<ISupplier>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Nome do fornecedor é obrigatório'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['geral', 'vestuario'],
      default: 'geral',
    },
    cnpj: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Email inválido'],
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

SupplierSchema.index({ userId: 1, name: 1 })

const Supplier: Model<ISupplier> = mongoose.models.Supplier || mongoose.model<ISupplier>('Supplier', SupplierSchema)

export default Supplier


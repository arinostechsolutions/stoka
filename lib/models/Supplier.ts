import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export type SupplierCategory = 'geral' | 'vestuario' | 'joia' | 'sapato'

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
      enum: {
        values: ['geral', 'vestuario', 'joia', 'sapato'],
        message: 'Categoria inválida. Use: geral, vestuario, joia ou sapato',
      },
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

// Força a recriação do modelo para atualizar o enum
// Remove do cache se existir para garantir que o novo enum seja usado
if (mongoose.models.Supplier) {
  const connection = mongoose.connection
  if (connection.models.Supplier) {
    delete (connection.models as any).Supplier
  }
  delete mongoose.models.Supplier
}

const Supplier: Model<ISupplier> = mongoose.model<ISupplier>('Supplier', SupplierSchema)

export default Supplier


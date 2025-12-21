import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface IPublicStore extends Document {
  userId: Types.ObjectId
  slug: string // Slug único para a URL pública (ex: minha-loja)
  title: string // Título da página
  description?: string // Descrição opcional
  whatsappMessage: string // Mensagem personalizada para WhatsApp
  phone: string // Número do WhatsApp (formato: 5511999999999)
  selectedProducts: Types.ObjectId[] // Array de IDs dos produtos selecionados
  isActive: boolean // Se a página está ativa/publicada
  backgroundColor?: string // Cor de fundo da página (hex)
  logoUrl?: string // URL do logotipo
  createdAt: Date
  updatedAt: Date
}

const PublicStoreSchema = new Schema<IPublicStore>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug é obrigatório'],
      trim: true,
      lowercase: true,
      unique: true,
      match: [/^[a-z0-9-]+$/, 'Slug inválido. Use apenas letras minúsculas, números e hífens'],
    },
    title: {
      type: String,
      required: [true, 'Título é obrigatório'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    whatsappMessage: {
      type: String,
      required: [true, 'Mensagem do WhatsApp é obrigatória'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Número do WhatsApp é obrigatório'],
      trim: true,
      match: [/^\d+$/, 'Número do WhatsApp deve conter apenas dígitos'],
    },
    selectedProducts: [{
      type: Schema.Types.ObjectId,
      ref: 'Product',
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    backgroundColor: {
      type: String,
      trim: true,
    },
    logoUrl: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

PublicStoreSchema.index({ userId: 1 })
PublicStoreSchema.index({ slug: 1 }, { unique: true })
PublicStoreSchema.index({ isActive: 1 })

const PublicStore: Model<IPublicStore> = mongoose.models.PublicStore || mongoose.model<IPublicStore>('PublicStore', PublicStoreSchema)

export default PublicStore



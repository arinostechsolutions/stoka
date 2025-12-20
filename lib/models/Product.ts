import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface IProduct extends Document {
  userId: Types.ObjectId
  name: string
  sku?: string
  category?: string
  supplierId?: Types.ObjectId
  quantity: number
  minQuantity: number
  purchasePrice?: number // Preço de compra (custo)
  salePrice?: number // Preço de venda
  // Campos específicos para vestuário
  size?: string // Tamanho (P, M, G, GG, etc)
  color?: string // Cor
  brand?: string // Marca
  material?: string // Material (algodão, poliéster, etc)
  imageUrl?: string // URL da imagem do produto no Cloudinary
  createdAt: Date
  updatedAt: Date
}

const ProductSchema = new Schema<IProduct>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Nome do produto é obrigatório'],
      trim: true,
    },
    sku: {
      type: String,
      trim: true,
      sparse: true,
    },
    category: {
      type: String,
      trim: true,
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Quantidade não pode ser negativa'],
    },
    minQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Estoque mínimo não pode ser negativo'],
    },
    purchasePrice: {
      type: Number,
      min: [0, 'Preço de compra não pode ser negativo'],
    },
    salePrice: {
      type: Number,
      min: [0, 'Preço de venda não pode ser negativo'],
    },
    // Campos específicos para vestuário
    size: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    material: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

ProductSchema.index({ userId: 1, name: 1 })
ProductSchema.index({ userId: 1, sku: 1 }, { sparse: true })
ProductSchema.index({ userId: 1, category: 1 })

const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema)

export default Product


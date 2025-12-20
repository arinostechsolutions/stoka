import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface IProduct extends Document {
  userId: Types.ObjectId
  name: string
  nome_vitrine?: string // Nome do produto para exibição na vitrine
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
  pre_venda?: boolean // Se o produto está em pré-venda (true) ou pronta entrega (false)
  genero?: 'masculino' | 'feminino' | 'unissex' // Gênero do produto
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
    nome_vitrine: {
      type: String,
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
    pre_venda: {
      type: Boolean,
      default: false,
    },
    genero: {
      type: String,
      enum: ['masculino', 'feminino', 'unissex'],
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


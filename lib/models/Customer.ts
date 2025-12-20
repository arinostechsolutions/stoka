import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface IChild extends Document {
  name: string
  age?: number
  size?: string
  gender?: 'masculino' | 'feminino'
}

const ChildSchema = new Schema<IChild>({
  name: {
    type: String,
    required: [true, 'Nome da criança é obrigatório'],
    trim: true,
  },
  age: {
    type: Number,
    min: [0, 'Idade não pode ser negativa'],
  },
  size: {
    type: String,
    trim: true,
  },
  gender: {
    type: String,
    enum: ['masculino', 'feminino'],
  },
})

export interface ICustomer extends Document {
  userId: Types.ObjectId
  name: string
  phone?: string
  address?: string
  instagram?: string
  children: IChild[]
  createdAt: Date
  updatedAt: Date
}

const CustomerSchema = new Schema<ICustomer>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Nome do cliente é obrigatório'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    instagram: {
      type: String,
      trim: true,
    },
    children: {
      type: [ChildSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
)

CustomerSchema.index({ userId: 1, name: 1 })

const Customer: Model<ICustomer> = mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema)

export default Customer


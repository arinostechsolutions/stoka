import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IUser extends Document {
  name: string
  email: string
  password: string
  cnpj?: string
  companyName?: string // Razão Social
  tradeName?: string // Nome Fantasia
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Nome é obrigatório'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email é obrigatório'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email inválido'],
    },
    password: {
      type: String,
      required: [true, 'Senha é obrigatória'],
      minlength: [6, 'Senha deve ter no mínimo 6 caracteres'],
    },
    cnpj: {
      type: String,
      trim: true,
    },
    companyName: {
      type: String,
      trim: true,
    },
    tradeName: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

UserSchema.index({ email: 1 }, { unique: true })

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)

export default User


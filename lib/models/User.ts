import mongoose, { Schema, Document, Model } from 'mongoose'

export type SubscriptionStatus = 
  | 'trialing'      // Em período de teste
  | 'active'        // Assinatura ativa
  | 'canceled'      // Cancelada
  | 'incomplete'    // Pagamento pendente
  | 'incomplete_expired' // Pagamento expirou
  | 'past_due'      // Pagamento atrasado
  | 'unpaid'        // Não pago
  | 'paused'        // Pausada

export type PlanType = 'starter' | 'premium' | null

export interface IUser extends Document {
  name: string
  email: string
  password: string
  cnpj?: string
  companyName?: string // Razão Social
  tradeName?: string // Nome Fantasia
  phone?: string // Telefone/WhatsApp
  // Campos do Stripe
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  stripePriceId?: string
  stripeCurrentPeriodEnd?: Date
  subscriptionStatus?: SubscriptionStatus
  plan?: PlanType
  trialEndsAt?: Date
  tutorialCompleted?: boolean
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
    phone: {
      type: String,
      trim: true,
    },
    // Campos do Stripe
    stripeCustomerId: {
      type: String,
      trim: true,
    },
    stripeSubscriptionId: {
      type: String,
      trim: true,
    },
    stripePriceId: {
      type: String,
      trim: true,
    },
    stripeCurrentPeriodEnd: {
      type: Date,
    },
    subscriptionStatus: {
      type: String,
      enum: ['trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid', 'paused'],
    },
    plan: {
      type: String,
      enum: ['starter', 'premium', null],
      default: null,
    },
    trialEndsAt: {
      type: Date,
    },
    tutorialCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

UserSchema.index({ email: 1 }, { unique: true })

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)

export default User


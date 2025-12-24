import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface IPaymentInstallment extends Document {
  userId: Types.ObjectId
  movementId: Types.ObjectId // Movimento de venda associado
  saleGroupId?: Types.ObjectId // Grupo de venda (para vendas com múltiplos produtos)
  customerId: Types.ObjectId
  installmentNumber: number // Número da parcela (1, 2, 3, etc.)
  totalInstallments: number // Total de parcelas
  amount: number // Valor da parcela
  dueDate: Date // Data limite de pagamento
  paidAmount?: number // Valor pago (pode ser parcial)
  paidDate?: Date // Data do pagamento
  isPaid: boolean // Se a parcela foi totalmente paga
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const PaymentInstallmentSchema = new Schema<IPaymentInstallment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    movementId: {
      type: Schema.Types.ObjectId,
      ref: 'Movement',
      required: true,
      index: true,
    },
    saleGroupId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    installmentNumber: {
      type: Number,
      required: true,
      min: [0, 'Número da parcela deve ser pelo menos 0 (0 = entrada)'],
    },
    totalInstallments: {
      type: Number,
      required: true,
      min: [1, 'Total de parcelas deve ser pelo menos 1'],
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Valor da parcela não pode ser negativo'],
    },
    dueDate: {
      type: Date,
      required: true,
    },
    paidAmount: {
      type: Number,
      min: [0, 'Valor pago não pode ser negativo'],
      default: 0,
    },
    paidDate: {
      type: Date,
    },
    isPaid: {
      type: Boolean,
      default: false,
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

PaymentInstallmentSchema.index({ userId: 1, customerId: 1, isPaid: 1 })
PaymentInstallmentSchema.index({ userId: 1, dueDate: 1 })
PaymentInstallmentSchema.index({ saleGroupId: 1 })

const PaymentInstallment: Model<IPaymentInstallment> = 
  mongoose.models.PaymentInstallment || 
  mongoose.model<IPaymentInstallment>('PaymentInstallment', PaymentInstallmentSchema)

export default PaymentInstallment


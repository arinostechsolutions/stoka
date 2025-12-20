import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface ICampaign extends Document {
  userId: Types.ObjectId
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

const CampaignSchema = new Schema<ICampaign>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Nome da campanha é obrigatório'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

CampaignSchema.index({ userId: 1, name: 1 })

const Campaign: Model<ICampaign> = mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', CampaignSchema)

export default Campaign


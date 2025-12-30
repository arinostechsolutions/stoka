import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface IStoreAnalytics extends Document {
  storeId: Types.ObjectId
  sessionId: string
  deviceType: 'mobile' | 'desktop' | 'tablet'
  userAgent: string
  ipAddress?: string
  startTime: Date
  endTime?: Date
  timeOnPage?: number // em segundos
  pageViews: number
  productsViewed: string[] // IDs dos produtos visualizados
  productsSelected: string[] // IDs dos produtos selecionados
  whatsappClicks: number
  filtersUsed: {
    size?: string
    genero?: string
  }
  imagesExpanded: string[] // IDs dos produtos com imagem expandida
  referrer?: string
  createdAt: Date
  updatedAt: Date
}

const StoreAnalyticsSchema = new Schema<IStoreAnalytics>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'PublicStore',
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    deviceType: {
      type: String,
      enum: ['mobile', 'desktop', 'tablet'],
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    timeOnPage: {
      type: Number,
      min: 0,
    },
    pageViews: {
      type: Number,
      default: 1,
      min: 1,
    },
    productsViewed: [{
      type: String,
    }],
    productsSelected: [{
      type: String,
    }],
    whatsappClicks: {
      type: Number,
      default: 0,
      min: 0,
    },
    filtersUsed: {
      size: {
        type: String,
        trim: true,
      },
      genero: {
        type: String,
        trim: true,
      },
    },
    imagesExpanded: [{
      type: String,
    }],
    referrer: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

StoreAnalyticsSchema.index({ storeId: 1, createdAt: -1 })
StoreAnalyticsSchema.index({ sessionId: 1 })
StoreAnalyticsSchema.index({ createdAt: -1 })

const StoreAnalytics: Model<IStoreAnalytics> = mongoose.models.StoreAnalytics || mongoose.model<IStoreAnalytics>('StoreAnalytics', StoreAnalyticsSchema)

export default StoreAnalytics


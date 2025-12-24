import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env')
}

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  var mongoose: MongooseCache | undefined
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null }

if (!global.mongoose) {
  global.mongoose = cached
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    // Remove espaços e valida a string de conexão
    const uri = MONGODB_URI.trim()
    
    if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
      throw new Error('MONGODB_URI deve começar com "mongodb://" ou "mongodb+srv://"')
    }

    const opts = {
      bufferCommands: false,
      maxPoolSize: 10, // Mantém até 10 conexões no pool
      serverSelectionTimeoutMS: 30000, // Timeout de 30s para seleção de servidor (aumentado de 5s)
      socketTimeoutMS: 60000, // Timeout de 60s para operações (aumentado de 45s)
      connectTimeoutMS: 30000, // Timeout de 30s para estabelecer conexão
      family: 4, // Usa IPv4, evita delay de IPv6
      retryWrites: true,
      retryReads: true,
    }

    cached.promise = mongoose.connect(uri, opts).then((mongoose) => {
      return mongoose
    }).catch((error) => {
      cached.promise = null
      console.error('Erro ao conectar com MongoDB:', error.message)
      console.error('URI usado:', uri.replace(/:[^:@]+@/, ':****@')) // Não loga a senha
      throw error
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e: any) {
    cached.promise = null
    console.error('Erro na conexão MongoDB:', e.message)
    throw e
  }

  return cached.conn
}

export default connectDB


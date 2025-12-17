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
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10, // Mantém até 10 conexões no pool
      serverSelectionTimeoutMS: 5000, // Timeout de 5s para seleção de servidor
      socketTimeoutMS: 45000, // Timeout de 45s para operações
      family: 4, // Usa IPv4, evita delay de IPv6
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose
    }).catch((error) => {
      cached.promise = null
      console.error('Erro ao conectar com MongoDB:', error.message)
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


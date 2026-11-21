import mongoose from 'mongoose'

export async function connectDatabase() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required')
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 10000) })
  console.info('MongoDB connected')
}

import mongoose from 'mongoose'

let connectionPromise = null

mongoose.connection.on('disconnected', () => { connectionPromise = null })

export async function connectDatabase() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required')
  if (mongoose.connection.readyState === 1) return mongoose.connection
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 10000),
    }).then(() => {
      console.info('MongoDB connected')
      return mongoose.connection
    }).catch(error => {
      connectionPromise = null
      throw error
    })
  }
  return connectionPromise
}

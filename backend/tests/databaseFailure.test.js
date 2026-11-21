import { test } from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import { connectDatabase } from '../src/config/db.js'

test('database connection failure exits through the expected connection error path', async () => {
  const previousUri = process.env.MONGODB_URI
  const previousTimeout = process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS
  process.env.MONGODB_URI = 'mongodb://127.0.0.1:1/agileforge_unreachable'
  process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS = '250'
  try {
    await assert.rejects(connectDatabase(), error => {
      assert.match(error.message, /ECONNREFUSED|Server selection timed out/i)
      return true
    })
  } finally {
    await mongoose.disconnect()
    if (previousUri === undefined) delete process.env.MONGODB_URI
    else process.env.MONGODB_URI = previousUri
    if (previousTimeout === undefined) delete process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS
    else process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS = previousTimeout
  }
})

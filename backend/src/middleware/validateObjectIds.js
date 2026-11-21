import mongoose from 'mongoose'
import AppError from '../utils/AppError.js'
export function validateObjectIds(...params) {
  return (req, res, next) => {
    for (const key of params) if (req.params[key] && !mongoose.isValidObjectId(req.params[key])) return next(new AppError(`Invalid ${key}`, 400))
    next()
  }
}

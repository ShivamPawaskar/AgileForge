import mongoose from 'mongoose'
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^\S+@\S+\.\S+$/ },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  avatarUrl: { type: String, default: '' },
  mustChangePassword: { type: Boolean, default: false },
  authVersion: { type: Number, default: 0, select: false },
}, { timestamps: true })
export default mongoose.model('User', userSchema)

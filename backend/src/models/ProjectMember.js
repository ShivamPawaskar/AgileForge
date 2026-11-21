import mongoose from 'mongoose'
const schema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
  capacityPoints: { type: Number, min: 0, max: 500, default: 20 },
}, { timestamps: true })
schema.index({ projectId: 1, userId: 1 }, { unique: true })
export default mongoose.model('ProjectMember', schema)

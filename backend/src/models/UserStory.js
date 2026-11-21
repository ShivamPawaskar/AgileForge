import mongoose from 'mongoose'
const schema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  storyKey: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  acceptanceCriteria: { type: [String], default: [] },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  storyPoints: { type: Number, min: 0, max: 34, default: 0, validate: { validator: value => [0,1,2,3,5,8,13,21,34].includes(value), message: 'Story points must use a Fibonacci estimate (0, 1, 2, 3, 5, 8, 13, 21, or 34)' } },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, enum: ['backlog', 'ready', 'in_progress', 'done'], default: 'backlog' },
}, { timestamps: true })
schema.index({ projectId: 1, storyKey: 1 }, { unique: true })
export default mongoose.model('UserStory', schema)

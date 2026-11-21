import mongoose from 'mongoose'
const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, default: '', maxlength: 2000 },
  problemStatement: { type: String, trim: true, default: '', maxlength: 4000 },
  technologyStack: { type: [String], default: [] },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teamMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  startDate: { type: Date, default: null },
  deadline: { type: Date, default: null },
  status: { type: String, enum: ['planning', 'active', 'completed'], default: 'planning' },
}, { timestamps: true })
export default mongoose.model('Project', projectSchema)

import mongoose from 'mongoose'
const taskSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  sprintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint', default: null },
  userStoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserStory', default: null },
  dependencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  type: { type: String, enum: ['product', 'design', 'frontend', 'backend', 'devops'], default: 'product' },
  readinessArea: { type: String, enum: ['none', 'core_workflow', 'demo'], default: 'none' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  storyPoints: { type: Number, min: 0, default: 0 },
  status: { type: String, enum: ['todo', 'in_progress', 'in_review', 'done'], default: 'todo' },
  dueDate: { type: Date, default: null },
  statusHistory: [{ previousStatus: { type: String, enum: ['todo', 'in_progress', 'in_review', 'done', null], default: null }, status: { type: String, enum: ['todo', 'in_progress', 'in_review', 'done'] }, changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, changedAt: { type: Date, default: Date.now } }],
}, { timestamps: true })
taskSchema.pre('validate', function () { if (this.isNew && !this.statusHistory.length) this.statusHistory.push({ status: this.status, changedAt: new Date() }) })
export default mongoose.model('Task', taskSchema)

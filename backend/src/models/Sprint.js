import mongoose from 'mongoose'
const sprintSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  name: { type: String, required: true, trim: true },
  sprintGoal: { type: String, trim: true, default: '' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  selectedStories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'UserStory' }],
  status: { type: String, enum: ['planned', 'active', 'completed'], default: 'planned' },
}, { timestamps: true })
sprintSchema.pre('validate', function () {
  if (this.startDate && this.endDate && this.endDate <= this.startDate) this.invalidate('endDate', 'End date must be after start date')
  if (new Set(this.selectedStories.map(id => String(id))).size !== this.selectedStories.length) this.invalidate('selectedStories', 'A user story can only be selected once in a sprint')
})
export default mongoose.model('Sprint', sprintSchema)

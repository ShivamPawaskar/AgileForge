import mongoose from 'mongoose'
const schema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  title: { type: String, required: true, trim: true },
  caseId: { type: String, trim: true, default: '' },
  scenario: { type: String, trim: true, default: '' },
  classification: { type: String, enum: ['positive', 'negative', 'boundary', 'exceptional', ''], default: '' },
  testType: { type: String, enum: ['unit', 'integration', 'e2e', 'manual'], default: 'manual' },
  category: { type: String, enum: ['other', 'core_workflow', 'input_validation', 'demo'], default: 'other' },
  input: { type: String, default: '' },
  expectedResult: { type: String, default: '' },
  actualResult: { type: String, default: '' },
  status: { type: String, enum: ['not_run', 'passed', 'failed', 'blocked'], default: 'not_run' },
}, { timestamps: true })
export default mongoose.model('TestCase', schema)

import mongoose from 'mongoose';

const RefillActionSchema = new mongoose.Schema({
  date: { type: String, required: true },
  action: { type: String, enum: ['PAUSE', 'SKIP', 'RESUME', 'EARLY_REQUEST', 'EARLY_APPROVED', 'EARLY_DENIED'], required: true },
  reason: { type: String },
  performedBy: { type: String },
});

const RefillHistorySchema = new mongoose.Schema({
  date: { type: String, required: true },
  quantity: { type: Number, required: true },
  status: { type: String, enum: ['ON-TIME', 'DELAYED', 'EMERGENCY', 'EARLY'], required: true },
  notes: { type: String },
});

const EarlyRefillRequestSchema = new mongoose.Schema({
  requestedAt: { type: String, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'DENIED'], default: 'PENDING' },
  pharmacistFeedback: { type: String },
});

const RecurringOrderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  customerId: { type: String, required: true },
  items: [{ medicineId: { type: String }, name: { type: String }, quantity: { type: Number } }],
  deliveryDate: { type: String, required: true },
  repeatIntervalDays: { type: Number, required: true },
  nextReorderDate: { type: String, required: true },
  status: { type: String, enum: ['ACTIVE', 'PAUSED', 'COMPLETED'], default: 'ACTIVE' },
  history: [RefillHistorySchema],
  actionLog: [RefillActionSchema],
  earlyRefillRequest: EarlyRefillRequestSchema,
}, { timestamps: true, id: false });

export default mongoose.model('RecurringOrder', RecurringOrderSchema);

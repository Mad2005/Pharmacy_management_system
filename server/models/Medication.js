import mongoose from 'mongoose';

const MedicationScheduleSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  customerId: { type: String, required: true },
  medicineName: { type: String, required: true },
  dosage: { type: String, required: true },
  timing: [String],
  instruction: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true, id: false });

export const MedicationSchedule = mongoose.model('MedicationSchedule', MedicationScheduleSchema);

const MedicationLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  scheduleId: { type: String, required: true },
  date: { type: String, required: true },
  slot: { type: String, required: true },
  status: { type: String, enum: ['TAKEN', 'MISSED', 'DELAYED', 'PENDING'], default: 'PENDING' },
}, { timestamps: true, id: false });

export const MedicationLog = mongoose.model('MedicationLog', MedicationLogSchema);

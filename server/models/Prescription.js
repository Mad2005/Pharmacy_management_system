import mongoose from 'mongoose';

const AlternativeSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  suggestedMedId: { type: String, required: true },
  suggestedName: { type: String, required: true },
  notes: { type: String },
  status: { type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED'], default: 'PENDING' },
});

const PrescriptionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  customerId: { type: String, required: true },
  doctorName: { type: String, required: true },
  medicines: { type: String, required: true },
  approvedMedicines: [String],
  alternatives: [AlternativeSchema],
  fileUrl: { type: String, required: true },
  fileHash: { type: String },
  status: { type: String, enum: ['PENDING', 'PROCESSED', 'DENIED'], default: 'PENDING' },
  feedback: { type: String },
  uploadedAt: { type: String, required: true },
  approvedAt: { type: String },
  expiryDate: { type: String },
  medicineUsage: { type: Map, of: Number, default: {} },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true, id: false });

export default mongoose.model('Prescription', PrescriptionSchema);

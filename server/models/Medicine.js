import mongoose from 'mongoose';

const MedicineSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  brand: { type: String, required: true },
  saltComposition: { type: String, required: true },
  strength: { type: String, required: true },
  classification: { type: String, required: true },
  prescriptionRequired: { type: Boolean, default: false },
  expiry: { type: String, required: true },
  mrp: { type: Number, required: true },
  price: { type: Number, required: true },
  gst: { type: Number, required: true },
  supplierId: { type: String, required: true },
  stock: { type: Number, required: true },
  criticalStockLimit: { type: Number, required: true },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
}, { timestamps: true, id: false });

export default mongoose.model('Medicine', MedicineSchema);

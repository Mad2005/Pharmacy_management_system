import mongoose from 'mongoose';

const SupplierSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  contactPerson: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Supplier', SupplierSchema);

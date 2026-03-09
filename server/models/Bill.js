import mongoose from 'mongoose';

const BillItemSchema = new mongoose.Schema({
  medicineId: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  gst: { type: Number, required: true },
  total: { type: Number, required: true },
  requiresPrescription: { type: Boolean },
  expiryDate: { type: String },
});

const BillSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  customerId: { type: String, required: true },
  customerName: { type: String, required: true },
  date: { type: String, required: true },
  items: [BillItemSchema],
  subTotal: { type: Number, required: true },
  tax: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  paymentMode: { type: String, enum: ['CASH', 'CARD', 'UPI'], required: true },
  processedBy: { type: String, required: true },
  prescriptionId: { type: String },
  status: { type: String, enum: ['PAID', 'PENDING'], default: 'PAID' },
}, { timestamps: true, id: false });

export default mongoose.model('Bill', BillSchema);

import mongoose from 'mongoose';

const PurchaseItemSchema = new mongoose.Schema({
  medicineId: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  purchasePrice: { type: Number, required: true },
  tax: { type: Number, required: true },
  total: { type: Number, required: true },
});

const PurchaseSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  supplierId: { type: String, required: true },
  supplierName: { type: String, required: true },
  date: { type: String, required: true },
  items: [PurchaseItemSchema],
  totalAmount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['PAID', 'PENDING', 'PARTIAL'], default: 'PAID' },
  invoiceNumber: { type: String, required: true },
}, { timestamps: true, id: false });

export const Purchase = mongoose.model('Purchase', PurchaseSchema);

const AuditLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userRole: { type: String, required: true },
  action: { type: String, required: true },
  details: { type: String, required: true },
  timestamp: { type: String, required: true },
  ipAddress: { type: String },
}, { timestamps: true, id: false });

export const AuditLog = mongoose.model('AuditLog', AuditLogSchema);

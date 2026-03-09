import mongoose from 'mongoose';
import { UserRole } from '../constants.js';

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String },
  email: { type: String, required: true },
  role: { type: String, enum: Object.values(UserRole), required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  joiningDate: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  loyaltyPoints: { type: Number, default: 0 },
  healthPoints: { type: Number, default: 100 },
  notificationPreferences: {
    stockAlerts: { type: Boolean, default: true },
    refillReminders: { type: Boolean, default: true },
    prescriptionStatus: { type: Boolean, default: true },
  },
}, { timestamps: true });

export default mongoose.model('User', UserSchema);

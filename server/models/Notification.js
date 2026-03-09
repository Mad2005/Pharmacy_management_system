import mongoose from 'mongoose';
import { UserRole } from '../constants.js';

const NotificationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, required: true },
  targetRoles: [{ type: String, enum: Object.values(UserRole) }],
  isRead: { type: Boolean, default: false },
  createdAt: { type: String, required: true },
  relatedId: { type: String },
  customerId: { type: String },
}, { timestamps: true, id: false });

export default mongoose.model('Notification', NotificationSchema);

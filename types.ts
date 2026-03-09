
export enum UserRole {
  ADMIN = 'ADMIN',
  PHARMACIST = 'PHARMACIST',
  STAFF = 'STAFF',
  CUSTOMER = 'CUSTOMER'
}

export interface User {
  id: string;
  fullName: string;
  username: string;
  password?: string;
  email: string;
  role: UserRole;
  phone: string;
  address: string;
  joiningDate: string;
  isActive: boolean;
  loyaltyPoints?: number;
  healthPoints?: number;
  notificationPreferences?: {
    stockAlerts: boolean;
    refillReminders: boolean;
    prescriptionStatus: boolean;
  };
}

export interface Medicine {
  id: string;
  name: string;
  brand: string;
  saltComposition: string;
  strength: string; 
  classification: string; 
  prescriptionRequired: boolean;
  expiry: string;
  mrp: number;
  price: number; 
  gst: number;
  supplierId: string;
  stock: number;
  criticalStockLimit: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Supplier {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  isActive: boolean;
}

export interface BillItem {
  medicineId: string;
  name: string;
  quantity: number;
  price: number;
  gst: number;
  total: number;
  requiresPrescription?: boolean;
  expiryDate?: string;
}

export interface Bill {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  items: BillItem[];
  subTotal: number;
  tax: number;
  discount: number;
  grandTotal: number;
  paymentMode: 'CASH' | 'CARD' | 'UPI';
  processedBy: string;
  prescriptionId?: string;
  status?: 'PAID' | 'PENDING';
}

export interface RefillAction {
  date: string;
  action: 'PAUSE' | 'SKIP' | 'RESUME' | 'EARLY_REQUEST' | 'EARLY_APPROVED' | 'EARLY_DENIED';
  reason: string;
  performedBy: string;
}

export interface RefillHistory {
  date: string;
  quantity: number;
  status: 'ON-TIME' | 'DELAYED' | 'EMERGENCY' | 'EARLY';
  notes?: string;
}

export interface EarlyRefillRequest {
  requestedAt: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  pharmacistFeedback?: string;
}

export interface RecurringOrder {
  id: string;
  customerId: string;
  items: { medicineId: string; name: string; quantity: number }[];
  deliveryDate: string;
  repeatIntervalDays: number;
  nextReorderDate: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  history: RefillHistory[];
  actionLog: RefillAction[]; // Logs pauses, skips, and requests
  earlyRefillRequest?: EarlyRefillRequest;
}

export interface Prescription {
  id: string;
  customerId: string;
  doctorName: string;
  medicines: string; 
  approvedMedicines?: string[]; 
  alternatives?: PrescriptionAlternative[];
  fileUrl: string;
  fileHash?: string; 
  status: 'PENDING' | 'PROCESSED' | 'DENIED';
  feedback?: string;
  uploadedAt: string;
  approvedAt?: string;
  expiryDate?: string;
  medicineUsage: Record<string, number>;
  isDeleted?: boolean;
}

export interface PrescriptionAlternative {
  originalName: string;
  suggestedMedId: string;
  suggestedName: string;
  notes: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'LOW_STOCK' | 'EXPIRY' | 'LARGE_BILL' | 'PROMO' | 'REFILL' | 'MED_REMINDER' | 'PRESCRIPTION_STATUS' | 'REFILL_REQUEST';
  targetRoles: UserRole[];
  isRead: boolean;
  createdAt: string;
  relatedId?: string;
  customerId?: string;
}

export type DosageTiming = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';

export interface MedicationSchedule {
  id: string;
  customerId: string;
  medicineName: string;
  dosage: string;
  timing: DosageTiming[];
  instruction: string;
  isActive: boolean;
}

export interface MedicationLog {
  id: string;
  scheduleId: string;
  date: string; 
  slot: DosageTiming;
  status: 'TAKEN' | 'MISSED' | 'DELAYED' | 'PENDING';
}

export interface PurchaseItem {
  medicineId: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  tax: number;
  total: number;
}

export interface Purchase {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: PurchaseItem[];
  totalAmount: number;
  paymentStatus: 'PAID' | 'PENDING' | 'PARTIAL';
  invoiceNumber: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}

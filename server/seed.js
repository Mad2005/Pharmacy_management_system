import User from './models/User.js';
import Medicine from './models/Medicine.js';
import Supplier from './models/Supplier.js';
import { Purchase, AuditLog } from './models/AuditLog.js';
import { UserRole } from './constants.js';

export const seedData = async () => {
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    await User.insertMany([
      { fullName: 'System Administrator', username: 'admin', password: 'password', email: 'admin@pharma.com', role: UserRole.ADMIN, phone: '9876543210', address: 'Main Pharmacy HQ', joiningDate: '2023-01-01', isActive: true, loyaltyPoints: 0, healthPoints: 100 },
      { fullName: 'Dr. Sarah Smith', username: 'pharm', password: 'password', email: 'sarah@pharma.com', role: UserRole.PHARMACIST, phone: '9876543211', address: 'Clinical Wing A', joiningDate: '2023-02-15', isActive: true, loyaltyPoints: 0, healthPoints: 100 },
      { fullName: 'John Sales Staff', username: 'staff', password: 'password', email: 'john@pharma.com', role: UserRole.STAFF, phone: '9876543212', address: 'Retail Counter 1', joiningDate: '2023-03-10', isActive: true, loyaltyPoints: 0, healthPoints: 100 },
      { fullName: 'Alice Johnson', username: 'cust', password: 'password', email: 'alice@gmail.com', role: UserRole.CUSTOMER, phone: '9876543213', address: '123 Baker Street, New York', joiningDate: '2023-05-20', isActive: true, loyaltyPoints: 450, healthPoints: 98 },
    ]);
    console.log('Users seeded');
  }

  const medCount = await Medicine.countDocuments();
  if (medCount === 0) {
    await Medicine.insertMany([
      { id: 'MED1001', name: 'Panadol Advance', brand: 'GSK', saltComposition: 'Paracetamol', strength: '500mg', classification: 'Tablet - Analgesics', prescriptionRequired: false, expiry: '2026-12-31', mrp: 12.0, price: 10.5, gst: 12, supplierId: 'S1', stock: 450, criticalStockLimit: 50, status: 'ACTIVE' },
      { id: 'MED1002', name: 'Amoxicillin', brand: 'Cipla', saltComposition: 'Amoxicillin', strength: '250mg', classification: 'Capsule - Antibiotics', prescriptionRequired: true, expiry: '2025-10-15', mrp: 45.0, price: 38.0, gst: 12, supplierId: 'S2', stock: 200, criticalStockLimit: 20, status: 'ACTIVE' },
      { id: 'MED1003', name: 'Atorvastatin', brand: 'Pfizer', saltComposition: 'Atorvastatin', strength: '20mg', classification: 'Tablet - Cardiovascular', prescriptionRequired: true, expiry: '2024-01-01', mrp: 85.0, price: 72.0, gst: 12, supplierId: 'S1', stock: 100, criticalStockLimit: 15, status: 'ACTIVE' },
      { id: 'MED1004', name: 'Metformin', brand: 'Abbott', saltComposition: 'Metformin Hydrochloride', strength: '500mg', classification: 'Tablet - Antidiabetic', prescriptionRequired: true, expiry: '2026-05-20', mrp: 15.0, price: 13.5, gst: 12, supplierId: 'S3', stock: 800, criticalStockLimit: 100, status: 'ACTIVE' },
      { id: 'MED1005', name: 'Ibuprofen', brand: 'Bayer', saltComposition: 'Ibuprofen', strength: '400mg', classification: 'Tablet - Analgesics', prescriptionRequired: false, expiry: '2025-08-12', mrp: 22.0, price: 18.0, gst: 12, supplierId: 'S1', stock: 150, criticalStockLimit: 30, status: 'ACTIVE' },
    ]);
    console.log('Medicines seeded');
  }

  const supplierCount = await Supplier.countDocuments();
  if (supplierCount === 0) {
    await Supplier.insertMany([
      { companyName: 'Global Pharma Distribution', contactPerson: 'Michael Scott', phone: '9887766550', email: 'michael@globalpharma.com', isActive: true },
      { companyName: 'Cipla Healthcare Direct', contactPerson: 'Pam Beesly', phone: '9887766551', email: 'pam@cipla.com', isActive: true },
      { companyName: 'Abbott Logistics', contactPerson: 'Jim Halpert', phone: '9887766552', email: 'jim@abbott.com', isActive: true },
    ]);
    console.log('Suppliers seeded');
  }

  const purchaseCount = await Purchase.countDocuments();
  if (purchaseCount === 0) {
    await Purchase.insertMany([
      { supplierId: 'S1', supplierName: 'Global Pharma Distribution', date: '2024-02-20T10:00:00Z', items: [{ medicineId: 'MED1001', name: 'Panadol Advance', quantity: 100, purchasePrice: 8.0, tax: 0.96, total: 896 }], totalAmount: 896, paymentStatus: 'PAID', invoiceNumber: 'INV-GP-001' },
      { supplierId: 'S2', supplierName: 'Cipla Healthcare Direct', date: '2024-02-22T14:30:00Z', items: [{ medicineId: 'MED1002', name: 'Amoxicillin', quantity: 50, purchasePrice: 30.0, tax: 3.6, total: 1680 }], totalAmount: 1680, paymentStatus: 'PAID', invoiceNumber: 'INV-CH-002' },
    ]);
    console.log('Purchases seeded');
  }

  const auditCount = await AuditLog.countDocuments();
  if (auditCount === 0) {
    await AuditLog.insertMany([
      { userId: '1', userName: 'Admin', userRole: UserRole.ADMIN, action: 'LOGIN', details: 'Admin logged in from 192.168.1.1', timestamp: '2024-02-26T08:00:00Z' },
      { userId: '2', userName: 'Sarah', userRole: UserRole.PHARMACIST, action: 'PRESCRIPTION_APPROVED', details: 'Approved prescription P101', timestamp: '2024-02-26T09:15:00Z' },
    ]);
    console.log('Audit logs seeded');
  }
};

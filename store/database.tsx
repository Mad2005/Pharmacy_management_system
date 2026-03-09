import React, { createContext, useContext, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { User, Medicine, Supplier, Bill, Prescription, Notification, UserRole, RecurringOrder, MedicationSchedule, MedicationLog, PrescriptionAlternative, EarlyRefillRequest, RefillAction, RefillHistory, Purchase, AuditLog } from '../types';

const API_URL = '/api';
const PRESCRIPTION_VALIDITY_DAYS = 15;

interface DatabaseContextType {
  users: User[];
  medicines: Medicine[];
  suppliers: Supplier[];
  bills: Bill[];
  prescriptions: Prescription[];
  notifications: Notification[];
  recurringOrders: RecurringOrder[];
  medicationSchedules: MedicationSchedule[];
  medicationLogs: MedicationLog[];
  purchases: Purchase[];
  auditLogs: AuditLog[];
  addUser: (user: User) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  addMedicine: (med: Medicine) => void;
  updateMedicine: (id: string, updates: Partial<Medicine>) => void;
  deleteMedicine: (id: string) => void;
  addSupplier: (supplier: Supplier) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  createBill: (bill: Bill, recurringRefillId?: string, prescriptionId?: string) => void;
  deleteBill: (id: string) => void;
  uploadPrescription: (p: Prescription) => Promise<'SUCCESS' | 'DUPLICATE' | 'LIMIT_EXCEEDED'>;
  updatePrescription: (id: string, updates: Partial<Prescription>) => void;
  deletePrescription: (id: string) => void;
  approvePrescriptionWithAlternatives: (id: string, meds: string[], alternatives: PrescriptionAlternative[], feedback: string) => void;
  respondToAlternative: (prescriptionId: string, suggestedName: string, status: 'ACCEPTED' | 'REJECTED') => void;
  addNotification: (n: Notification) => void;
  markNotificationRead: (id: string) => void;
  addRecurringOrder: (ro: RecurringOrder) => void;
  updateRecurringOrder: (id: string, updates: Partial<RecurringOrder>) => void;
  skipOneCycle: (id: string, reason: string, performedBy: string) => void;
  requestEarlyRefill: (id: string, reason: string, performedBy: string) => void;
  respondToEarlyRefill: (id: string, status: 'APPROVED' | 'DENIED', feedback?: string) => void;
  restockMedicine: (id: string, qty: number, newExpiry: string) => void;
  addSchedule: (s: MedicationSchedule) => void;
  deleteSchedule: (id: string) => void;
  logMedicationStatus: (log: Omit<MedicationLog, 'id'>) => void;
  addPurchase: (purchase: Purchase) => void;
  addAuditLog: (log: Omit<AuditLog, 'id'>) => void;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [recurringOrders, setRecurringOrders] = useState<RecurringOrder[]>([]);
  const [medicationSchedules, setMedicationSchedules] = useState<MedicationSchedule[]>([]);
  const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(window.location.origin);
    setSocket(newSocket);

    newSocket.on('notification', (notif: Notification) => {
      setNotifications(prev => [notif, ...prev]);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const fetchData = async () => {
    try {
      const fetchJson = async (url: string) => {
        const res = await fetch(url);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP error! status: ${res.status}, body: ${text.substring(0, 100)}`);
        }
        const data = await res.json();
        // Normalize MongoDB _id to id
        if (Array.isArray(data)) {
          return data.map(item => ({ ...item, id: item.id || item._id }));
        }
        return data.id || data._id ? { ...data, id: data.id || data._id } : data;
      };

      const [u, m, s, b, p, n, ro, ms, ml, pur, al] = await Promise.all([
        fetchJson(`${API_URL}/users`),
        fetchJson(`${API_URL}/medicines`),
        fetchJson(`${API_URL}/suppliers`),
        fetchJson(`${API_URL}/bills`),
        fetchJson(`${API_URL}/prescriptions`),
        fetchJson(`${API_URL}/notifications`),
        fetchJson(`${API_URL}/recurring-orders`),
        fetchJson(`${API_URL}/medication-schedules`),
        fetchJson(`${API_URL}/medication-logs`),
        fetchJson(`${API_URL}/purchases`),
        fetchJson(`${API_URL}/audit-logs`),
      ]);
      setUsers(u);
      setMedicines(m);
      setSuppliers(s);
      setBills(b);
      setPrescriptions(p);
      setNotifications(n);
      setRecurringOrders(ro);
      setMedicationSchedules(ms);
      setMedicationLogs(ml);
      setPurchases(pur);
      setAuditLogs(al);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addUser = async (user: User) => {
    const res = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    const newUser = await res.json();
    const normalized = { ...newUser, id: newUser.id || newUser._id };
    setUsers(prev => [...prev, normalized]);
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    const res = await fetch(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const updatedUser = await res.json();
    const normalized = { ...updatedUser, id: updatedUser.id || updatedUser._id };
    setUsers(prev => prev.map(u => u.id === id || (u as any)._id === id ? normalized : u));
  };

  const deleteUser = async (id: string) => {
    await fetch(`${API_URL}/users/${id}`, { method: 'DELETE' });
    setUsers(prev => prev.filter(u => u.id !== id && (u as any)._id !== id));
  };

  const addMedicine = async (m: Medicine) => {
    const res = await fetch(`${API_URL}/medicines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(m)
    });
    const newMed = await res.json();
    const normalized = { ...newMed, id: newMed.id || newMed._id };
    setMedicines(prev => [...prev, normalized]);
  };

  const updateMedicine = async (id: string, updates: Partial<Medicine>) => {
    const res = await fetch(`${API_URL}/medicines/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const updatedMed = await res.json();
    const normalized = { ...updatedMed, id: updatedMed.id || updatedMed._id };
    setMedicines(prev => prev.map(m => m.id === id || (m as any)._id === id ? normalized : m));
  };

  const deleteMedicine = async (id: string) => {
    await fetch(`${API_URL}/medicines/${id}`, { method: 'DELETE' });
    setMedicines(prev => prev.filter(m => m.id !== id && (m as any)._id !== id));
  };

  const addSupplier = async (s: Supplier) => {
    const res = await fetch(`${API_URL}/suppliers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(s)
    });
    const newSupplier = await res.json();
    setSuppliers(prev => [...prev, newSupplier]);
  };

  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    const res = await fetch(`${API_URL}/suppliers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const updatedSupplier = await res.json();
    setSuppliers(prev => prev.map(s => s.id === id || (s as any)._id === id ? updatedSupplier : s));
  };

  const deleteSupplier = async (id: string) => {
    await fetch(`${API_URL}/suppliers/${id}`, { method: 'DELETE' });
    setSuppliers(prev => prev.filter(s => s.id !== id && (s as any)._id !== id));
  };

  const createBill = async (bill: Bill, recurringRefillId?: string, prescriptionId?: string) => {
    // Client-side validation
    bill.items.forEach(item => {
      const med = medicines.find(m => m.id === item.medicineId || (m as any)._id === item.medicineId);
      if (med && new Date(med.expiry) < new Date()) {
        throw new Error(`CRITICAL: Formulation ${med.name} is EXPIRED. Regulatory lock active.`);
      }
    });

    const res = await fetch(`${API_URL}/bills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...bill, recurringRefillId, prescriptionId })
    });
    const newBill = await res.json();
    const normalized = { ...newBill, id: newBill.id || newBill._id };
    setBills(prev => [normalized, ...prev]);
    
    // Refresh medicines to get updated stock
    const mRes = await fetch(`${API_URL}/medicines`);
    const mData = await mRes.json();
    setMedicines(mData.map((m: any) => ({ ...m, id: m.id || m._id })));

    if (prescriptionId) {
      const pRes = await fetch(`${API_URL}/prescriptions`);
      const pData = await pRes.json();
      setPrescriptions(pData.map((p: any) => ({ ...p, id: p.id || p._id })));
    }

    if (recurringRefillId) {
      const roRes = await fetch(`${API_URL}/recurring-orders`);
      const roData = await roRes.json();
      setRecurringOrders(roData.map((ro: any) => ({ ...ro, id: ro.id || ro._id })));
    }
  };

  const deleteBill = async (id: string) => {
    await fetch(`${API_URL}/bills/${id}`, { method: 'DELETE' });
    setBills(prev => prev.filter(b => b.id !== id && (b as any)._id !== id));
  };

  const uploadPrescription = async (p: Prescription): Promise<'SUCCESS' | 'DUPLICATE' | 'LIMIT_EXCEEDED'> => {
    const res = await fetch(`${API_URL}/prescriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p)
    });
    const newP = await res.json();
    setPrescriptions(prev => [newP, ...prev]);
    // TODO: derive actual status from response if backend provides it
    return 'SUCCESS';
  };

  const updatePrescription = async (id: string, updates: Partial<Prescription>) => {
    const res = await fetch(`${API_URL}/prescriptions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const updatedP = await res.json();
    setPrescriptions(prev => prev.map(p => p.id === id || (p as any)._id === id ? updatedP : p));
  };

  const deletePrescription = async (id: string) => {
    await fetch(`${API_URL}/prescriptions/${id}`, { method: 'DELETE' });
    setPrescriptions(prev => prev.filter(p => p.id !== id && (p as any)._id !== id));
  };

  const approvePrescriptionWithAlternatives = async (id: string, meds: string[], alternatives: PrescriptionAlternative[], feedback: string) => {
    const approvedAt = new Date().toISOString();
    const exp = new Date(); exp.setDate(exp.getDate() + PRESCRIPTION_VALIDITY_DAYS);
    const usage: Record<string, number> = {};
    meds.forEach(m => usage[m] = 0);
    alternatives.forEach(a => usage[a.suggestedName] = 0);

    const updates: Partial<Prescription> = {
      status: 'PROCESSED',
      approvedMedicines: meds,
      alternatives,
      feedback,
      approvedAt,
      expiryDate: exp.toISOString(),
      medicineUsage: usage
    };

    await updatePrescription(id, updates);
    alert('Success: Clinical audit complete and authorized.');
  };

  const respondToAlternative = async (pId: string, name: string, status: 'ACCEPTED' | 'REJECTED') => {
    const prescription = prescriptions.find(p => p.id === pId || (p as any)._id === pId);
    if (!prescription) return;

    const updatedAlternatives = prescription.alternatives?.map(a => 
      a.suggestedName === name ? { ...a, status } : a
    );

    await updatePrescription(pId, { alternatives: updatedAlternatives });
    alert(`Success: Alternative formulation ${status.toLowerCase()}.`);
  };

  const addNotification = async (n: Notification) => {
    // Notifications are mostly triggered by backend, but if needed:
    const res = await fetch(`${API_URL}/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(n)
    });
    const newN = await res.json();
    setNotifications(prev => [newN, ...prev]);
  };

  const markNotificationRead = async (id: string) => {
    await fetch(`${API_URL}/notifications/${id}/read`, { method: 'PUT' });
    setNotifications(prev => prev.map(n => n.id === id || (n as any)._id === id ? { ...n, isRead: true } : n));
  };

  const addRecurringOrder = async (ro: RecurringOrder) => {
    const res = await fetch(`${API_URL}/recurring-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ro)
    });
    const newRO = await res.json();
    setRecurringOrders(prev => [...prev, newRO]);
  };

  const updateRecurringOrder = async (id: string, updates: Partial<RecurringOrder>) => {
    const res = await fetch(`${API_URL}/recurring-orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const updatedRO = await res.json();
    setRecurringOrders(prev => prev.map(ro => ro.id === id || (ro as any)._id === id ? updatedRO : ro));
  };

  const skipOneCycle = async (id: string, reason: string, performedBy: string) => {
    // Implementation would be similar to updateRecurringOrder with specific logic
  };

  const requestEarlyRefill = async (id: string, reason: string, performedBy: string) => {
    const sub = recurringOrders.find(ro => ro.id === id || (ro as any)._id === id);
    if (!sub) return;

    const action: RefillAction = { date: new Date().toISOString(), action: 'EARLY_REQUEST', reason, performedBy };
    const request: EarlyRefillRequest = { requestedAt: new Date().toISOString(), reason, status: 'PENDING' };
    
    await updateRecurringOrder(id, { 
      earlyRefillRequest: request, 
      actionLog: [action, ...sub.actionLog] 
    });
  };

  const respondToEarlyRefill = async (id: string, status: 'APPROVED' | 'DENIED', feedback?: string) => {
    const sub = recurringOrders.find(ro => ro.id === id || (ro as any)._id === id);
    if (!sub) return;

    const action: RefillAction = { 
      date: new Date().toISOString(), 
      action: status === 'APPROVED' ? 'EARLY_APPROVED' : 'EARLY_DENIED', 
      reason: feedback || 'Pharmacist review complete.', 
      performedBy: 'PHARMACIST' 
    };

    await updateRecurringOrder(id, { 
      earlyRefillRequest: sub.earlyRefillRequest ? { ...sub.earlyRefillRequest, status, pharmacistFeedback: feedback } : undefined,
      actionLog: [action, ...sub.actionLog]
    });
  };

  const restockMedicine = async (id: string, qty: number, newExpiry: string) => {
    const sourceMed = medicines.find(m => m.id === id || (m as any)._id === id);
    if (!sourceMed) return;

    const existingWithSameExpiry = medicines.find(m => 
      m.name === sourceMed.name && 
      m.brand === sourceMed.brand && 
      m.strength === sourceMed.strength && 
      m.expiry === newExpiry
    );
    
    if (existingWithSameExpiry) {
      await updateMedicine(existingWithSameExpiry.id || (existingWithSameExpiry as any)._id, { stock: existingWithSameExpiry.stock + qty });
    } else {
      // Create new batch - strip internal IDs to avoid conflicts
      const { id: _, _id: __, __v: ___, ...medData } = sourceMed as any;
      const newMedId = `MED${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`;
      
      // Ensure all required fields are explicitly passed if they might be missing
      await addMedicine({
        ...medData,
        id: newMedId,
        stock: qty,
        expiry: newExpiry,
        status: 'ACTIVE'
      } as Medicine);
    }
  };

  const addSchedule = async (s: MedicationSchedule) => {
    const res = await fetch(`${API_URL}/medication-schedules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(s)
    });
    const newS = await res.json();
    setMedicationSchedules(prev => [...prev, newS]);
  };

  const deleteSchedule = async (id: string) => {
    await fetch(`${API_URL}/medication-schedules/${id}`, { method: 'DELETE' });
    setMedicationSchedules(prev => prev.filter(s => s.id !== id && (s as any)._id !== id));
  };

  const logMedicationStatus = async (logData: Omit<MedicationLog, 'id'>) => {
    const res = await fetch(`${API_URL}/medication-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData)
    });
    const newLog = await res.json();
    setMedicationLogs(prev => {
      const existingIndex = prev.findIndex(l => l.scheduleId === logData.scheduleId && l.slot === logData.slot && l.date === logData.date);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newLog;
        return updated;
      }
      return [...prev, newLog];
    });
  };

  const addPurchase = async (purchase: Purchase) => {
    const res = await fetch(`${API_URL}/purchases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(purchase)
    });
    const newP = await res.json();
    setPurchases(prev => [newP, ...prev]);
  };

  const addAuditLog = async (log: Omit<AuditLog, 'id'>) => {
    const res = await fetch(`${API_URL}/audit-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log)
    });
    const newLog = await res.json();
    setAuditLogs(prev => [newLog, ...prev]);
  };

  return (
    <DatabaseContext.Provider value={{
      users, medicines, suppliers, bills, prescriptions, notifications, recurringOrders, medicationSchedules, medicationLogs, purchases, auditLogs,
      addUser, updateUser, deleteUser, addMedicine, updateMedicine, deleteMedicine, addSupplier, updateSupplier, deleteSupplier,
      createBill, deleteBill, uploadPrescription, updatePrescription, deletePrescription, approvePrescriptionWithAlternatives, respondToAlternative,
      addNotification, markNotificationRead, addRecurringOrder, updateRecurringOrder, skipOneCycle, requestEarlyRefill, respondToEarlyRefill, restockMedicine, addSchedule, deleteSchedule, logMedicationStatus, addPurchase, addAuditLog
    }}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) throw new Error('useDatabase must be used within a DatabaseProvider');
  return context;
};
